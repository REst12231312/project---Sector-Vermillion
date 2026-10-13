import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { applyServerProgress, getProgress } from '../utils/gameProgress'
import { postJson } from '../utils/api'

export default function MainLayout() {
  const [xp, setXp] = React.useState(() => Number(localStorage.getItem('sv-xp') || 0))
  React.useEffect(() => {
    const updateProgress = (event) => setXp(event.detail.xp)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])
  React.useEffect(() => { postJson('/progress/sync', getProgress()).then(applyServerProgress).catch(() => {}) }, [])
  return <div className="site-shell">
    <header className="site-header">
      <NavLink to="/" className="brand"><span className="brand-seal">V</span><span><b>SECTOR</b><small>VERMILLION · 41K</small></span></NavLink>
      <nav className="main-nav" aria-label="Основная навигация">
        <NavLink to="/" end>Главная</NavLink><NavLink to="/factions">Фракции</NavLink><NavLink to="/quiz">Испытание</NavLink><NavLink to="/archive/sector-ix">Сигнал</NavLink><NavLink to="/profile">Архив игрока</NavLink>
      </nav>
      <NavLink to="/profile" className="player-chip"><span className="player-avatar">A</span><span><small>АКОЛИТ</small><b>{xp} XP</b></span><span className="chip-arrow">↗</span></NavLink>
    </header>
    <Outlet />
  </div>
}
