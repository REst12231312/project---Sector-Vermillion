import React from 'react'
import { Link } from 'react-router-dom'

export default function EraArchive({ planet, eras, statuses, progressByEra }) {
  const visible = eras.map((era) => ({ era, state: statuses.find((item) => item.eraId === era.id) }))
    .filter((entry) => entry.state?.status === 'unlocked' || entry.state?.status === 'completed')
  return <section className="era-archive" aria-label="Исторический архив">
    <div className="era-archive-heading"><div><p className="era-kicker">ХРОНОЛОГИЯ ПЛАНЕТЫ</p><h2>Исторический архив</h2></div><span>ДОСТУПНЫЕ ПЕРИОДЫ</span></div>
    <div className="era-archive-list">{visible.map(({ era, state }) => {
      const progress = progressByEra[era.id]
      const completed = era.requiredMissionIds.filter((id) => progress.completedMissionIds.includes(id)).length
      const total = era.requiredMissionIds.length
      return <article className={`era-archive-card era-${state.status}`} key={era.id}>
        <div className="era-card-mark">{state.status === 'completed' ? '✓' : String(era.chronologicalOrder).padStart(2, '0')}</div>
        <div className="era-card-copy"><p className="era-kicker">{state.status === 'completed' ? 'ЭПОХА ЗАВЕРШЕНА' : 'ДОСТУПНА'}</p><h3>{era.title}</h3><p>{era.description}</p><small>Операции эпохи: {completed}/{total}</small></div>
        <Link to={`/planets/${planet.id}/eras/${era.id}${era.territoryIds[0] ? `?territory=${encodeURIComponent(era.territoryIds[0])}` : ''}`} aria-label={`Открыть эпоху: ${era.title}`}>Перейти <span>→</span></Link>
      </article>
    })}</div>
  </section>
}
