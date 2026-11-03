import React from 'react'
import StrategicObjectMarker from './StrategicObjectMarker'

export default function StrategicObjectsLayer({ territories, selectedId, onSelectTerritory }) {
  return <g className="planet-strategic-objects">{territories.flatMap((territory) => territory.objects.map((object) => <StrategicObjectMarker key={object.id} object={object} selected={selectedId === territory.id} control={territory.control} onSelect={() => onSelectTerritory(territory)} />))}</g>
}
