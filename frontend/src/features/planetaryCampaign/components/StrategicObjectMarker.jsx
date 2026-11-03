import React from 'react'

const glyphs = {
  fortress: <><path d="M-8 8V-3l4-4 4 4 4-4 4 4V8z"/><path d="M-3 8V2h6v6"/></>,
  command: <><path d="M0-10 9 0 0 10-9 0z"/><circle r="3"/></>,
  artillery: <><path d="M-8 7 3-6l4 3-8 10z"/><path d="M1-5 8-10M-5 7h11"/></>,
  supply: <><path d="M-8-6h16v13h-16z"/><path d="M-4-2h8M-4 2h8"/></>,
  control: <><circle r="8"/><path d="M0-5v10M-5 0h10"/></>,
  industry: <><path d="M-9 8V-3l5 3v-8l6 4v-7l7 9h3v10z"/><path d="M-4 4v2M2 4v2M8 4v2"/></>,
  ruins: <><path d="M-9 8V-3l4-4 4 3 3-8 4 7 5-2 2 4v11z"/><path d="m-4-1 3 3-2 4m9-6-3 3 4 3"/></>,
}

export default function StrategicObjectMarker({ object, selected = false, control = 'enemy', onSelect }) {
  const destroyed = object.status === 'destroyed' || object.destroyed
  return <g className={`planet-strategic-marker marker-${object.type}${selected ? ' is-region-selected' : ''}${destroyed ? ' is-destroyed' : ''}`} transform={`translate(${object.x} ${object.y})`} role="button" tabIndex={0} aria-label={`${object.name}${destroyed ? ', уничтожен' : ''}`} onClick={(event) => { event.stopPropagation(); onSelect?.() }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect?.() } }}>
    <title>{object.name}</title>
    <circle className="planet-marker-halo" r="13" />
    {destroyed && <path className="planet-marker-destroyed-mark" d="M-5-5 5 5M5-5-5 5" />}
    <g className="planet-marker-glyph" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{glyphs[object.type] || glyphs.control}</g>
    <desc>{control === 'player' ? 'Объект на территории Империума' : control === 'contested' ? 'Объект в зоне боёв' : 'Объект во вражеском секторе'}</desc>
  </g>
}
