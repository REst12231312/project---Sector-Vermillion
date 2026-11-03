import { createBattleState } from './battleState'
import { createEnemyOrders } from './enemyAI'
import { resolveRound, startNextRound } from './battleEngine'
import { resolveCombat } from './combatResolver'
import { resolveMovement } from './movementResolver'
import { confirmOrders } from './orderPlanning'

function makeMap(obstacles = [], covers = []) {
  return { width: 12, height: 12, cells: Array.from({ length: 144 }, (_, index) => {
    const x = index % 12; const y = Math.floor(index / 12)
    return { x, y, type: obstacles.some(([ox, oy]) => ox === x && oy === y) ? 'obstacle' : covers.some(([cx, cy]) => cx === x && cy === y) ? 'cover' : 'plain' }
  }) }
}

function unit(id, side, x, y, extra = {}) {
  return { id, name: id, side, x, y, hp: 10, maxHp: 10, attack: 5, armor: 1, attackRange: 5, moveRange: 3, status: 'ready', ...extra }
}

function movementScenario(units, orders, obstacles = []) {
  const events = []
  const next = resolveMovement({ map: makeMap(obstacles), units, orders, emit: (type, unitIds, data) => events.push({ type, unitIds, data }) })
  return { units: next, events }
}

test('moves multiple routes simultaneously and gives the same result for reordered units and orders', () => {
  const units = [unit('a', 'player', 0, 0), unit('b', 'enemy', 4, 2), unit('stay', 'player', 8, 8)]
  const orders = [
    { unitId: 'a', type: 'move', targetPosition: { x: 2, y: 0 }, path: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] },
    { unitId: 'b', type: 'move', targetPosition: { x: 2, y: 2 }, path: [{ x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 }] },
  ]
  const first = movementScenario(units, orders)
  const second = movementScenario([...units].reverse(), [...orders].reverse())
  const positions = (list) => Object.fromEntries(list.map(({ id, x, y }) => [id, [x, y]]))
  expect(positions(first.units)).toEqual(positions(second.units))
  expect(first.units.find((item) => item.id === 'a')).toMatchObject({ x: 2, y: 0 })
  expect(first.units.find((item) => item.id === 'b')).toMatchObject({ x: 2, y: 2 })
})

