import React from 'react'

const missionGlyph = {
  capture: <><path d="M-1-11v22M0-10h11l-3 4 3 4H0"/><path d="M-6 11h11"/></>,
  destroy: <><path d="m0-11 2.5 6.5L10-2l-5 4 1 8-6-4-6 4 1-8-5-4 7.5-2.5z"/><circle r="2"/></>,
  defend: <><path d="M0-11 9-7v6c0 5-4 9-9 12-5-3-9-7-9-12v-6z"/><path d="m-4 0 3 3 6-7"/></>,
}

const stateText = { locked: 'Заблокирована', available: 'Доступна', in_progress: 'В процессе', completed: 'Завершена' }

export default function MapMissionMarker({ mission, territory, position, selected, onSelect, guardClick }) {
  const status = mission.status || 'locked'
  return <g className={`map-mission-marker mission-${mission.mission.type} state-${status}${selected ? ' is-selected' : ''}`} transform={`translate(${position.x} ${position.y})`} role="button" tabIndex={0} aria-label={`${mission.mission.name}: ${stateText[status]}`} aria-pressed={selected} onClick={(event) => { event.stopPropagation(); guardClick(() => onSelect(territory, mission), event) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); guardClick(() => onSelect(territory, mission), event) } }}>
    <title>{mission.mission.name} · {stateText[status]}</title>
    <circle className="map-mission-halo" r="21"/><circle className="map-mission-ring" r="17"/>
    <g className="map-mission-glyph" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{missionGlyph[mission.mission.type] || missionGlyph.capture}</g>
    {status === 'locked' && <g className="map-mission-state-glyph" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="7" width="9" height="8" rx="1"/><path d="M11 7V5a2.5 2.5 0 0 1 5 0v2"/></g>}
    {status === 'completed' && <path className="map-mission-complete" d="m10-14 3 3 6-7"/>}
    {status === 'in_progress' && <path className="map-mission-progress" d="M0-22a22 22 0 0 1 20 13"/>}
    <text className="map-mission-type" x="0" y="29" textAnchor="middle">{mission.mission.type === 'capture' ? 'ЗАХВАТ' : mission.mission.type === 'destroy' ? 'УНИЧТОЖЕНИЕ' : 'ОБОРОНА'}</text>
  </g>
}
