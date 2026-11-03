import { resolveEraStatuses, validateEraConfigs } from './unlockResolver'
import { planetEraConfigs } from '../data/planetEras'

const eras = [
  { id: 'early', planetId: 'terra', mapId: 'map-1', unlock: { type: 'default' }, requiredMissionIds: ['op-1'] },
  { id: 'late', planetId: 'terra', mapId: 'map-2', unlock: { type: 'all_completed', conditions: [{ type: 'mission_completed', missionId: 'op-2' }, { type: 'dossier_unlocked', dossierId: 'entry-1' }] } },
]

test('default era is open and a hidden era opens only when all configured conditions are met', () => {
  expect(resolveEraStatuses(eras).map(({ status }) => status)).toEqual(['unlocked', 'hidden'])
  expect(resolveEraStatuses(eras, { completedMissionIds: ['op-2'], unlockedDossierIds: ['entry-1'] }).map(({ status }) => status)).toEqual(['unlocked', 'unlocked'])
})

test('supports territory and era completion, any conditions, and unknown conditions fail closed', () => {
  const entries = [
    ...eras,
    { id: 'after', planetId: 'terra', mapId: 'map-3', unlock: { type: 'any_completed', conditions: [{ type: 'territory_completed', territoryId: 'north' }, { type: 'era_completed', eraId: 'early' }] } },
    { id: 'unknown', planetId: 'terra', mapId: 'map-4', unlock: { type: 'future_unlock' } },
  ]
  const statuses = resolveEraStatuses(entries, { completedTerritoryIds: ['north'], completedEraIds: ['early'] })
  expect(statuses.find(({ eraId }) => eraId === 'after').status).toBe('unlocked')
  expect(statuses.find(({ eraId }) => eraId === 'unknown').status).toBe('hidden')
})

test('marks eras completed and detects cyclic era dependencies and invalid config', () => {
  expect(resolveEraStatuses(eras, { completedMissionIds: ['op-1'] })[0].status).toBe('completed')
  const cyclic = [
    { id: 'a', planetId: 'terra', mapId: 'a', unlock: { type: 'era_completed', eraId: 'b' } },
    { id: 'b', planetId: 'terra', mapId: 'b', unlock: { type: 'era_completed', eraId: 'a' } },
  ]
  expect(validateEraConfigs(cyclic).some((error) => error.includes('цикл'))).toBe(true)
  expect(validateEraConfigs([{ ...eras[0], unlock: { type: 'unknown' } }]).length).toBeGreaterThan(0)
})

test('the shipped Terra era configurations pass structural and dependency validation', () => {
  expect(validateEraConfigs(planetEraConfigs)).toEqual([])
})
