import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sector-vermillion-progression-'))
process.env.SECTOR_DATA_DIRECTORY = dataDirectory
const game = await import('../services/gameService.js')
const storage = await import('../storage.js')
const operationId = 'imperium-origin'
const campaign = {
  campaignId: 'terra-unification', planetId: 'terra', eraId: 'unification', factionId: 'imperium',
}
const missions = [
  ['terra-north-capture', 'terra-northern-front'],
  ['terra-north-destroy', 'terra-northern-front'],
  ['terra-north-defend', 'terra-northern-front'],
  ['terra-west-basin-capture', 'terra-western-basin'],
  ['terra-east-reach-capture', 'terra-eastern-reach'],
  ['terra-central-plateau-capture', 'terra-central-plateau'],
  ['terra-southern-expanse-capture', 'terra-southern-expanse'],
]

after(() => {
  delete process.env.SECTOR_DATA_DIRECTORY
  fs.rmSync(dataDirectory, { recursive: true, force: true })
})

function recordVictory(profileId, missionId, index) {
  return game.recordTacticalMission(profileId, 'imperium', operationId, {
    ...campaign, missionId, resultId: `${profileId}-${missionId}-win`, outcome: 'victory', rounds: index + 2, survivingUnits: 2,
  })
}

test('tactical campaign validates faction, mission IDs, and northern mission prerequisites', () => {
  assert.equal(game.recordTacticalMission('pilot-a', 'imperium', operationId, { ...campaign, missionId: 'unknown', resultId: 'x', outcome: 'victory' }).status, 404)
  assert.equal(game.recordTacticalMission('pilot-a', 'chaos', operationId, { ...campaign, missionId: missions[0][0], resultId: 'x', outcome: 'victory' }).status, 403)
  assert.equal(game.recordTacticalMission('pilot-a', 'imperium', operationId, { ...campaign, missionId: missions[1][0], resultId: 'x', outcome: 'victory' }).status, 403)
  assert.equal(game.recordTacticalMission('pilot-a', 'imperium', operationId, { ...campaign, missionId: missions[0][0], resultId: 'defeat', outcome: 'defeat' }).progress.tacticalCampaigns[operationId].completedMissionIds.length, 0)
  recordVictory('pilot-a', missions[0][0], 0)
  assert.equal(game.recordTacticalMission('pilot-a', 'imperium', operationId, { ...campaign, missionId: missions[1][0], resultId: 'north-2', outcome: 'victory' }).progress.tacticalCampaigns[operationId].completedMissionIds.includes(missions[1][0]), true)
})

test('tactical campaign rewards are server-gated, persisted, and idempotent', () => {
  for (const [index, [missionId]] of missions.entries()) recordVictory('pilot-b', missionId, index)
  const incomplete = game.completeTacticalCampaign('pilot-c', 'imperium', operationId)
  assert.equal(incomplete.status, 403)

  for (const [index, [missionId]] of missions.entries()) recordVictory('pilot-b', missionId, index)
  const first = game.completeTacticalCampaign('pilot-b', 'imperium', operationId)
  assert.equal(first.reward.xpGranted, 100)
  assert.equal(first.reward.alreadyClaimed, false)
  assert.equal(first.progress.xp, 100)
  assert.deepEqual(first.progress.achievements, ['campaign-imperium-origin'])
  assert.deepEqual(first.progress.completedLevels, [operationId])
  assert.deepEqual(first.progress.rewardGrants, [`operation:${operationId}:completion`])
  assert.equal(first.result.completedMissions.length, missions.length)
  assert.deepEqual(first.result.statistics, { totalRounds: 35, unitsLost: 7, survivingUnits: 2, territoriesCaptured: 5 })

  const repeated = game.completeTacticalCampaign('pilot-b', 'imperium', operationId)
  assert.equal(repeated.reward.xpGranted, 0)
  assert.equal(repeated.reward.alreadyClaimed, true)
  assert.equal(repeated.progress.achievements.length, 1)
  assert.equal(game.getState('pilot-b').xp, 100)
  assert.equal(game.getState('pilot-c').xp, 0)
})

test('legacy completion prevents tactical duplicate XP and shares the same achievement and dossier', () => {
  const legacy = game.completeCampaign('pilot-legacy', 'imperium', operationId)
  assert.equal(legacy.state.xp, 100)
  assert.ok(legacy.state.completedLevels.includes(operationId))
  for (const [index, [missionId]] of missions.entries()) recordVictory('pilot-legacy', missionId, index)
  const tactical = game.completeTacticalCampaign('pilot-legacy', 'imperium', operationId)
  assert.equal(tactical.reward.xpGranted, 0)
  assert.equal(tactical.reward.alreadyClaimed, true)
  assert.equal(tactical.progress.xp, 100)
  assert.deepEqual(tactical.progress.achievements, ['campaign-imperium-origin'])
  assert.deepEqual(tactical.progress.completedLevels, [operationId])
})

test('legacy progress migrates with reward and tactical ledgers without dropping saved fields', () => {
  storage.saveProgress('pilot-migrated', { xp: 40, completedLevels: ['imperium-origin'], achievements: [], interceptedLore: {} })
  const migrated = game.getState('pilot-migrated')
  assert.deepEqual(migrated.rewardGrants, [])
  assert.deepEqual(migrated.tacticalCampaigns, {})
  assert.equal(migrated.xp, 40)
  assert.deepEqual(migrated.completedLevels, ['imperium-origin'])
})

test('damaged tactical campaign data is normalized and cannot falsely unlock the reward', () => {
  storage.saveProgress('pilot-damaged', { xp: 12, completedLevels: [], achievements: [], tacticalCampaigns: { [operationId]: { completedMissionIds: missions.map(([id]) => id), results: {}, completedAt: [], statistics: [] } } })
  const result = game.completeTacticalCampaign('pilot-damaged', 'imperium', operationId)
  assert.equal(result.status, 403)
  assert.equal(game.getState('pilot-damaged').xp, 12)
})
