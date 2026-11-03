import { createBattleState } from './battleState'
import { applyMissionConsequences } from './missionConsequences'

export function createMissionSetup(missionConfig, pendingConsequences = []) {
  return applyMissionConsequences(missionConfig, pendingConsequences)
}

export function createMissionBattleState(missionConfig, setup = null) {
  const selectedSetup = setup?.missionId === missionConfig.id ? setup : createMissionSetup(missionConfig)
  const cells = missionConfig.terrain.map((cell) => ({ ...cell }))
  for (const override of missionConfig.terrainOverrides || []) {
    const index = override.y * missionConfig.mapSize.width + override.x
    if (cells[index]) cells[index] = { ...cells[index], type: override.type }
  }
  const map = { width: missionConfig.mapSize.width, height: missionConfig.mapSize.height, cells }
  const units = missionConfig.initialUnits.map((unit) => ({ ...unit, hp: selectedSetup.unitHpOverrides[unit.id] ?? unit.hp }))
  const strategicObjects = missionConfig.strategicObjects.map((object) => ({ ...object }))
  const state = createBattleState({ battleId: selectedSetup.battleId || `battle-${missionConfig.id}`, missionId: missionConfig.id, map, units, objectives: missionConfig.objectives.map((objective) => ({ ...objective })) })
  return {
    ...state,
    missionType: missionConfig.type,
    missionConfig,
    strategicObjects,
    missionProgress: { captureRounds: 0, control: 'enemy', contested: false, defenseRounds: 0, spawnedReinforcements: [] },
    missionRuntime: { reinforcements: selectedSetup.reinforcements.map((entry) => ({ ...entry, spawnCandidates: entry.spawnCandidates.map((position) => ({ ...position })), unit: { ...entry.unit } })), appliedConsequences: selectedSetup.appliedConsequences.map((item) => ({ ...item })) },
    missionSetup: selectedSetup,
    appliedConsequences: selectedSetup.appliedConsequences.map((item) => ({ ...item })),
    missionOutcome: 'active',
  }
}

export function spawnDueReinforcements(battleState) {
  if (battleState.missionType !== 'defend') return { battleState, spawned: [] }
  const spawnedIds = new Set(battleState.missionProgress.spawnedReinforcements)
  const units = [...battleState.units]
  const spawned = []
  const activeObjects = battleState.strategicObjects.filter((object) => object.hp > 0 && object.blocksMovement)
  const scheduled = [...battleState.missionRuntime.reinforcements].filter((entry) => entry.round <= battleState.round && !spawnedIds.has(entry.id)).sort((a, b) => a.round - b.round || a.id.localeCompare(b.id))
  for (const reinforcement of scheduled) {
    const position = reinforcement.spawnCandidates.find((candidate) => {
      const cell = battleState.map.cells[candidate.y * battleState.map.width + candidate.x]
      return cell && cell.type !== 'obstacle' && !units.some((unit) => unit.hp > 0 && unit.x === candidate.x && unit.y === candidate.y) && !activeObjects.some((object) => object.x === candidate.x && object.y === candidate.y)
    })
    if (!position) continue
    units.push({ ...reinforcement.unit, id: reinforcement.unit.id, side: 'enemy', x: position.x, y: position.y })
    spawnedIds.add(reinforcement.id)
    spawned.push({ reinforcementId: reinforcement.id, unitId: reinforcement.unit.id, name: reinforcement.unit.name, x: position.x, y: position.y })
  }
  if (!spawned.length) return { battleState, spawned }
  return { battleState: { ...battleState, units, missionProgress: { ...battleState.missionProgress, spawnedReinforcements: [...spawnedIds] } }, spawned }
}
