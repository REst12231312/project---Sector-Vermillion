export function getCampaignStatistics(progress, requiredMissionIds = []) {
  const missionRecords = progress?.missionRecords && typeof progress.missionRecords === 'object' ? progress.missionRecords : {}
  const completedMissions = requiredMissionIds
    .map((missionId) => missionRecords[missionId])
    .filter((record) => record?.outcome === 'victory')
  const territories = new Set(completedMissions.map((record) => record.territoryId).filter(Boolean))
  return {
    totalRounds: completedMissions.reduce((sum, record) => sum + (Number(record.rounds) || 0), 0),
    unitsLost: completedMissions.reduce((sum, record) => sum + Math.max(0, 3 - (record.survivingUnits?.length || 0)), 0),
    survivingUnits: completedMissions.at(-1)?.survivingUnits?.length || 0,
    territoriesCaptured: territories.size,
    completedMissions: completedMissions.map((record) => record.missionId),
  }
}
