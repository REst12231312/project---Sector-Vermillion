import { createBattleState } from './battleState'
import { assignOrder, cancelOrder, confirmOrders, makeMoveOrder, returnToPlanning } from './orderPlanning'
import { getReachableMoves } from './pathfinding'
import { hasLineOfSight, manhattanDistance } from './lineOfSight'
import { validateOrder, validateOrderSet } from './orderValidation'

const map = (obstacles = []) => ({ width: 12, height: 12, cells: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12), type: obstacles.some(([x, y]) => x === index % 12 && y === Math.floor(index / 12)) ? 'obstacle' : 'plain' })) })
const units = [
  { id: 'ally-a', name: 'Ally A', side: 'player', x: 0, y: 0, hp: 8, maxHp: 8, moveRange: 3, attackRange: 3, attack: 4, armor: 2, status: 'ready' },
  { id: 'ally-b', name: 'Ally B', side: 'player', x: 0, y: 2, hp: 5, maxHp: 5, moveRange: 2, attackRange: 1, attack: 2, armor: 1, status: 'ready' },
  { id: 'enemy-a', name: 'Enemy A', side: 'enemy', x: 3, y: 0, hp: 6, maxHp: 6, moveRange: 2, attackRange: 2, attack: 3, armor: 1, status: 'visible' },
]
const makeBattle = (obstacles = []) => createBattleState({ battleId: 'test', missionId: 'test', map: map(obstacles), units: units.map((unit) => ({ ...unit })), objectives: [] })

test('BFS finds a four-direction path around obstacles and respects movement range', () => {
  const battle = makeBattle([[1, 0]])
  const mover = { ...battle.units[0], moveRange: 4 }
  const moves = getReachableMoves(battle.map, [mover, ...battle.units.slice(1)], mover)
  const route = moves.find((move) => move.position.x === 2 && move.position.y === 0)
  expect(route.path[0]).toEqual({ x: 0, y: 0 })
  expect(route.distance).toBe(4)
  expect(route.path.some((position) => position.x === 1 && position.y === 0)).toBe(false)
  expect(moves.every((move) => move.distance <= 4)).toBe(true)
  expect(getReachableMoves(battle.map, battle.units, battle.units[0]).every((move) => move.distance <= 3)).toBe(true)
})

test('movement rejects invalid coordinates, occupied cells, blocked cells, and out of range paths', () => {
  const battle = makeBattle([[1, 0]])
  expect(makeMoveOrder(battle, 'ally-a', { x: -1, y: 0 }).errors[0]).toMatch(/пределами карты/)
  expect(makeMoveOrder(battle, 'ally-a', { x: 0, y: 2 }).errors[0]).toMatch(/занята/)
  expect(makeMoveOrder(battle, 'ally-a', { x: 1, y: 0 }).errors[0]).toMatch(/препятствие/)
  expect(makeMoveOrder(battle, 'ally-a', { x: 2, y: 0 }).errors[0]).toMatch(/дальности/)
  expect(validateOrder({ unitId: 'ally-a', type: 'move', targetPosition: { x: 2, y: 1 }, path: [{ x: 0, y: 0 }, { x: 2, y: 1 }] }, battle).length).toBeGreaterThan(0)
})

test('living allied units can receive one order, replace it, and cancel it; enemies cannot be controlled', () => {
  const battle = makeBattle()
  const first = assignOrder(battle, { unitId: 'ally-a', type: 'defend' })
  const second = assignOrder(first.battle, { unitId: 'ally-a', type: 'hold' })
  expect(second.battle.playerOrders).toEqual([{ unitId: 'ally-a', type: 'hold' }])
  expect(assignOrder(battle, { unitId: 'enemy-a', type: 'hold' }).errors).toHaveLength(1)
  expect(cancelOrder(second.battle, 'ally-a').playerOrders).toEqual([])
})

