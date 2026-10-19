import React from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { applyServerProgress } from '../utils/gameProgress'
import { apiRequest, clearAuth, getCurrentUser, isAuthenticated } from '../utils/api'
import { FACTION_DETAILS } from '../utils/gameProgress'
import SignalIntercept from './SignalIntercept'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const faction = FACTION_DETAILS[user?.faction] || FACTION_DETAILS.imperium
  const authenticated = isAuthenticated()
  const routeParts = location.pathname.split('/').filter(Boolean)
  const studyingLore = routeParts[0] === 'archive' && routeParts.length === 3
  const [ready, setReady] = React.useState(!authenticated)
  const [xp, setXp] = React.useState(() => Number(localStorage.getItem('sv-xp') || 0))
  React.useEffect(() => {
    const updateProgress = (event) => setXp(event.detail.xp)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])
  React.useEffect(() => {
    if (!isAuthenticated()) return
    apiRequest('/progress').then(applyServerProgress).catch(() => {}).finally(() => setReady(true))
  }, [])
  if (!ready) return <main className="auth-page"><p className="eyebrow">АРХИВИУМ · СВЯЗЬ С СЕРВЕРОМ</p><p className="auth-intro">Загружаю твой личный архив…</p></main>
  return <div className="site-shell">
    <header className="site-header">
      <NavLink to="/" className="brand"><span className="brand-seal">V</span><span><b>SECTOR</b><small>VERMILLION · 41K</small></span></NavLink>
      <nav className="main-nav" aria-label="Основная навигация">
        <NavLink to="/" end>Главная</NavLink><NavLink to="/factions">{faction.shortName}</NavLink><NavLink to="/campaign">Кампания</NavLink><NavLink to={faction.archivePath}>Досье</NavLink><NavLink to="/profile">Архив игрока</NavLink>
      </nav>
      <div className="header-account">{authenticated ? <><NavLink to="/profile" className="player-chip"><span className="player-avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</span><span><small>{user?.username || 'АКОЛИТ'}</small><b>{xp} XP</b></span><span className="chip-arrow">↗</span></NavLink><button className="logout-button" onClick={() => { clearAuth(); navigate('/', { replace: true }) }}>ВЫЙТИ</button></> : <><NavLink to="/login" className="text-link">Войти</NavLink><Link to="/register" className="button button-primary">Вступить в ряды</Link></>}</div>
    </header>
    <Outlet />
    {studyingLore && <SignalIntercept />}
  </div>
}
