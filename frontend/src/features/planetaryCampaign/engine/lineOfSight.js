import { getCell, isInsideMap } from './pathfinding'

export function manhattanDistance(from, to) {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y)
}

// Grid traversal between cell centers; corner crossings inspect both side cells.
export function getSupercoverLine(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const nx = Math.abs(dx)
  const ny = Math.abs(dy)
  const sx = Math.sign(dx)
  const sy = Math.sign(dy)
  let x = from.x
  let y = from.y
  let ix = 0
  let iy = 0
  const cells = [{ x, y }]
  const cornerSides = []

  while (ix < nx || iy < ny) {
    const decision = (1 + 2 * ix) * ny - (1 + 2 * iy) * nx
    if (decision === 0) {
      cornerSides.push([{ x: x + sx, y }, { x, y: y + sy }])
      x += sx; y += sy; ix += 1; iy += 1
    } else if (decision < 0) {
      x += sx; ix += 1
    } else {
      y += sy; iy += 1
    }
    cells.push({ x, y })
  }
  return { cells, cornerSides }
}

export function hasLineOfSight(map, from, to, blockers = []) {
  if (!isInsideMap(map, from) || !isInsideMap(map, to)) return false
  const { cells, cornerSides } = getSupercoverLine(from, to)
  const blocking = (position) => getCell(map, position)?.type === 'obstacle' || blockers.some((blocker) => blocker.hp > 0 && blocker.blocksLineOfSight && blocker.x === position.x && blocker.y === position.y)
  if (cells.slice(1, -1).some(blocking)) return false
  return !cornerSides.some((sides) => sides.every(blocking))
}
