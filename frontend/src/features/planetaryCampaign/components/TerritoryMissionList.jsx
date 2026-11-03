import React from 'react'

const statusLabels = { completed: 'Завершена', available: 'Доступна', in_progress: 'В процессе', locked: 'Заблокирована' }

export default function TerritoryMissionList({ territory, missions, statuses, onLaunch, onReplay, featuredMissionId = null }) {
  const visibleMissionIds = territory.missions.filter((missionId) => missionId !== featuredMissionId)
  return <div className="territory-mission-list">{visibleMissionIds.map((missionId) => {
    const mission = missions[missionId]
    const entry = statuses.find((item) => item.missionId === missionId)
    const record = entry?.result
    return <article className={`territory-mission-card mission-${entry?.status}`} key={missionId}>
      <span className="territory-mission-number">{String(territory.missions.indexOf(missionId) + 1).padStart(2, '0')}</span>
      <div className="territory-mission-copy"><p className="tactical-card-kicker">{mission.type === 'capture' ? 'ЗАХВАТ' : mission.type === 'destroy' ? 'УНИЧТОЖЕНИЕ' : 'ОБОРОНА'} · {statusLabels[entry?.status]}</p><h3>{mission.name}</h3><p>{mission.description}</p>{record && <small className="territory-result-preview">Последний результат: {record.outcome === 'victory' ? 'победа' : record.outcome === 'draw' ? 'ничья' : 'поражение'} · раундов {record.rounds}</small>}</div>
      {(entry?.status === 'available' || entry?.status === 'in_progress') && missionId !== featuredMissionId && <button type="button" onClick={() => onLaunch(mission)}>{entry.status === 'in_progress' ? 'Открыть операцию' : 'Начать операцию'} <span>→</span></button>}
      {entry?.status === 'completed' && onReplay && <button type="button" className="territory-replay-button" onClick={() => onReplay(mission)}>Повторить без наград <span>↻</span></button>}
    </article>
  })}</div>
}
