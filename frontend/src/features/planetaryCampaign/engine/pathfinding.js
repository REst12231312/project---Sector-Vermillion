const DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]]

export function isInsideMap(map, position) {
  return Number.isInteger(position?.x) && Number.isInteger(position?.y)
    && position.x >= 0 && position.y >= 0 && position.x < map.width && position.y < map.height
}

export function getCell(map, position) {
  if (!isInsideMap(map, position)) return null
  return map.cells[position.y * map.width + position.x] || null
}

export function isBlocked(map, position, units = [], ignoredUnitId = null, blockedPositions = []) {
  const cell = getCell(map, position)
  if (!cell || cell.type === 'obstacle') return true
  if (blockedPositions.some((blocked) => blocked.x === position.x && blocked.y === position.y)) return true
  return units.some((unit) => unit.id !== ignoredUnitId && unit.hp > 0 && unit.x === position.x && unit.y === position.y)
}

export function findPath(map, units, start, destination, movingUnitId, ignoredUnitIds = [], blockedPositions = []) {
  if (!isInsideMap(map, start) || !isInsideMap(map, destination)) return null
  if (start.x === destination.x && start.y === destination.y) return [start]
  const ignored = new Set([movingUnitId, ...ignoredUnitIds])
  const pathUnits = units.filter((unit) => !ignored.has(unit.id))
  if (isBlocked(map, destination, pathUnits, null, blockedPositions)) return null

  const queue = [{ x: start.x, y: start.y }]
  const parent = new Map([[`${start.x},${start.y}`, null]])
  let cursor = 0

  while (cursor < queue.length) {
    const current = queue[cursor++]
    for (const [dx, dy] of DIRECTIONS) {
      const next = { x: current.x + dx, y: current.y + dy }
      const key = `${next.x},${next.y}`
      if (parent.has(key) || isBlocked(map, next, pathUnits, null, blockedPositions)) continue
      parent.set(key, `${current.x},${current.y}`)
      if (next.x === destination.x && next.y === destination.y) {
        const path = [next]
        let previous = parent.get(key)
        while (previous) {
          const [x, y] = previous.split(',').map(Number)
          path.unshift({ x, y })
          previous = parent.get(previous)
        }
        return path
      }
      queue.push(next)
    }
  }
  return null
}

export function getReachableMoves(map, units, unit, maxSteps = unit.moveRange, blockedPositions = []) {
  const start = { x: unit.x, y: unit.y }
  const queue = [{ position: start, path: [start] }]
  const visited = new Set([`${start.x},${start.y}`])
  const reachable = []
  let cursor = 0
  while (cursor < queue.length) {
    const current = queue[cursor++]
    if (current.path.length - 1 >= maxSteps) continue
    for (const [dx, dy] of DIRECTIONS) {
      const next = { x: current.position.x + dx, y: current.position.y + dy }
      const key = `${next.x},${next.y}`
      if (visited.has(key) || isBlocked(map, next, units, unit.id, blockedPositions)) continue
      visited.add(key)
      const path = [...current.path, next]
      reachable.push({ position: next, path, distance: path.length - 1 })
      queue.push({ position: next, path })
    }
  }
  return reachable
}
