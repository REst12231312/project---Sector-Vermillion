import { resolveCombat } from './combatResolver'
import { createEventFactory } from './battleEvents'
import { BATTLE_CONFIG } from './battleConfig'
import { resolveMovement } from './movementResolver'
import { validateOrderSet } from './orderValidation'
import { getBattleOutcome } from './victoryConditions'
import { evaluateMissionOutcome, resolveMissionObjectives } from './objectiveResolver'

const livingPlayer = (unit) => unit.side === 'player' && unit.hp > 0 && unit.status !== 'destroyed'
function createRoundSnapshot(battleState, playerOrders, enemyOrders) {
  const map = Object.freeze({ ...battleState.map, cells: Object.freeze(battleState.map.cells.map((cell) => Object.freeze({ ...cell }))) })
  const units = Object.freeze(battleState.units.map((unit) => Object.freeze({ ...unit })))
  const objectives = Object.freeze((battleState.objectives || []).map((objective) => Object.freeze({ ...objective })))
  const strategicObjects = Object.freeze((battleState.strategicObjects || []).map((object) => Object.freeze({ ...object })))
  return Object.freeze({ battleId: battleState.battleId, missionId: battleState.missionId, round: battleState.round, phase: battleState.phase, map, units, objectives, strategicObjects, playerOrders, enemyOrders })
}
const freezeOrder = (order) => Object.freeze({ ...order, ...(order.targetPosition ? { targetPosition: Object.freeze({ ...order.targetPosition }) } : {}), ...(order.path ? { path: Object.freeze(order.path.map((position) => Object.freeze({ ...position }))) } : {}) })

function createSummary(events, units, strategicObjects, outcome, round, missionProgress) {
  const unitById = new Map(units.map((unit) => [unit.id, unit]))
  const objectById = new Map(strategicObjects.map((object) => [object.id, object]))
  return {
    round,
    outcome,
    moved: events.filter((event) => event.type === 'unit_moved').map((event) => ({ unitId: event.unitIds[0], name: unitById.get(event.unitIds[0])?.name, from: event.data.from, to: event.data.to })),
    attacks: events.filter((event) => event.type === 'attack_performed').map((event) => ({ attackerId: event.data.attackerId, targetId: event.data.targetId || event.data.targetObjectId, targetType: event.data.targetType, attacker: unitById.get(event.data.attackerId)?.name, target: unitById.get(event.data.targetId)?.name || objectById.get(event.data.targetObjectId)?.name, damage: event.data.damage, distance: event.data.distance })),
    damage: events.filter((event) => event.type === 'damage_dealt').map((event) => ({ attackerId: event.data.attackerId, targetId: event.data.targetId || event.data.targetObjectId, targetType: event.data.targetType, damage: event.data.damage, targetHp: event.data.targetHp })),
    destroyed: [...events.filter((event) => event.type === 'unit_destroyed').map((event) => ({ unitId: event.unitIds[0], name: event.data.name, side: event.data.side, targetType: 'unit' })), ...events.filter((event) => event.type === 'objective_destroyed').map((event) => ({ unitId: event.unitIds[0], name: event.data.name, side: event.data.side, targetType: 'object' }))],
    blocked: events.filter((event) => event.type === 'movement_blocked' || event.type === 'movement_collision' || event.type === 'attack_blocked').map((event) => ({ type: event.type, unitIds: event.unitIds, reason: event.data.reason })),
    units: units.map(({ id, name, side, hp, maxHp, x, y, status }) => ({ id, name, side, hp, maxHp, x, y, status })),
    strategicObjects: strategicObjects.map(({ id, name, side, hp, maxHp, status }) => ({ id, name, side, hp, maxHp, status })),
    missionProgress: { ...missionProgress },
  }
}

