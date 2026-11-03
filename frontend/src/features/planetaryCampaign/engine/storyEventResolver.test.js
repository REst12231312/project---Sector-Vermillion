import { resolveStoryEvents } from './storyEventResolver'

test('supports mission, territory, era, and dossier triggers and fires each event only once', () => {
  const events = [
    { id: 'mission', trigger: { type: 'mission_completed', missionId: 'm1' }, actions: [{ type: 'unlock_era', eraId: 'siege' }] },
    { id: 'territory', trigger: { type: 'territory_completed', territoryId: 'north' }, actions: [] },
    { id: 'era', trigger: { type: 'era_completed', eraId: 'early' }, actions: [] },
    { id: 'dossier', trigger: { type: 'dossier_unlocked', dossierId: 'entry' }, actions: [] },
    { id: 'unknown', trigger: { type: 'unknown' }, actions: [] },
  ]
  const context = { completedMissionIds: ['m1'], completedTerritoryIds: ['north'], completedEraIds: ['early'], unlockedDossierIds: ['entry'] }
  const first = resolveStoryEvents(events, context)
  expect(first.firedEvents).toEqual(['mission', 'territory', 'era', 'dossier'])
  expect(first.actions).toEqual([{ type: 'unlock_era', eraId: 'siege', sourceEventId: 'mission' }])
  expect(resolveStoryEvents(events, context, first.firedEventIds).firedEvents).toEqual([])
})
