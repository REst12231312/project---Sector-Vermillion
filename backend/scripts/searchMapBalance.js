import { MAP_SIZE, MAPS } from '../game/battleEngine.js'

const starts = [
  [{ x: 2, y: 0 }, { x: 5, y: 0 }, { x: 8, y: 0 }],
  [{ x: 9, y: MAP_SIZE - 1 }, { x: 6, y: MAP_SIZE - 1 }, { x: 3, y: MAP_SIZE - 1 }],
]
const asSet = (cells) => new Set(cells.map(([x, y]) => `${x},${y}`))
const rotateKey = ([x, y]) => `${MAP_SIZE - 1 - x},${MAP_SIZE - 1 - y}`

function distance(from, to, obstacles) {
  const blocked = asSet(obstacles)
  const queue = [{ ...from, steps: 0 }]
  const visited = new Set([`${from.x},${from.y}`])
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head]
    if (current.x === to.x && current.y === to.y) return current.steps
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
      if (!dx && !dy) continue
      const x = current.x + dx, y = current.y + dy, key = `${x},${y}`
      if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE || visited.has(key) || blocked.has(key)) continue
      if (dx && dy && blocked.has(`${current.x},${y}`) && blocked.has(`${x},${current.y}`)) continue
      visited.add(key); queue.push({ x, y, steps: current.steps + 1 })
    }
  }
  return Infinity
}

function assignmentCost(sideStarts, points, obstacles) {
  let best = Infinity
  const visit = (index, used, sum) => {
    if (index === sideStarts.length) { best = Math.min(best, sum); return }
    for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) if (!used.has(pointIndex)) {
      used.add(pointIndex)
      visit(index + 1, used, sum + distance(sideStarts[index], { x: points[pointIndex][0], y: points[pointIndex][1] }, obstacles))
      used.delete(pointIndex)
    }
  }
  visit(0, new Set(), 0)
  return best
}

let failed = false
console.log('АУДИТ МАРШРУТОВ К КОНТРОЛЬНЫМ ТОЧКАМ · 12×12')
for (const map of MAPS) {
  const pointKeys = asSet(map.controlPoints)
  const obstacleKeys = asSet(map.obstacles)
  const collision = [...pointKeys].some((key) => obstacleKeys.has(key))
  const obstaclesSymmetric = map.obstacles.every((cell) => obstacleKeys.has(rotateKey(cell)))
  const coverKeys = asSet(map.cover)
  const coverSymmetric = map.cover.every((cell) => coverKeys.has(rotateKey(cell)))
  const top = assignmentCost(starts[0], map.controlPoints, map.obstacles)
  const bottom = assignmentCost(starts[1], map.controlPoints, map.obstacles)
  const rotated = map.controlPoints.map(([x, y]) => [MAP_SIZE - 1 - x, MAP_SIZE - 1 - y])
  const rotatedTop = assignmentCost(starts[0], rotated, map.obstacles)
  const rotatedBottom = assignmentCost(starts[1], rotated, map.obstacles)
  const routeBalanced = Math.abs(top - bottom) <= 1 && Math.abs(rotatedTop - rotatedBottom) <= 1
  const valid = !collision && obstaclesSymmetric && coverSymmetric && [top, bottom, rotatedTop, rotatedBottom].every(Number.isFinite) && routeBalanced
  if (!valid) failed = true
  console.log(`${valid ? 'OK' : 'ПРОВЕРИТЬ'} · ${map.name} · маршрут назначенных отрядов: ${top}/${bottom} ходов, зеркально ${rotatedTop}/${rotatedBottom}; препятствия симметричны: ${obstaclesSymmetric}; укрытия симметричны: ${coverSymmetric}; точка на препятствии: ${collision}`)
}
if (failed) process.exitCode = 1
