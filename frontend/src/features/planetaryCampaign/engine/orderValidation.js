import { findPath, getCell, isInsideMap } from './pathfinding'
import { hasLineOfSight, manhattanDistance } from './lineOfSight'

const living = (unit) => unit && unit.hp > 0 && unit.status !== 'destroyed'

export function validateOrder(order, battle, { side = 'player', allowOccupiedDestinationUnitIds = [] } = {}) {
  if (!order || typeof order !== 'object') return ['Приказ имеет неверный формат.']
  const unit = battle.units.find((candidate) => candidate.id === order.unitId)
  if (!unit || unit.side !== side) return [side === 'player' ? 'Союзный отряд для приказа не найден.' : 'Вражеский отряд для приказа не найден.']
  if (!living(unit)) return [`Отряд «${unit.name}» уничтожен и не может получить приказ.`]

  if (order.type === 'move') {
    const target = order.targetPosition
    if (!isInsideMap(battle.map, target)) return ['Точка перемещения находится за пределами карты или задана некорректно.']
    if (target.x === unit.x && target.y === unit.y) return ['Выберите другую клетку для перемещения.']
    if (getCell(battle.map, target)?.type === 'obstacle') return ['Нельзя переместиться в непроходимое препятствие.']
    const destinationOccupants = battle.units.filter((other) => living(other) && other.id !== unit.id && other.x === target.x && other.y === target.y)
    const canEnterVacatedCell = destinationOccupants.length > 0 && destinationOccupants.every((other) => allowOccupiedDestinationUnitIds.includes(other.id))
    if (destinationOccupants.length && !canEnterVacatedCell) return ['Клетка занята другим подразделением.']
    const objectBlockers = (battle.strategicObjects || []).filter((object) => object.hp > 0 && object.blocksMovement)
    const path = findPath(battle.map, battle.units, unit, target, unit.id, canEnterVacatedCell ? destinationOccupants.map((other) => other.id) : [], objectBlockers)
    if (!path) return ['До выбранной клетки нет свободного пути.']
    if (path.length - 1 > unit.moveRange) return [`Маршрут длиннее дальности перемещения (${unit.moveRange}).`]
    if (!Array.isArray(order.path) || order.path.length !== path.length || order.path.some((position, index) => position.x !== path[index].x || position.y !== path[index].y)) return ['Маршрут приказа некорректен или проходит через занятое место.']
    return []
  }

  if (order.type === 'attack') {
    const targetUnit = order.targetUnitId ? battle.units.find((candidate) => candidate.id === order.targetUnitId) : null
    const targetObject = order.targetObjectId ? (battle.strategicObjects || []).find((candidate) => candidate.id === order.targetObjectId) : null
    const targetSide = side === 'player' ? 'enemy' : 'player'
    const target = targetUnit || targetObject
    if (!target || (targetUnit && target.side !== targetSide) || (targetObject && targetObject.side !== targetSide)) return [side === 'player' ? 'Вражеская цель не найдена.' : 'Союзная цель не найдена.']
    if (!living(target)) return ['Цель уничтожена и не может быть атакована.']
    const distance = manhattanDistance(unit, target)
    if (distance > unit.attackRange) return [`Цель вне дальности атаки (${distance} / ${unit.attackRange}).`]
    const blockers = (battle.strategicObjects || []).filter((object) => object.hp > 0 && object.blocksLineOfSight && object.id !== target.id)
    if (!hasLineOfSight(battle.map, unit, target, blockers)) return ['Линия атаки заблокирована препятствием.']
    return []
  }

  if (order.type === 'defend' || order.type === 'hold') return []
  return ['Неизвестный тип приказа.']
}

export function validateOrderSet(orders, battle, { side = 'player', allowOccupiedDestinationUnitIds = [] } = {}) {
  const errors = []
  const assignedIds = new Set()
  const destinations = new Map()
  if (!battle.units.some((unit) => unit.side === side && living(unit))) return [side === 'player' ? 'Нет живых союзных подразделений для подтверждения.' : 'Нет живых вражеских подразделений для приказов.']
  for (const order of orders) {
    if (assignedIds.has(order.unitId)) errors.push(`Отряду назначено больше одного приказа: ${order.unitId}.`)
    assignedIds.add(order.unitId)
    errors.push(...validateOrder(order, battle, { side, allowOccupiedDestinationUnitIds }))
    if (order.type === 'move' && isInsideMap(battle.map, order.targetPosition)) {
      const key = `${order.targetPosition.x},${order.targetPosition.y}`
      if (destinations.has(key)) errors.push(`Конфликт конечной клетки ${key}: два отряда планируют прибыть туда.`)
      else destinations.set(key, order.unitId)
    }
  }
  return errors
}