test('same-cell claims stop both units and produce movement_collision', () => {
  const result = movementScenario([unit('a', 'player', 0, 0), unit('b', 'enemy', 2, 0)], [
    { unitId: 'a', type: 'move', targetPosition: { x: 1, y: 0 }, path: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
    { unitId: 'b', type: 'move', targetPosition: { x: 1, y: 0 }, path: [{ x: 2, y: 0 }, { x: 1, y: 0 }] },
  ])
  expect(result.units.map(({ x, y }) => [x, y])).toEqual([[0, 0], [2, 0]])
  expect(result.events.find((event) => event.type === 'movement_collision').unitIds).toEqual(['a', 'b'])
})

test('forbids swaps and cyclic movement', () => {
  const swap = movementScenario([unit('a', 'player', 0, 0), unit('b', 'enemy', 1, 0)], [
    { unitId: 'a', type: 'move', targetPosition: { x: 1, y: 0 }, path: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
    { unitId: 'b', type: 'move', targetPosition: { x: 0, y: 0 }, path: [{ x: 1, y: 0 }, { x: 0, y: 0 }] },
  ])
  expect(swap.units.map(({ x, y }) => [x, y])).toEqual([[0, 0], [1, 0]])
  expect(swap.events.some((event) => event.type === 'movement_blocked' && event.data.reason.includes('Обмен'))).toBe(true)
})

test('allows an acyclic movement chain and blocks the chain if its lead unit cannot move', () => {
  const units = [unit('a', 'player', 0, 0), unit('b', 'enemy', 1, 0)]
  const orders = [
    { unitId: 'a', type: 'move', targetPosition: { x: 1, y: 0 }, path: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
    { unitId: 'b', type: 'move', targetPosition: { x: 2, y: 0 }, path: [{ x: 1, y: 0 }, { x: 2, y: 0 }] },
  ]
  expect(movementScenario(units, orders).units.map(({ x, y }) => [x, y])).toEqual([[1, 0], [2, 0]])
  const blocked = movementScenario(units, orders, [[2, 0]])
  expect(blocked.units.map(({ x, y }) => [x, y])).toEqual([[0, 0], [1, 0]])
  expect(blocked.events.some((event) => event.type === 'movement_blocked')).toBe(true)
})

test('obstacles and stationary living units stop movement; destroyed units do not occupy cells', () => {
  const route = (id) => ({ unitId: id, type: 'move', targetPosition: { x: 1, y: 0 }, path: [{ x: 0, y: 0 }, { x: 1, y: 0 }] })
  const obstacle = movementScenario([unit('a', 'player', 0, 0)], [route('a')], [[1, 0]])
  expect(obstacle.units[0]).toMatchObject({ x: 0, y: 0 })
  const occupied = movementScenario([unit('a', 'player', 0, 0), unit('b', 'enemy', 1, 0)], [route('a')])
  expect(occupied.units[0]).toMatchObject({ x: 0, y: 0 })
  const destroyed = movementScenario([unit('a', 'player', 0, 0), unit('b', 'enemy', 1, 0, { hp: 0, status: 'destroyed' })], [route('a')])
  expect(destroyed.units[0]).toMatchObject({ x: 1, y: 0 })
})

test('combat applies cover and Defend armor bonuses through the shared damage formula', () => {
  const battle = { map: makeMap([], [[1, 0]]), units: [unit('attacker-cover', 'enemy', 0, 0, { attack: 6 }), unit('cover', 'player', 1, 0, { armor: 1 }), unit('defender', 'player', 0, 2, { armor: 1 }), unit('attacker-defend', 'enemy', 0, 3, { attack: 5 })] }
  const events = []
  const { units } = resolveCombat({ battle, orders: [{ unitId: 'attacker-cover', type: 'attack', targetUnitId: 'cover' }, { unitId: 'attacker-defend', type: 'attack', targetUnitId: 'defender' }, { unitId: 'defender', type: 'defend' }], emit: (type, unitIds, data) => events.push({ type, unitIds, data }) })
  expect(units.find((item) => item.id === 'cover').hp).toBe(7)
  expect(units.find((item) => item.id === 'defender').hp).toBe(9)
  expect(events.find((event) => event.type === 'attack_performed' && event.data.targetId === 'cover').data.coverBonus).toBeGreaterThan(0)
  expect(events.find((event) => event.type === 'attack_performed' && event.data.targetId === 'defender').data.defendBonus).toBeGreaterThan(0)
})

test('simultaneous attacks can mutually destroy units and HP never drops below zero', () => {
  const battle = { map: makeMap(), units: [unit('a', 'player', 0, 0, { hp: 2, attack: 8 }), unit('b', 'enemy', 1, 0, { hp: 2, attack: 8 })] }
  const { units } = resolveCombat({ battle, orders: [{ unitId: 'a', type: 'attack', targetUnitId: 'b' }, { unitId: 'b', type: 'attack', targetUnitId: 'a' }], emit: () => {} })
  expect(units.map((item) => item.hp)).toEqual([0, 0])
  expect(units.every((item) => item.status === 'destroyed')).toBe(true)
})

test('destroyed attackers cannot act', () => {
  const battle = { map: makeMap(), units: [unit('dead', 'player', 0, 0, { hp: 0, status: 'destroyed' }), unit('target', 'enemy', 1, 0)] }
  const events = []
  const { units } = resolveCombat({ battle, orders: [{ unitId: 'dead', type: 'attack', targetUnitId: 'target' }], emit: (type) => events.push(type) })
  expect(units.find((item) => item.id === 'target').hp).toBe(10)
  expect(events).toContain('attack_blocked')
})

test('AI creates deterministic valid orders without reading hidden player orders', () => {
  const state = createBattleState({ battleId: 'ai-test', missionId: 'ai-test', map: makeMap(), units: [unit('p1', 'player', 0, 0), unit('p2', 'player', 1, 0), unit('e1', 'enemy', 6, 0), unit('e2', 'enemy', 6, 2)], objectives: [] })
  const first = createEnemyOrders(state)
  const withHiddenOrders = createEnemyOrders({ ...state, playerOrders: [{ unitId: 'p1', type: 'attack', targetUnitId: 'e1' }] })
  expect(first).toEqual(withHiddenOrders)
  expect(first.map((order) => order.unitId)).toEqual(['e1', 'e2'])
})

test('AI attacks before defending, and defends a threatened low-health unit when it cannot attack', () => {
  const makeState = (enemy) => createBattleState({ battleId: 'ai-priority', missionId: 'ai-priority', map: makeMap(), units: [unit('ally', 'player', 0, 0, { attackRange: 3 }), enemy], objectives: [] })
  expect(createEnemyOrders(makeState(unit('enemy', 'enemy', 1, 0, { hp: 2, attackRange: 2 })))[0].type).toBe('attack')
  expect(createEnemyOrders(makeState(unit('enemy', 'enemy', 2, 0, { hp: 2, attackRange: 1 })))[0].type).toBe('defend')
})

test('round resolution snapshots state, is repeat-safe, and advances exactly one round only after results', () => {
  let state = createBattleState({ battleId: 'round-test', missionId: 'round-test', map: makeMap(), units: [unit('p', 'player', 0, 0), unit('e', 'enemy', 2, 0)], objectives: [] })
  state = confirmOrders(state).battle
  const before = JSON.stringify(state.units)
  const result = resolveRound({ battleState: state, enemyOrders: [] })
  expect(result.ok).toBe(true)
  expect(JSON.stringify(state.units)).toBe(before)
  expect(Object.isFrozen(result.nextState.roundSnapshot)).toBe(true)
  expect(Object.isFrozen(result.nextState.roundSnapshot.units[0])).toBe(true)
  expect(result.nextState.round).toBe(1)
  expect(result.events[0].type).toBe('round_started')
  expect(result.events.every((event) => event.id && event.round === 1 && event.type && Array.isArray(event.unitIds) && event.data)).toBe(true)
  expect(new Set(result.events.map((event) => event.id)).size).toBe(result.events.length)
  expect(resolveRound({ battleState: result.nextState, enemyOrders: [] }).ok).toBe(false)
  const next = startNextRound(result.nextState)
  expect(next.ok).toBe(true)
  expect(next.nextState.round).toBe(2)
  expect(next.nextState.playerOrders).toEqual([])
  expect(startNextRound(next.nextState).ok).toBe(false)
})

test('outcomes cover victory, defeat, and draw', () => {
  const resolve = (playerHp, enemyHp, attackOrders) => {
    let state = createBattleState({ battleId: 'outcome-test', missionId: 'outcome-test', map: makeMap(), units: [unit('p', 'player', 0, 0, { hp: playerHp, attack: 10 }), unit('e', 'enemy', 1, 0, { hp: enemyHp, attack: 10 })], objectives: [] })
    state = { ...confirmOrders(state).battle, playerOrders: [{ unitId: 'p', type: 'attack', targetUnitId: 'e' }], confirmedOrders: Object.freeze([{ unitId: 'p', type: 'attack', targetUnitId: 'e' }]) }
    return resolveRound({ battleState: state, enemyOrders: attackOrders ? [{ unitId: 'e', type: 'attack', targetUnitId: 'p' }] : [] })
  }
  expect(resolve(10, 1, false).nextState.battleStatus).toBe('victory')
  expect(resolve(1, 10, true).nextState.battleStatus).toBe('defeat')
  expect(resolve(1, 1, true).nextState.battleStatus).toBe('draw')
})
