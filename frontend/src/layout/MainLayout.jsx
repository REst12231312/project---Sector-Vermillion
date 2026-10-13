import React from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { applyServerProgress } from '../utils/gameProgress'
import { apiRequest, clearAuth, getCurrentUser, isAuthenticated } from '../utils/api'

export default function MainLayout() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const authenticated = isAuthenticated()
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
        <NavLink to="/" end>Главная</NavLink><NavLink to="/factions">Фракции</NavLink><NavLink to="/quiz">Испытание</NavLink><NavLink to="/archive/sector-ix">Следы лора</NavLink><NavLink to="/profile">Архив игрока</NavLink>
      </nav>
      <div className="header-account">{authenticated ? <><NavLink to="/profile" className="player-chip"><span className="player-avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</span><span><small>{user?.username || 'АКОЛИТ'}</small><b>{xp} XP</b></span><span className="chip-arrow">↗</span></NavLink><button className="logout-button" onClick={() => { clearAuth(); navigate('/', { replace: true }) }}>ВЫЙТИ</button></> : <><NavLink to="/login" className="text-link">Войти</NavLink><Link to="/register" className="button button-primary">Вступить в ряды</Link></>}</div>
    </header>
    <Outlet />
  </div>
}