test('attack validation uses Manhattan range, live enemy targets, and obstacle line of sight', () => {
  const battle = makeBattle([[2, 0]])
  expect(manhattanDistance(battle.units[0], battle.units[2])).toBe(3)
  expect(validateOrder({ unitId: 'ally-a', type: 'attack', targetUnitId: 'enemy-a' }, battle)).toEqual(['Линия атаки заблокирована препятствием.'])
  expect(validateOrder({ unitId: 'ally-b', type: 'attack', targetUnitId: 'enemy-a' }, battle)[0]).toMatch(/вне дальности/)
  expect(validateOrder({ unitId: 'ally-a', type: 'attack', targetUnitId: 'missing' }, battle)[0]).toMatch(/не найдена/)
  const deadTarget = { ...battle, units: battle.units.map((unit) => unit.id === 'enemy-a' ? { ...unit, hp: 0 } : unit) }
  expect(validateOrder({ unitId: 'ally-a', type: 'attack', targetUnitId: 'enemy-a' }, deadTarget)[0]).toMatch(/уничтожена/)
  expect(validateOrder({ unitId: 'ally-a', type: 'attack', targetUnitId: 'ally-b' }, battle)[0]).toMatch(/не найдена/)
})

test('line of sight blocks obstacle cells and does not pass through a blocked corner', () => {
  expect(hasLineOfSight(map([[1, 0]]), { x: 0, y: 0 }, { x: 2, y: 0 })).toBe(false)
  expect(hasLineOfSight(map([[1, 0], [0, 1]]), { x: 0, y: 0 }, { x: 1, y: 1 })).toBe(false)
  expect(hasLineOfSight(map([[1, 0]]), { x: 0, y: 0 }, { x: 1, y: 1 })).toBe(true)
})

test('order-set validation detects duplicate assignments and conflicting move destinations', () => {
  const battle = makeBattle()
  const moveA = makeMoveOrder(battle, 'ally-a', { x: 1, y: 1 }).order
  const moveB = makeMoveOrder(battle, 'ally-b', { x: 1, y: 1 }).order
  const orders = [
    moveA,
    moveB,
    { unitId: 'ally-a', type: 'hold' },
  ]
  const errors = validateOrderSet(orders, battle).join(' ')
  expect(errors).toMatch(/больше одного приказа/)
  expect(errors).toMatch(/Конфликт конечной клетки/)
})

test('confirmation fills missing orders with Hold, freezes a snapshot, and leaves positions and HP untouched', () => {
  const battle = makeBattle()
  const assigned = assignOrder(battle, { unitId: 'ally-a', type: 'defend' }).battle
  const before = battle.units.map(({ id, x, y, hp }) => ({ id, x, y, hp }))
  const result = confirmOrders(assigned)
  expect(result.ok).toBe(true)
  expect(result.battle.playerOrders).toEqual([{ unitId: 'ally-a', type: 'defend' }, { unitId: 'ally-b', type: 'hold' }])
  expect(Object.isFrozen(result.battle.confirmedOrders)).toBe(true)
  expect(Object.isFrozen(result.battle.confirmedOrders[0])).toBe(true)
  expect(result.battle.units.map(({ id, x, y, hp }) => ({ id, x, y, hp }))).toEqual(before)
  const reopened = returnToPlanning(result.battle)
  expect(reopened.playerOrders).toEqual(result.battle.playerOrders)
  expect(reopened.planningStatus).toBe('planning')
})

test('confirmation refuses invalid stale orders and battles without living allied units', () => {
  const battle = makeBattle()
  const stale = { ...battle, playerOrders: [{ unitId: 'ally-a', type: 'attack', targetUnitId: 'removed' }] }
  expect(confirmOrders(stale).ok).toBe(false)
  const empty = { ...battle, units: battle.units.map((unit) => unit.side === 'player' ? { ...unit, hp: 0, status: 'destroyed' } : unit) }
  expect(confirmOrders(empty).errors[0]).toMatch(/Нет живых союзных/)
})
