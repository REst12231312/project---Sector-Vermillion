import { validateOrder, validateOrderSet } from './orderValidation'
import { findPath } from './pathfinding'

const living = (unit) => unit.side === 'player' && unit.hp > 0 && unit.status !== 'destroyed'

export function makeMoveOrder(battle, unitId, targetPosition) {
  const unit = battle.units.find((candidate) => candidate.id === unitId)
  if (!unit) return { order: null, errors: ['Союзный отряд для приказа не найден.'] }
  const objectBlockers = (battle.strategicObjects || []).filter((object) => object.hp > 0 && object.blocksMovement)
  const path = findPath(battle.map, battle.units, unit, targetPosition, unit.id, [], objectBlockers)
  const order = { unitId, type: 'move', targetPosition: { ...targetPosition }, path: path || [] }
  const errors = validateOrder(order, battle)
  return { order: errors.length ? null : order, errors }
}

export function assignOrder(battle, order) {
  const errors = validateOrder(order, battle)
  if (errors.length) return { battle, errors }
  const playerOrders = battle.playerOrders.filter((current) => current.unitId !== order.unitId)
  return { battle: { ...battle, playerOrders: [...playerOrders, { ...order }], planningStatus: 'planning', confirmedOrders: null }, errors: [] }
}

export function cancelOrder(battle, unitId) {
  return { ...battle, playerOrders: battle.playerOrders.filter((order) => order.unitId !== unitId), planningStatus: 'planning', confirmedOrders: null }
}

function freezeOrder(order) {
  const copy = { ...order }
  if (order.targetPosition) copy.targetPosition = Object.freeze({ ...order.targetPosition })
  if (order.path) copy.path = Object.freeze(order.path.map((position) => Object.freeze({ ...position })))
  return Object.freeze(copy)
}

export function confirmOrders(battle) {
  const orders = [...battle.playerOrders]
  const assignedIds = new Set(orders.map((order) => order.unitId))
  for (const unit of battle.units.filter(living)) {
    if (!assignedIds.has(unit.id)) orders.push({ unitId: unit.id, type: 'hold' })
  }
  const errors = validateOrderSet(orders, battle)
  if (errors.length) return { ok: false, battle, errors }

  const immutableOrders = Object.freeze(orders.map(freezeOrder))
  return {
    ok: true,
    errors: [],
    battle: { ...battle, playerOrders: orders.map((order) => ({ ...order })), planningStatus: 'confirmed', confirmedOrders: immutableOrders },
  }
}

export function returnToPlanning(battle) {
  return { ...battle, planningStatus: 'planning', confirmedOrders: null }
}
