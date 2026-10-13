import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { applyServerProgress } from '../utils/gameProgress'
import { apiRequest, clearAuth, getCurrentUser } from '../utils/api'

export default function MainLayout() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [ready, setReady] = React.useState(false)
  const [xp, setXp] = React.useState(() => Number(localStorage.getItem('sv-xp') || 0))
  React.useEffect(() => {
    const updateProgress = (event) => setXp(event.detail.xp)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])
  React.useEffect(() => {
    apiRequest('/progress').then(applyServerProgress).catch(() => {}).finally(() => setReady(true))
  }, [])
  if (!ready) return <main className="auth-page"><p className="eyebrow">АРХИВИУМ · СВЯЗЬ С СЕРВЕРОМ</p><p className="auth-intro">Загружаю твой личный архив…</p></main>
  return <div className="site-shell">
    <header className="site-header">
      <NavLink to="/" className="brand"><span className="brand-seal">V</span><span><b>SECTOR</b><small>VERMILLION · 41K</small></span></NavLink>
      <nav className="main-nav" aria-label="Основная навигация">
        <NavLink to="/" end>Главная</NavLink><NavLink to="/factions">Фракции</NavLink><NavLink to="/quiz">Испытание</NavLink><NavLink to="/archive/sector-ix">Сигнал</NavLink><NavLink to="/profile">Архив игрока</NavLink>
      </nav>
      <div className="header-account"><NavLink to="/profile" className="player-chip"><span className="player-avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</span><span><small>{user?.username || 'АКОЛИТ'}</small><b>{xp} XP</b></span><span className="chip-arrow">↗</span></NavLink><button className="logout-button" onClick={() => { clearAuth(); navigate('/login', { replace: true }) }}>ВЫЙТИ</button></div>
    </header>
    <Outlet />
  </div>
}