export function resolveRound({ battleState, playerOrders, enemyOrders, preRoundEvents = [] }) {
  const fail = (errors) => ({ ok: false, nextState: battleState, events: [], summary: null, errors })
  if (!battleState || battleState.phase !== 'planning') return fail(['Раунд можно выполнить только из фазы planning.'])
  if (battleState.planningStatus !== 'confirmed') return fail(['Сначала подтвердите приказы игрока.'])
  if (new Set(battleState.units.map((unit) => unit.id)).size !== battleState.units.length) return fail(['В BattleState обнаружены повторяющиеся ID подразделений.'])
  const players = playerOrders || battleState.confirmedOrders || battleState.playerOrders || []
  const ordersFromEnemy = enemyOrders || []
  const movingUnitIds = [...players, ...ordersFromEnemy]
    .filter((order) => order.type === 'move')
    .map((order) => battleState.units.find((unit) => unit.id === order.unitId && unit.hp > 0 && unit.status !== 'destroyed')?.id)
    .filter(Boolean)
  const playerErrors = validateOrderSet(players, battleState, { side: 'player', allowOccupiedDestinationUnitIds: movingUnitIds })
  if (playerErrors.length) return fail(playerErrors)
  const enemyErrors = ordersFromEnemy.length ? validateOrderSet(ordersFromEnemy, battleState, { side: 'enemy', allowOccupiedDestinationUnitIds: movingUnitIds }) : []
  if (enemyErrors.length) return fail(enemyErrors)

  const allPlayerOrders = [...players]
  const assignedPlayerIds = new Set(players.map((order) => order.unitId))
  for (const unit of battleState.units.filter(livingPlayer)) {
    if (!assignedPlayerIds.has(unit.id)) allPlayerOrders.push({ unitId: unit.id, type: 'hold' })
  }

  const eventFactory = createEventFactory(battleState.round)
  const events = []
  const emit = (type, unitIds, data) => events.push(eventFactory(type, unitIds, data))
  const allEnemyOrders = [...ordersFromEnemy]
  const assignedEnemyIds = new Set(ordersFromEnemy.map((order) => order.unitId))
  for (const unit of battleState.units.filter((candidate) => candidate.side === 'enemy' && candidate.hp > 0 && candidate.status !== 'destroyed')) {
    if (!assignedEnemyIds.has(unit.id)) allEnemyOrders.push({ unitId: unit.id, type: 'hold' })
  }
  const roundOrders = Object.freeze({
    player: Object.freeze(allPlayerOrders.map(freezeOrder)),
    enemy: Object.freeze(allEnemyOrders.map(freezeOrder)),
  })
  const roundSnapshot = createRoundSnapshot(battleState, roundOrders.player, roundOrders.enemy)
  const combinedOrders = [...allPlayerOrders, ...allEnemyOrders]
  const snapshotUnits = battleState.units.map((unit) => ({ ...unit }))

  emit('round_started', [], { round: battleState.round })
  preRoundEvents.forEach((event) => emit(event.type, event.unitIds || [], event.data || {}))
  for (const order of [...combinedOrders].sort((a, b) => a.unitId.localeCompare(b.unitId))) {
    if (order.type === 'defend') emit('unit_defending', [order.unitId], { armorBonus: BATTLE_CONFIG.defendArmorBonus })
    if (order.type === 'hold') emit('unit_held', [order.unitId], {})
  }

  const movedUnits = resolveMovement({ map: battleState.map, units: snapshotUnits, orders: combinedOrders, strategicObjects: battleState.strategicObjects || [], emit })
  const combatBattle = { ...battleState, units: movedUnits }
  const combatOrders = combinedOrders.filter((order) => order.type === 'attack' || order.type === 'defend')
  const combatResult = resolveCombat({ battle: combatBattle, orders: combatOrders, emit })
  const resolvedUnits = combatResult.units
  const missionProgress = { ...(battleState.missionProgress || {}) }
  if (battleState.missionType === 'defend') missionProgress.defenseRounds = (missionProgress.defenseRounds || 0) + 1
  const updatedMissionProgress = resolveMissionObjectives({ ...battleState, missionProgress }, resolvedUnits, emit)
  Object.assign(missionProgress, updatedMissionProgress)
  const missionState = { ...battleState, missionProgress }
  const outcome = battleState.missionConfig ? evaluateMissionOutcome({ missionConfig: battleState.missionConfig, missionProgress, units: resolvedUnits, strategicObjects: combatResult.strategicObjects, round: battleState.round }) : getBattleOutcome(resolvedUnits)
  const completedEvent = eventFactory('round_finished', [], { round: battleState.round, outcome })
  events.push(completedEvent)
  if (outcome !== 'active') events.push(eventFactory('battle_finished', [], { outcome }))
  const summary = createSummary(events, resolvedUnits, combatResult.strategicObjects, outcome, battleState.round, missionProgress)
  const nextState = {
    ...missionState,
    units: resolvedUnits,
    strategicObjects: combatResult.strategicObjects,
    playerOrders: allPlayerOrders.map((order) => ({ ...order })),
    enemyOrders: allEnemyOrders.map((order) => ({ ...order })),
    phase: outcome === 'active' ? 'results' : 'finished',
    battleStatus: outcome,
    missionOutcome: outcome,
    planningStatus: 'resolved',
    roundEvents: events,
    roundOrders,
    roundSnapshot,
    roundSummary: summary,
  }
  return { ok: true, nextState, events, summary, errors: [] }
}
