import { getCell, isInsideMap } from './pathfinding'

const living = (unit) => unit.hp > 0 && unit.status !== 'destroyed'
const posKey = ({ x, y }) => `${x},${y}`
const sortIds = (ids) => [...ids].sort()

function checkPath(order, unit, map, strategicObjects) {
  const path = order.path
  if (!Array.isArray(path) || path.length < 2) return 'Маршрут пуст или не содержит перемещения.'
  if (path.length - 1 > unit.moveRange) return 'Маршрут превышает дальность перемещения.'
  if (path[0].x !== unit.x || path[0].y !== unit.y) return 'Начальная точка маршрута не совпадает с позицией отряда.'
  const last = path[path.length - 1]
  if (last.x !== order.targetPosition?.x || last.y !== order.targetPosition?.y) return 'Конечная точка маршрута не совпадает с целью.'
  for (let index = 0; index < path.length; index += 1) {
    const position = path[index]
    if (!isInsideMap(map, position)) return 'Маршрут выходит за пределы карты.'
    if (getCell(map, position)?.type === 'obstacle') return 'Маршрут проходит через непроходимое препятствие.'
    if (strategicObjects.some((object) => object.hp > 0 && object.blocksMovement && object.x === position.x && object.y === position.y)) return 'Маршрут проходит через стратегический объект.'
    if (index > 0 && Math.abs(position.x - path[index - 1].x) + Math.abs(position.y - path[index - 1].y) !== 1) return 'Маршрут содержит недопустимый шаг.'
  }
  return null
}

export function resolveMovement({ map, units, orders, strategicObjects = [], emit }) {
  let currentUnits = units.map((unit) => ({ ...unit }))
  const unitById = () => new Map(currentUnits.map((unit) => [unit.id, unit]))
  const routeById = new Map()
  const active = new Set()

  for (const order of [...orders].filter((item) => item.type === 'move').sort((a, b) => a.unitId.localeCompare(b.unitId))) {
    const unit = currentUnits.find((item) => item.id === order.unitId)
    if (!unit || !living(unit)) {
      emit('movement_blocked', [order.unitId], { reason: 'Отряд отсутствует или уничтожен до перемещения.' })
      continue
    }
    const issue = checkPath(order, unit, map, strategicObjects)
    if (issue) {
      emit('movement_blocked', [unit.id], { reason: issue })
      continue
    }
    routeById.set(unit.id, order.path.map((position) => ({ x: position.x, y: position.y })))
    active.add(unit.id)
  }

  const maxSteps = Math.max(0, ...[...routeById.values()].map((path) => path.length - 1))
  for (let step = 1; step <= maxSteps && active.size > 0; step += 1) {
    const byId = unitById()
    const intents = new Map()
    const failedThisStep = new Set()
    for (const id of sortIds(active)) {
      const unit = byId.get(id)
      const path = routeById.get(id)
      if (!unit || !living(unit) || step >= path.length) { active.delete(id); continue }
      const to = path[step]
      if (!isInsideMap(map, to) || getCell(map, to)?.type === 'obstacle' || strategicObjects.some((object) => object.hp > 0 && object.blocksMovement && object.x === to.x && object.y === to.y)) {
        failedThisStep.add(id)
        emit('movement_blocked', [id], { step, from: { x: unit.x, y: unit.y }, to, reason: 'Препятствие или край карты.' })
      } else intents.set(id, { from: { x: unit.x, y: unit.y }, to })
    }
    failedThisStep.forEach((id) => active.delete(id))

    const idsByDestination = new Map()
    for (const [id, intent] of intents) {
      const key = posKey(intent.to)
      idsByDestination.set(key, [...(idsByDestination.get(key) || []), id])
    }
    const blocked = new Set()
    const reportedBlocked = new Set()
    for (const ids of idsByDestination.values()) {
      if (ids.length < 2) continue
      const participants = sortIds(ids)
      participants.forEach((id) => { blocked.add(id); reportedBlocked.add(id) })
      emit('movement_collision', participants, { step, position: intents.get(participants[0]).to, reason: 'Несколько подразделений претендуют на одну клетку.' })
    }

    const occupantAt = new Map(currentUnits.filter(living).map((unit) => [posKey(unit), unit.id]))
    const dependency = new Map()
    for (const [id, intent] of intents) {
      if (blocked.has(id)) continue
      const occupantId = occupantAt.get(posKey(intent.to))
      if (occupantId && occupantId !== id) {
        if (!intents.has(occupantId) || blocked.has(occupantId)) blocked.add(id)
        else dependency.set(id, occupantId)
      }
    }

    const visited = new Set()
    for (const startId of sortIds(dependency.keys())) {
      if (visited.has(startId)) continue
      const chain = []
      const localIndex = new Map()
      let cursor = startId
      while (dependency.has(cursor) && !visited.has(cursor) && !localIndex.has(cursor)) {
        localIndex.set(cursor, chain.length)
        chain.push(cursor)
        cursor = dependency.get(cursor)
      }
      if (localIndex.has(cursor)) {
        const cycle = chain.slice(localIndex.get(cursor))
        cycle.forEach((id) => { blocked.add(id); reportedBlocked.add(id) })
        emit('movement_blocked', sortIds(cycle), { step, reason: cycle.length === 2 ? 'Обмен позициями запрещён.' : 'Циклическое перемещение запрещено.' })
      }
      chain.forEach((id) => visited.add(id))
    }

    let changed = true
    while (changed) {
      changed = false
      for (const [id, occupantId] of dependency) {
        if (!blocked.has(id) && blocked.has(occupantId)) { blocked.add(id); changed = true }
      }
    }

    for (const id of sortIds(blocked)) {
      if (!active.has(id)) continue
      const intent = intents.get(id)
      if (!reportedBlocked.has(id)) emit('movement_blocked', [id], { step, from: intent?.from, to: intent?.to, reason: 'Клетка занята отрядом, который не может освободить её.' })
      active.delete(id)
    }

    const successfulIds = sortIds([...intents.keys()].filter((id) => !blocked.has(id)))
    const movements = successfulIds.map((id) => ({ id, ...intents.get(id) }))
    if (movements.length) {
      const positions = new Map(movements.map((move) => [move.id, move.to]))
      currentUnits = currentUnits.map((unit) => positions.has(unit.id) ? { ...unit, ...positions.get(unit.id) } : unit)
      movements.forEach(({ id, from, to }) => emit('unit_moved', [id], { step, from, to }))
    }
    successfulIds.forEach((id) => { if (step >= routeById.get(id).length - 1) active.delete(id) })
  }

  return currentUnits
}
