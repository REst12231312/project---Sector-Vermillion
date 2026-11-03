import { apiRequest, getCurrentUser, postJson } from '../../../utils/api'
import { applyServerProgress, getFactionRank } from '../../../utils/gameProgress'
import { planetEraConfigs } from '../data/planetEras'
import { getOperationGameplayConfig } from './operationGameplayConfig'
import { getCampaignStatistics } from '../engine/campaignStatistics'

const operationAwards = {
  'imperium-origin': { id: 'campaign-imperium-origin', name: 'Объединитель Терры', description: 'Заверши операцию «Объединение Терры».' },
}

export async function completeTacticalCampaign(operationId, territoryProgress) {
  const config = getOperationGameplayConfig(operationId)
  if (config.gameplayMode !== 'planetary_tactical' || !config.campaignId) throw new Error('Для этой операции не настроена тактическая кампания.')
  const era = planetEraConfigs.find((item) => item.planetId === config.planetId && item.id === config.eraId)
  if (!era?.requiredMissionIds?.length) throw new Error('Не найдены обязательные миссии кампании.')
  const before = await apiRequest('/progress')
  applyServerProgress(before)
  const faction = getCurrentUser()?.faction || config.factionId
  const statistics = getCampaignStatistics(territoryProgress, era.requiredMissionIds)

  for (const missionId of era.requiredMissionIds) {
    const record = territoryProgress?.missionRecords?.[missionId]
    if (record?.outcome !== 'victory') throw new Error(`Нет подтверждённой победы в миссии «${missionId}».`)
    await postJson(`/campaign/tactical/${encodeURIComponent(operationId)}/mission`, {
      campaignId: config.campaignId,
      planetId: config.planetId,
      eraId: config.eraId,
      factionId: faction,
      missionId,
      resultId: record.id,
      outcome: record.outcome,
      rounds: record.rounds,
      survivingUnits: record.survivingUnits?.length || 0,
      completedAt: record.completedAt,
    })
  }

  const response = await postJson(`/campaign/tactical/${encodeURIComponent(operationId)}/complete`, {})
  if (!response.progress || !response.reward || !response.result) throw new Error('Сервер не вернул подтверждённый результат кампании.')
  const progress = applyServerProgress(response.progress)
  const currentRank = getFactionRank(before.xp, faction)
  const nextRank = getFactionRank(progress.xp, faction)
  const award = operationAwards[operationId]
  return {
    result: response.result,
    reward: response.reward,
    statistics: response.result.statistics || statistics,
    award: award && progress.achievements.includes(award.id) ? award : null,
    dossierUnlocked: Array.isArray(progress.completedLevels) && progress.completedLevels.includes(operationId),
    rankUp: response.reward.xpGranted > 0 && currentRank.id !== nextRank.id ? { previous: currentRank, current: nextRank } : null,
    progress,
  }
}
