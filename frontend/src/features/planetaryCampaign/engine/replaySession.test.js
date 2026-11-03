import { createEmptyEraProgress } from './eraProgress'
import { beginReplaySession, recordReplayResult } from './replaySession'

test('replay results are isolated from campaign completion and duplicate battle results are ignored', () => {
  const original = { ...createEmptyEraProgress(), planets: { terra: { eras: { unification: { campaignMarker: true } } } } }
  const started = beginReplaySession(original, { planetId: 'terra', eraId: 'unification', territoryId: 'north', missionId: 'mission-1' }, 'session-1')
  const result = { battleId: 'battle-1', planetId: 'terra', eraId: 'unification', territoryId: 'north', missionId: 'mission-1', outcome: 'victory' }
  const recorded = recordReplayResult(started.progress, 'session-1', result)
  expect(recorded.planets.terra.eras.unification.campaignMarker).toBe(true)
  expect(recorded.planets.terra.eras.unification.completedMissionIds).toBeUndefined()
  expect(recorded.planets.terra.eras.unification.replaySessions['session-1'].results).toHaveLength(1)
  expect(recordReplayResult(recorded, 'session-1', result)).toBe(recorded)
})
