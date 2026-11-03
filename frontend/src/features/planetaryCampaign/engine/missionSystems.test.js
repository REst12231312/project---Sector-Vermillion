import { missionById, missionConfigs } from '../data/missions'
import { territoryById } from '../data/territories'
import { createMissionBattleState, createMissionSetup, spawnDueReinforcements } from './missionEngine'
import { resolveMissionObjectives, evaluateMissionOutcome } from './objectiveResolver'
import { resolveCombat } from './combatResolver'
import { beginTerritoryMission, createEmptyTerritoryProgress, getTerritoryMissionStatuses, getTerritoryStorageKey, loadTerritoryProgress, recordTerritoryMissionResult, saveTerritoryProgress } from './territoryProgress'

const territory = territoryById['terra-northern-front']
const captureMission = missionById['terra-north-capture']

function makeEmit() {
  const events = []
  const emit = (type, unitIds, data) => events.push({ type, unitIds, data })
  return { events, emit }
}

test('defines the three configurable operation types on one 12 by 12 territory', () => {
  const territoryMissions = missionConfigs.filter((mission) => mission.territoryId === territory.id)
  expect(territoryMissions.map((mission) => mission.type)).toEqual(['capture', 'destroy', 'defend'])
  expect(territoryMissions.every((mission) => mission.mapSize.width === 12 && mission.mapSize.height === 12)).toBe(true)
  expect(territory.missions).toEqual(territoryMissions.map((mission) => mission.id))
})

test('capture progress waits while empty or contested and resets when enemies take the point', () => {
  const objective = captureMission.objectives[0]
  const point = { x: objective.x, y: objective.y }
  const ally = { id: 'a', side: 'player', hp: 5, ...point }
  const enemy = { id: 'e', side: 'enemy', hp: 5, x: point.x + 1, y: point.y }
  const base = { missionType: 'capture', objectives: [objective], missionProgress: { captureRounds: 0, control: 'enemy', contested: false } }
  const { emit } = makeEmit()

  expect(resolveMissionObjectives(base, [ally, enemy], emit)).toMatchObject({ captureRounds: 0, contested: true, control: 'contested' })
  const first = resolveMissionObjectives(base, [ally], emit)
  expect(first).toMatchObject({ captureRounds: 1, control: 'contested', contested: false })
  expect(resolveMissionObjectives({ ...base, missionProgress: first }, [], emit)).toMatchObject({ captureRounds: 1 })
  expect(resolveMissionObjectives({ ...base, missionProgress: first }, [{ ...enemy, x: point.x, y: point.y }], emit)).toMatchObject({ captureRounds: 0, control: 'enemy' })
  const second = resolveMissionObjectives({ ...base, missionProgress: first }, [ally], emit)
  expect(evaluateMissionOutcome({ missionConfig: captureMission, missionProgress: second, units: [ally], strategicObjects: [], round: 2 })).toBe('victory')
  expect(evaluateMissionOutcome({ missionConfig: captureMission, missionProgress: second, units: [{ ...ally, hp: 0 }], strategicObjects: [], round: 2 })).toBe('draw')
  expect(evaluateMissionOutcome({ missionConfig: captureMission, missionProgress: { captureRounds: 0 }, units: [ally], strategicObjects: [], round: 8 })).toBe('defeat')
})

test('strategic objects take damage through the shared combat resolver', () => {
  const originalBattle = createMissionBattleState(missionById['terra-north-destroy'])
  const originalAttacker = originalBattle.units.find((unit) => unit.side === 'player')
  const attacker = { ...originalAttacker, x: 5, y: 3 }
  const battle = { ...originalBattle, units: originalBattle.units.map((unit) => unit.id === attacker.id ? attacker : unit) }
  const object = battle.strategicObjects[0]
  const { events, emit } = makeEmit()
  const result = resolveCombat({ battle, orders: [{ unitId: attacker.id, type: 'attack', targetObjectId: object.id }], emit })

  expect(result.strategicObjects[0].hp).toBeLessThan(object.hp)
  expect(object.hp - result.strategicObjects[0].hp).toBe(2)
  expect(result.units.find((unit) => unit.id === attacker.id).hp).toBe(attacker.hp)
  expect(events.some((event) => event.type === 'damage_dealt' && event.data.targetType === 'object')).toBe(true)
})

test('defense objective fails if destroyed and reinforcements avoid occupied spawn cells', () => {
  const mission = missionById['terra-north-defend']
  const battle = createMissionBattleState(mission)
  const firstSpawn = mission.reinforcements[0].spawnCandidates[0]
  const occupied = { ...battle, round: 3, units: [...battle.units, { id: 'occupant', side: 'player', hp: 3, ...firstSpawn }] }
  const spawned = spawnDueReinforcements(occupied)
  expect(spawned.spawned[0]).toMatchObject({ x: mission.reinforcements[0].spawnCandidates[1].x, y: mission.reinforcements[0].spawnCandidates[1].y })
  expect(new Set(spawned.battleState.units.filter((unit) => unit.hp > 0).map((unit) => `${unit.x},${unit.y}`)).size).toBe(spawned.battleState.units.filter((unit) => unit.hp > 0).length)
  expect(evaluateMissionOutcome({ missionConfig: mission, missionProgress: { defenseRounds: 5 }, units: battle.units, strategicObjects: [{ ...battle.strategicObjects[0], hp: 0 }], round: 5 })).toBe('defeat')
  expect(evaluateMissionOutcome({ missionConfig: mission, missionProgress: { defenseRounds: 5 }, units: battle.units, strategicObjects: battle.strategicObjects, round: 5 })).toBe('victory')
  expect(evaluateMissionOutcome({ missionConfig: mission, missionProgress: { defenseRounds: 2 }, units: battle.units.map((unit) => ({ ...unit, side: 'enemy' })), strategicObjects: battle.strategicObjects, round: 2 })).toBe('defeat')
})

