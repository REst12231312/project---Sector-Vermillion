import { getTerritoryMissionStatuses } from './territoryProgress'

export function resolveTerritoryMapState(regions, territories, missionById, progress) {
  const objectStates = new Map(Object.values(progress.missionRecords || {}).flatMap((record) => (record?.strategicObjects || []).map((object) => [object.id, object])))
  return regions.map((region) => {
    const territory = territories.find((entry) => entry.id === region.territoryId)
    const missionStatuses = territory ? getTerritoryMissionStatuses(territory, progress) : []
    const completedCount = missionStatuses.filter((entry) => entry.status === 'completed').length
    const active = Boolean(progress.activeMissionId && territory?.missions.includes(progress.activeMissionId))
    let availability = 'locked'
    if (missionStatuses.length > 0) {
      if (completedCount === missionStatuses.length) availability = 'completed'
      else if (active || completedCount > 0) availability = 'in_progress'
      else if (missionStatuses.some((entry) => entry.status === 'available')) availability = 'available'
    }
    const missionResults = missionStatuses.map((entry) => ({ ...entry, mission: missionById[entry.missionId] }))
      .filter((entry) => entry.mission)
    return {
      ...region,
      objects: region.objects.map((object) => {
        const state = objectStates.get(object.id)
        return state ? { ...object, status: state.status, destroyed: state.status === 'destroyed', hp: state.hp, maxHp: state.maxHp } : object
      }),
      planetId: territory?.planetId,
      eraId: territory?.eraId,
      strategicValue: territory?.strategicValue,
      control: progress.territoryControls?.[region.territoryId] || (region.territoryId === 'terra-northern-front' ? progress.territoryControl : region.defaultControl),
      availability,
      completedCount,
      totalMissions: missionStatuses.length,
      missionResults,
    }
  })
}

export function resolveFrontlines(regions) {
  const byId = new Map(regions.map((region) => [region.id, region]))
  const segments = []
  const seen = new Set()
  for (const region of regions) {
    for (const neighborId of region.neighbors) {
      const neighbor = byId.get(neighborId)
      if (!neighbor || region.control === neighbor.control) continue
      const key = [region.id, neighborId].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      const path = region.borders[neighborId] || neighbor.borders[region.id]
      if (path) segments.push({ id: key, path, leftControl: region.control, rightControl: neighbor.control })
    }
  }
  return segments
}
