import React from 'react'

export default function FrontlineOverlay({ segments, markerId }) {
  return <g className="planet-frontlines" aria-label="Линии фронта" pointerEvents="none">
    {segments.map((segment) => <g key={segment.id} className={`planet-frontline-segment frontier-${segment.leftControl}-${segment.rightControl}`}>
      <path d={segment.path} className="planet-frontline-underlay" />
      <path d={segment.path} className="planet-frontline" markerEnd={`url(#${markerId})`} />
      <path d={segment.path} className="planet-frontline-dashes" />
    </g>)}
  </g>
}
