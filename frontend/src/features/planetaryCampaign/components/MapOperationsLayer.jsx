import React from 'react'
import MapMissionMarker from './MapMissionMarker'
import { missionMapPositions } from '../data/missionMapPositions'

export default function MapOperationsLayer({ eraId, territories, selectedMissionId, onSelectMission, guardClick }) {
  const positions = missionMapPositions[eraId] || {}
  return <g className="map-operations-layer">{territories.flatMap((territory) => territory.missionResults.map((mission) => {
    const position = positions[mission.missionId]
    return position ? <MapMissionMarker key={mission.missionId} mission={mission} territory={territory} position={position} selected={selectedMissionId === mission.missionId} onSelect={onSelectMission} guardClick={guardClick} /> : null
  }))}</g>
}
