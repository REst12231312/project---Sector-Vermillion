import React from 'react'

const controlNames = { enemy: 'Противник', contested: 'Оспаривается', player: 'Империум' }

export default function PlanetTerritory({ territory, selected, hovered, onSelect, onHover, guardClick, hatchPatternId }) {
  const select = (event) => guardClick(() => onSelect(), event)
  return <g data-territory="true" className={`planet-territory control-${territory.control} availability-${territory.availability}${selected ? ' is-selected' : ''}${hovered ? ' is-hovered' : ''}`} role="button" tabIndex={0} aria-pressed={selected} aria-label={`${territory.name}: ${controlNames[territory.control]}, ${territory.availability === 'locked' ? 'операции закрыты' : territory.availability === 'completed' ? 'кампания завершена' : territory.availability === 'in_progress' ? 'кампания продолжается' : 'есть доступная операция'}`} onClick={select} onFocus={onHover} onBlur={() => onHover(null)} onMouseEnter={onHover} onMouseLeave={() => onHover(null)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); guardClick(() => onSelect(), event) } }}>
    <path className="planet-territory-shape" d={territory.path} />
    <path className="planet-territory-pattern" d={territory.path} fill={`url(#${hatchPatternId})`} />
  </g>
}
