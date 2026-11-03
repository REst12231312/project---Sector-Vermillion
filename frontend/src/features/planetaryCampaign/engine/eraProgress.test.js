import { buildEraUnlockContext, createEmptyEraProgress, getEraProgressStorageKey, loadEraProgress, reconcileEraProgress } from './eraProgress'

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) }
}

test('loads corrupt saves safely and isolates the ledger by account', () => {
  const user = { id: 'user-a' }
  const storage = makeStorage({ [getEraProgressStorageKey(user)]: '{broken' })
  expect(loadEraProgress(storage, user)).toEqual(createEmptyEraProgress())
  expect(getEraProgressStorageKey(user)).not.toBe(getEraProgressStorageKey({ id: 'user-b' }))
  expect(reconcileEraProgress({ version: 1, planets: { terra: { pendingEraNotifications: 'bad-data', replaySessions: [] } } }, { planetId: 'terra', eraStatuses: [], eras: [] }).progress.planets.terra.pendingEraNotifications).toEqual([])
})

test('uses the real dossier state and presents a newly unlocked era once', () => {
  const context = buildEraUnlockContext({ completedLevels: ['story-op'], discoveredEntries: ['archive-entry'], readEntries: [] }, {}, [], [])
  expect(context.unlockedDossierIds).toContain('archive-entry')
  expect(context.unlockedDossierIds).not.toContain('story-op')
  const eras = [
    { id: 'default', unlock: { type: 'default' } },
    { id: 'secret', unlock: { type: 'mission_completed', missionId: 'story-op' } },
  ]
  const statuses = [{ eraId: 'default', status: 'unlocked' }, { eraId: 'secret', status: 'unlocked' }]
  const event = [{ id: 'event-1', trigger: { type: 'mission_completed', missionId: 'story-op' }, actions: [{ type: 'unlock_era', eraId: 'secret' }] }]
  const first = reconcileEraProgress(createEmptyEraProgress(), { planetId: 'terra', eraStatuses: statuses, eras, storyEvents: event, unlockContext: { completedMissionIds: ['story-op'] } })
  expect(first.progress.planets.terra.pendingEraNotifications).toEqual(['secret'])
  const second = reconcileEraProgress(first.progress, { planetId: 'terra', eraStatuses: statuses, eras, storyEvents: event, unlockContext: { completedMissionIds: ['story-op'] } })
  expect(second.progress.planets.terra.pendingEraNotifications).toEqual(['secret'])
  expect(second.newlyFiredEventIds).toEqual([])
})
