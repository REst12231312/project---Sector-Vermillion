import { CONTROL_POINT_CELLS, MAP_SIZE, OBSTACLES } from '../game/battleEngine.js'

function distance(from, to, occupied = new Set()) {
  const queue = [{ ...from, steps: 0 }]
  const visited = new Set([`${from.x},${from.y}`])
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head]
    if (current.x === to.x && current.y === to.y) return current.steps
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
      if (!dx && !dy) continue
      const x = current.x + dx, y = current.y + dy, key = `${x},${y}`
      if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE || visited.has(key) || occupied.has(key) || OBSTACLES.some(([ox, oy]) => ox === x && oy === y)) continue
      if (dx && dy && OBSTACLES.some(([ox, oy]) => ox === current.x && oy === y) && OBSTACLES.some(([ox, oy]) => ox === x && oy === current.y)) continue
      visited.add(key); queue.push({ x, y, steps: current.steps + 1 })
    }
  }
  return Infinity
}

function bestAssignment(starts, points) {
  let best = Infinity
  const visit = (index, used, total) => {
    if (index === starts.length) { best = Math.min(best, total); return }
    for (let point = 0; point < points.length; point += 1) if (!used.has(point)) {
      used.add(point); visit(index + 1, used, total + distance(starts[index], points[point])); used.delete(point)
    }
  }
  visit(0, new Set(), 0)
  return best
}

const topStarts = [{ x: 2, y: 0 }, { x: 5, y: 0 }, { x: 8, y: 0 }]
const bottomStarts = [{ x: 9, y: 11 }, { x: 6, y: 11 }, { x: 3, y: 11 }]
const currentPoints = CONTROL_POINT_CELLS.map(([x, y]) => ({ x, y }))
const candidates = []
for (let y = 3; y <= 8; y += 1) for (let x = 1; x <= 10; x += 1) {
  if (OBSTACLES.some(([ox, oy]) => ox === x && oy === y)) continue
  candidates.push({ x, y })
}
const layouts = []
for (let a = 0; a < candidates.length; a += 1) for (let b = a + 1; b < candidates.length; b += 1) for (let c = b + 1; c < candidates.length; c += 1) {
  const points = [candidates[a], candidates[b], candidates[c]]
  if (points.some((point, index) => points.slice(index + 1).some((other) => Math.max(Math.abs(point.x - other.x), Math.abs(point.y - other.y)) < 3))) continue
  const top = bestAssignment(topStarts, points), bottom = bestAssignment(bottomStarts, points)
  const centerDrift = Math.abs(points.reduce((total, point) => total + point.x, 0) / 3 - 5.5) + Math.abs(points.reduce((total, point) => total + point.y, 0) / 3 - 5.5)
  const widthSpread = Math.max(...points.map((point) => point.x)) - Math.min(...points.map((point) => point.x))
  layouts.push({ points, top, bottom, difference: Math.abs(top - bottom), sum: top + bottom, centerDrift, widthSpread })
}
layouts.sort((a, b) => a.difference - b.difference || a.sum - b.sum || b.widthSpread - a.widthSpread || a.centerDrift - b.centerDrift)
console.log(`Текущий вариант: ${JSON.stringify(CONTROL_POINT_CELLS)}; кратчайшие маршруты ${bestAssignment(topStarts, currentPoints)} / ${bestAssignment(bottomStarts, currentPoints)}.`)
console.log('Варианты с равным маршрутом обеих сторон:')
for (const layout of layouts.filter(({ difference }) => difference === 0).slice(0, 10)) console.log(`${JSON.stringify(layout.points)} → ${layout.top}/${layout.bottom} ходов`)
