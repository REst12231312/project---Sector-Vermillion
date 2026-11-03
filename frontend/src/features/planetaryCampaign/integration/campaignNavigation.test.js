import { appendOperationContext, buildOperationCampaignPath, getSafeCampaignReturnPath, readOperationCampaignContext } from './campaignNavigation'
import { getOperationGameplayConfig, operationGameplayConfigs } from './operationGameplayConfig'

test('the existing Imperium Terra operation uses the tactical route and can be switched back to legacy', () => {
  expect(getOperationGameplayConfig('imperium-origin')).toMatchObject({ operationId: 'imperium-origin', gameplayMode: 'planetary_tactical', planetId: 'terra', eraId: 'unification', factionId: 'imperium' })
  expect(buildOperationCampaignPath('imperium-origin')).toContain('/planets/terra/eras/unification?')
  expect(getOperationGameplayConfig('great-crusade').gameplayMode).toBe('legacy')
  const wasEnabled = operationGameplayConfigs['imperium-origin'].enabled
  operationGameplayConfigs['imperium-origin'].enabled = false
  expect(getOperationGameplayConfig('imperium-origin').gameplayMode).toBe('legacy')
  expect(buildOperationCampaignPath('imperium-origin')).toBeNull()
  operationGameplayConfigs['imperium-origin'].enabled = wasEnabled
})

test('campaign context accepts only matching IDs and a safe internal return destination', () => {
  const query = new URLSearchParams({ operationId: 'imperium-origin', planetId: 'terra', eraId: 'unification', factionId: 'imperium', returnPath: 'https://example.com' })
  expect(readOperationCampaignContext(query)).toMatchObject({ operation: { operationId: 'imperium-origin' }, returnPath: '/campaign', error: null })
  query.set('planetId', 'mars')
  expect(readOperationCampaignContext(query).error).toBeTruthy()
  expect(getSafeCampaignReturnPath('/campaign?level=great-crusade')).toBe('/campaign')
  expect(getSafeCampaignReturnPath('//example.com')).toBe('/campaign')
  expect(appendOperationContext(new URLSearchParams(), null)).toBe('')
})