test('applies the supply effect with a max HP cap and only unlocks the next mission after victory', () => {
  const captureSetup = createMissionSetup(captureMission)
  expect(captureSetup.appliedConsequences).toEqual([])
  const destroyMission = missionById['terra-north-destroy']
  const consequence = captureMission.onVictoryConsequences[0]
  const setup = createMissionSetup(destroyMission, [consequence])
  expect(setup.appliedConsequences).toHaveLength(1)
  expect(setup.unitHpOverrides[setup.appliedConsequences[0].unitId]).toBeLessThanOrEqual(destroyMission.initialUnits.find((unit) => unit.id === setup.appliedConsequences[0].unitId).maxHp)

  let progress = createEmptyTerritoryProgress()
  expect(getTerritoryMissionStatuses(territory, progress).map((item) => item.status)).toEqual(['available', 'locked', 'locked'])
  const defeat = { missionOutcome: 'defeat', round: 2, units: captureMission.initialUnits, strategicObjects: [], missionProgress: {} }
  progress = recordTerritoryMissionResult(progress, territory, captureMission, defeat)
  expect(getTerritoryMissionStatuses(territory, progress).map((item) => item.status)).toEqual(['available', 'locked', 'locked'])
  const victory = { ...defeat, missionOutcome: 'victory' }
  progress = recordTerritoryMissionResult(progress, territory, captureMission, victory)
  expect(progress.territoryControl).toBe('contested')
  expect(getTerritoryMissionStatuses(territory, progress).map((item) => item.status)).toEqual(['completed', 'available', 'locked'])
  const repeat = recordTerritoryMissionResult(progress, territory, captureMission, victory)
  expect(repeat.pendingConsequences).toHaveLength(1)
  const twoSurvivors = recordTerritoryMissionResult(createEmptyTerritoryProgress(), territory, captureMission, { ...victory, units: captureMission.initialUnits.filter((unit) => unit.side !== 'player' || unit.id !== 'terra-assault') })
  expect(twoSurvivors.pendingConsequences).toHaveLength(0)
})

test('destroying the objective wins after resolution, while simultaneous goal and final squad loss is a draw', () => {
  const mission = missionById['terra-north-destroy']
  const battle = createMissionBattleState(mission)
  const destroyedObject = { ...battle.strategicObjects[0], hp: 0 }
  expect(evaluateMissionOutcome({ missionConfig: mission, missionProgress: {}, units: battle.units, strategicObjects: [destroyedObject], round: 1 })).toBe('victory')
  expect(evaluateMissionOutcome({ missionConfig: mission, missionProgress: {}, units: battle.units.map((unit) => unit.side === 'player' ? { ...unit, hp: 0, status: 'destroyed' } : unit), strategicObjects: [destroyedObject], round: 1 })).toBe('draw')
})

test('a defeat retry reuses the same mission setup and a battery victory removes one defense wave', () => {
  const batteryVictory = missionById['terra-north-destroy'].onVictoryConsequences[0]
  const defense = missionById['terra-north-defend']
  const setup = createMissionSetup(defense, [batteryVictory])
  expect(setup.reinforcements).toHaveLength(defense.reinforcements.length - 1)
  expect(setup.appliedConsequences).toHaveLength(1)

  const defeatedBattle = { ...createMissionBattleState(defense, setup), missionOutcome: 'defeat', round: 2 }
  let progress = recordTerritoryMissionResult(createEmptyTerritoryProgress(), territory, defense, defeatedBattle)
  const retry = beginTerritoryMission(progress, defense)
  expect(retry.setup).toEqual(defeatedBattle.missionSetup)
  expect(retry.setup.appliedConsequences).toEqual(setup.appliedConsequences)
})

test('uses versioned account-specific storage and recovers from damaged data', () => {
  const values = new Map()
  const storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) }
  expect(getTerritoryStorageKey({ id: 'one' })).not.toBe(getTerritoryStorageKey({ id: 'two' }))
  values.set(getTerritoryStorageKey({ id: 'one' }), '{broken')
  expect(loadTerritoryProgress(storage, { id: 'one' }).completedMissionIds).toEqual([])
  const saved = saveTerritoryProgress({ ...createEmptyTerritoryProgress(), completedMissionIds: ['terra-north-capture'] }, storage, { id: 'one' })
  expect(saved.version).toBe(1)
  expect(loadTerritoryProgress(storage, { id: 'one' }).completedMissionIds).toEqual(['terra-north-capture'])
  expect(loadTerritoryProgress(storage, { id: 'two' }).completedMissionIds).toEqual([])
  const legacyKey = 'sv-tactical-territory:v1:legacy-user'
  values.set(legacyKey, JSON.stringify({ version: 1, completedMissionIds: ['terra-north-capture'] }))
  const migrated = loadTerritoryProgress(storage, { id: 'legacy-user' })
  expect(migrated.completedMissionIds).toEqual(['terra-north-capture'])
  expect(values.has(getTerritoryStorageKey({ id: 'legacy-user' }))).toBe(true)
  expect(getTerritoryStorageKey({ id: 'one' }, { planetId: 'terra', eraId: 'unification' })).not.toBe(getTerritoryStorageKey({ id: 'one' }, { planetId: 'terra', eraId: 'siege' }))
})
