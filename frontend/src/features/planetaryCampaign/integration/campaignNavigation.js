import { getOperationGameplayConfig } from './operationGameplayConfig'

export const DEFAULT_CAMPAIGN_RETURN_PATH = '/campaign'

// Return destinations are intentionally limited to the campaign map route.
export function getSafeCampaignReturnPath(candidate) {
  return candidate === DEFAULT_CAMPAIGN_RETURN_PATH ? candidate : DEFAULT_CAMPAIGN_RETURN_PATH
}

export function buildOperationCampaignPath(operationId, returnPath = DEFAULT_CAMPAIGN_RETURN_PATH) {
  const config = getOperationGameplayConfig(operationId)
  if (config.gameplayMode !== 'planetary_tactical') return null
  const query = new URLSearchParams({
    operationId: config.operationId,
    planetId: config.planetId,
    eraId: config.eraId,
    factionId: config.factionId,
    returnPath: getSafeCampaignReturnPath(returnPath),
  })
  return `/planets/${encodeURIComponent(config.planetId)}/eras/${encodeURIComponent(config.eraId)}?${query.toString()}`
}

export function readOperationCampaignContext(searchParams) {
  const operationId = searchParams.get('operationId')
  if (!operationId) return { operation: null, error: null, returnPath: DEFAULT_CAMPAIGN_RETURN_PATH }
  const config = getOperationGameplayConfig(operationId)
  const matches = config.gameplayMode === 'planetary_tactical'
    && searchParams.get('planetId') === config.planetId
    && searchParams.get('eraId') === config.eraId
    && searchParams.get('factionId') === config.factionId
  if (!matches) return { operation: null, error: 'Контекст кампании некорректен или отключён.', returnPath: DEFAULT_CAMPAIGN_RETURN_PATH }
  return { operation: config, error: null, returnPath: getSafeCampaignReturnPath(searchParams.get('returnPath')) }
}

export function appendOperationContext(searchParams, operation, returnPath = DEFAULT_CAMPAIGN_RETURN_PATH) {
  if (!operation) return ''
  const query = new URLSearchParams(searchParams)
  query.set('operationId', operation.operationId)
  query.set('planetId', operation.planetId)
  query.set('eraId', operation.eraId)
  query.set('factionId', operation.factionId)
  query.set('returnPath', getSafeCampaignReturnPath(returnPath))
  return `&${query.toString()}`
}
