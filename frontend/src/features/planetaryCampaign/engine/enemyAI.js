import { BATTLE_CONFIG } from './battleConfig'
import { hasLineOfSight, manhattanDistance } from './lineOfSight'
import { getReachableMoves } from './pathfinding'
import { validateOrder, validateOrderSet } from './orderValidation'

const living = (unit) => unit.hp > 0 && unit.status !== 'destroyed'
const byId = (a, b) => a.id.localeCompare(b.id)

function nearestDistance(unit, enemies) {
  return Math.min(...enemies.map((enemy) => manhattanDistance(unit, enemy)))
}

export function createEnemyOrders(battleState) {
  const enemies = battleState.units.filter((unit) => unit.side === 'enemy' && living(unit)).sort(byId)
  const allies = battleState.units.filter((unit) => unit.side === 'player' && living(unit)).sort(byId)
  const objects = battleState.strategicObjects || []
  const blockers = objects.filter((object) => object.hp > 0 && object.blocksLineOfSight)
  const defenseTarget = battleState.missionType === 'defend' ? objects.find((object) => object.side === 'player' && object.primary && object.hp > 0) : null
  const orders = []
  const reservedDestinations = new Set()

  for (const unit of enemies) {
    if (defenseTarget && manhattanDistance(unit, defenseTarget) <= unit.attackRange && hasLineOfSight(battleState.map, unit, defenseTarget, blockers.filter((object) => object.id !== defenseTarget.id))) {
      const objectAttack = { unitId: unit.id, type: 'attack', targetObjectId: defenseTarget.id }
      if (!validateOrder(objectAttack, battleState, { side: 'enemy' }).length) { orders.push(objectAttack); continue }
    }
    const targetsInRange = allies.filter((target) => manhattanDistance(unit, target) <= unit.attackRange && hasLineOfSight(battleState.map, unit, target, blockers))
      .sort((a, b) => manhattanDistance(unit, a) - manhattanDistance(unit, b) || byId(a, b))
    const attack = targetsInRange.map((target) => ({ unitId: unit.id, type: 'attack', targetUnitId: target.id }))
      .find((order) => validateOrder(order, battleState, { side: 'enemy' }).length === 0)
    if (attack) { orders.push(attack); continue }

    const ratio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0
    const threatened = allies.some((ally) => manhattanDistance(ally, unit) <= ally.attackRange && hasLineOfSight(battleState.map, ally, unit, blockers))
    if (ratio <= BATTLE_CONFIG.lowHpDefendThreshold && threatened) {
      const defend = { unitId: unit.id, type: 'defend' }
      if (!validateOrder(defend, battleState, { side: 'enemy' }).length) { orders.push(defend); continue }
    }

    const movementTargets = defenseTarget ? [defenseTarget] : allies
    const currentDistance = nearestDistance(unit, movementTargets)
    const objectBlockers = objects.filter((object) => object.hp > 0 && object.blocksMovement)
    const moves = getReachableMoves(battleState.map, battleState.units, unit, unit.moveRange, objectBlockers)
      .filter((move) => !reservedDestinations.has(`${move.position.x},${move.position.y}`))
      .map((move) => ({ ...move, goalDistance: nearestDistance(move.position, movementTargets) }))
      .filter((move) => move.goalDistance < currentDistance)
      .sort((a, b) => a.goalDistance - b.goalDistance || b.distance - a.distance || a.position.y - b.position.y || a.position.x - b.position.x)

    const move = moves.map((candidate) => ({ unitId: unit.id, type: 'move', targetPosition: candidate.position, path: candidate.path }))
      .find((order) => validateOrder(order, battleState, { side: 'enemy' }).length === 0)
    if (move) {
      reservedDestinations.add(`${move.targetPosition.x},${move.targetPosition.y}`)
      orders.push(move)
    } else orders.push({ unitId: unit.id, type: 'hold' })
  }

  const errors = validateOrderSet(orders, battleState, { side: 'enemy' })
  if (errors.length) {
    // Fall back to safe deterministic Hold orders if a future AI policy creates an invalid set.
    return enemies.map((unit) => ({ unitId: unit.id, type: 'hold' }))
  }
  return orders
}
