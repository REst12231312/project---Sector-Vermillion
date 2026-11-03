import React from 'react'
import PlanetTerritory from './PlanetTerritory'

export default function PlanetTerritoryLayer({ territories, selectedId, hoveredId, onSelectTerritory, onHoverTerritory, guardClick, idPrefix }) {
  return <g className="planet-regions">{territories.map((territory) => <PlanetTerritory key={territory.id} territory={territory} selected={selectedId === territory.id} hovered={hoveredId === territory.id} onSelect={() => onSelectTerritory(territory)} onHover={(event) => onHoverTerritory(event ? territory.id : null)} guardClick={guardClick} hatchPatternId={`${idPrefix}-${territory.control}-hatch`} />)}</g>
}
