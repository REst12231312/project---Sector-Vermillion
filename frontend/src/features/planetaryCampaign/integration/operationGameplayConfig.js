export const operationGameplayConfigs = {
  'imperium-origin': {
    operationId: 'imperium-origin',
    campaignId: 'terra-unification',
    enabled: true,
    gameplayMode: 'planetary_tactical',
    planetId: 'terra',
    eraId: 'unification',
    factionId: 'imperium',
  },
}

export function getOperationGameplayConfig(operationId) {
  const config = operationGameplayConfigs[operationId]
  if (!config?.enabled || config.gameplayMode !== 'planetary_tactical') return { operationId, gameplayMode: 'legacy' }
  return { ...config }
}
