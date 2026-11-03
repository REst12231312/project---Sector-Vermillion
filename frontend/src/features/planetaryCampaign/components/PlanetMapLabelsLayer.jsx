import React from 'react'

export default function PlanetMapLabelsLayer({ map, territories, selectedId, hoveredId, lod, landmarks = [] }) {
  return <g className="planet-map-labels" aria-hidden="true" pointerEvents="none">
    <g className="planet-territory-labels">{territories.map((territory) => <text key={territory.id} className={`planet-territory-label${selectedId === territory.id ? ' is-selected' : ''}${hoveredId === territory.id ? ' is-hovered' : ''}`} x={territory.center.x} y={territory.center.y} textAnchor="middle">{territory.name.toUpperCase()}</text>)}</g>
    <g className="planet-landmark-labels">{landmarks.map((item) => <text key={item.text} x={item.x} y={item.y + (item.dy || 0)}>{item.text}</text>)}</g>
  </g>
}
