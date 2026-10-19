import assert from 'node:assert/strict'
import { applyBattleAction, availableMoves, calculateWoundTarget, createBattle, FACTIONS, rollD6 } from '../game/battleEngine.js'

const players = [
  { userId: 'imperium', username: 'Imperium', faction: 'imperium' },
  { userId: 'orks', username: 'Orks', faction: 'orks' },
]
const battle = (id = 'verification') => createBattle({ id, players, now: 1 })
const run = (state, playerId, type, payload = {}, dice = []) => {
  let index = 0
  return applyBattleAction(state, playerId, type, payload, () => dice[index++] ?? 0.5, 2)
}

assert.equal(rollD6(() => 0), 1, 'D6 lower bound is 1')
assert.equal(rollD6(() => 0.999999), 6, 'D6 upper bound is 6')
assert.deepEqual(Array.from({ length: 6 }, (_, index) => rollD6(() => index / 6)), [1, 2, 3, 4, 5, 6], 'D6 must map every face correctly')
assert.deepEqual([calculateWoundTarget(8, 4), calculateWoundTarget(5, 4), calculateWoundTarget(4, 4), calculateWoundTarget(3, 4), calculateWoundTarget(2, 4)], [2, 3, 4, 5, 6])

let state = battle()
assert.equal(state.players[state.activePlayer].userId, 'imperium')
assert.equal(state.units.find((unit) => unit.id === '0-tactical').x, 2)
assert.equal(state.units.find((unit) => unit.id === '1-boy').x, 9)
assert(availableMoves(state, 'imperium', '0-tactical').some(({ x, y }) => x === 3 && y === 1))
assert.equal(availableMoves(state, 'orks', '1-boy').length, 0)

// Every one-cell direction is legal when the unit has open space around it.
for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) {
  const directionalBattle = battle(`direction-${dx}-${dy}`)
  const movingUnit = directionalBattle.units.find((candidate) => candidate.id === '0-tactical')
  movingUnit.x = 2; movingUnit.y = 6
  const directionalMove = run(directionalBattle, 'imperium', 'move', { unitId: movingUnit.id, x: 2 + dx, y: 6 + dy })
  assert.equal(directionalMove.error, undefined, `movement should allow direction ${dx},${dy}`)
  assert.deepEqual(
    { x: directionalMove.state.units.find((candidate) => candidate.id === movingUnit.id).x, y: directionalMove.state.units.find((candidate) => candidate.id === movingUnit.id).y },
    { x: 2 + dx, y: 6 + dy },
  )
}

state = battle('movement-guards')
const guardedUnit = state.units.find((candidate) => candidate.id === '0-tactical')
guardedUnit.x = 3; guardedUnit.y = 2
assert.match(run(state, 'imperium', 'move', { unitId: guardedUnit.id, x: 4, y: 2 }).error, /занята или заблокирована/, 'obstacles must block movement')
state.units.find((candidate) => candidate.id === '1-boy').x = 3
state.units.find((candidate) => candidate.id === '1-boy').y = 3
assert.match(run(state, 'imperium', 'move', { unitId: guardedUnit.id, x: 3, y: 3 }).error, /занята или заблокирована/, 'occupied cells must block movement')
state.units.find((candidate) => candidate.id === '0-tactical').x = 0
state.units.find((candidate) => candidate.id === '0-tactical').y = 0
assert.match(run(state, 'imperium', 'move', { unitId: guardedUnit.id, x: -1, y: 0 }).error, /вне карты/, 'movement must not leave the board')
assert.match(run(state, 'imperium', 'move', { unitId: guardedUnit.id, x: 0, y: 12 }).error, /вне карты/, 'movement must not exceed the board edge')
assert.match(run(state, 'imperium', 'move', { unitId: guardedUnit.id, x: 2, y: 1 }).error, /одну клетку/, 'movement must be limited to one cell')
state.units.find((candidate) => candidate.id === '0-tactical').x = 4
state.units.find((candidate) => candidate.id === '0-tactical').y = 4
assert.match(run(state, 'imperium', 'move', { unitId: guardedUnit.id, x: 5, y: 3 }).error, /между двумя препятствиями/, 'diagonal corner cutting must be blocked')
assert.match(run(state, 'imperium', 'move', { unitId: guardedUnit.id, x: '3', y: 3 }).error, /вне карты/, 'coordinates must be numeric integers, not coerced strings')

state = battle('movement')
const original = state
const moved = run(state, 'imperium', 'move', { unitId: '0-tactical', x: 3, y: 1 })
assert.equal(moved.state.units.find((unit) => unit.id === '0-tactical').x, 3)
assert.equal(original.units.find((unit) => unit.id === '0-tactical').x, 2, 'actions must not mutate the previous state')
assert.equal(run(moved.state, 'imperium', 'move', { unitId: '0-tactical', x: 4, y: 2 }).error, 'Этот отряд уже перемещался в текущем ходу.')

state = battle('attack')
const target = state.units.find((unit) => unit.id === '1-boy')
target.x = 2; target.y = 3
const attack = run(state, 'imperium', 'attack', { unitId: '0-tactical', targetUnitId: target.id, weaponType: 'ranged' }, [0.5, 0.5, 0, 0])
assert.equal(attack.attack.attacks[0].hit, 4)
assert.equal(attack.attack.attacks[0].wound, 4)
assert.equal(attack.attack.attacks[0].save, 1)
assert.equal(attack.attack.attacks[0].damage, 2)
assert.equal(attack.state.units.find((unit) => unit.id === '1-boy').hp, target.maxHp - 2)

state = battle('ap-and-saves')
const apTarget = state.units.find((unit) => unit.id === '1-boy')
apTarget.x = 2; apTarget.y = 3
const savedAttack = run(state, 'imperium', 'attack', { unitId: '0-tactical', targetUnitId: apTarget.id, weaponType: 'ranged' }, [0.5, 0.5, 5 / 6, 0])
assert.equal(savedAttack.attack.attacks[0].save, 6)
assert.equal(savedAttack.attack.attacks[0].damage, 0, 'a save equal to the AP-adjusted target should succeed')
assert.equal(savedAttack.attack.attacks[1].hit, 1)
assert.equal(savedAttack.attack.attacks[1].wound, null)

state = battle('ap-failure')
const apFailureTarget = state.units.find((unit) => unit.id === '1-boy')
apFailureTarget.x = 2; apFailureTarget.y = 3
const failedSave = run(state, 'imperium', 'attack', { unitId: '0-tactical', targetUnitId: apFailureTarget.id, weaponType: 'ranged' }, [0.5, 0.5, 4 / 6, 0])
assert.equal(failedSave.attack.attacks[0].save, 5)
assert.equal(failedSave.attack.attacks[0].damage, 2, 'AP worsens the target save threshold')

state = battle('cover-save')
const coverTarget = state.units.find((unit) => unit.id === '1-boy')
coverTarget.x = 2; coverTarget.y = 4
state.units.find((unit) => unit.id === '0-tactical').x = 0
state.units.find((unit) => unit.id === '0-tactical').y = 4
const coverSaved = run(state, 'imperium', 'attack', { unitId: '0-tactical', targetUnitId: coverTarget.id, weaponType: 'ranged' }, [0.5, 0.5, 4 / 6, 0])
assert.equal(coverSaved.attack.attacks[0].save, 5)
assert.equal(coverSaved.attack.attacks[0].damage, 0, 'cover improves the save by one')

state = battle('damage-is-capped')
const fragileTarget = state.units.find((unit) => unit.id === '1-boy')
fragileTarget.x = 2; fragileTarget.y = 3; fragileTarget.hp = 1
const lethalAttack = run(state, 'imperium', 'attack', { unitId: '0-tactical', targetUnitId: fragileTarget.id, weaponType: 'ranged' }, [0.5, 0.5, 0, 0.5, 0.5, 0])
assert.equal(lethalAttack.attack.totalDamage, 1, 'damage must not exceed remaining HP')
assert.equal(lethalAttack.state.units.find((unit) => unit.id === fragileTarget.id).hp, 0)
assert.deepEqual(lethalAttack.state.stats, { attackActions: 1, damage: 1, destroyedUnits: 1 })

state = battle('army-elimination')
for (const enemy of state.units.filter((candidate) => candidate.playerIndex === 1)) enemy.hp = 0
const lastTarget = state.units.find((candidate) => candidate.id === '1-boy')
lastTarget.hp = 1
lastTarget.x = 2; lastTarget.y = 3
const finalAttack = run(state, 'imperium', 'attack', { unitId: '0-tactical', targetUnitId: lastTarget.id, weaponType: 'ranged' }, [0.5, 0.5, 0, 0])
assert.equal(finalAttack.state.status, 'finished', 'destroying the last enemy unit must finish the battle')
assert.equal(finalAttack.state.winnerIndex, 0)

state = battle('reject-invalid-actions')
assert.match(run(state, 'imperium', 'attack', { unitId: '0-tactical', targetUnitId: '0-terminator', weaponType: 'ranged' }).error, /Цель не найдена/)
assert.match(run(state, 'imperium', 'attack', { unitId: '1-boy', targetUnitId: '0-tactical', weaponType: 'ranged' }).error, /Отряд не найден/)
assert.match(run(state, 'imperium', 'attack', { unitId: '0-tactical', targetUnitId: '1-boy', weaponType: 'plasma' }).error, /Выбери оружие/)

state = battle('capture')
const point = state.controlPoints[0]
const unit = state.units.find((candidate) => candidate.id === '0-tactical')
unit.x = point.x; unit.y = point.y
state = run(state, 'imperium', 'end-turn').state
assert.equal(state.controlPoints[0].capture.turns, 1)
state = run(state, 'orks', 'end-turn').state
state = run(state, 'imperium', 'end-turn').state
assert.equal(state.controlPoints[0].ownerIndex, 0, 'capture completes after two consecutive own turns')

state = battle('surrender')
const surrender = run(state, 'imperium', 'surrender')
assert.equal(surrender.state.status, 'finished')
assert.equal(surrender.state.winnerIndex, 1)

state = createBattle({ id: 'initiative', players, firstPlayerIndex: 1, topPlayerIndex: 0, now: 1 })
state = run(state, 'orks', 'end-turn').state
assert.equal(state.turn, 1, 'round does not advance before both players have acted')
state = run(state, 'imperium', 'end-turn').state
assert.equal(state.turn, 2, 'round advances after initiative returns to its starting player')

assert.deepEqual(FACTIONS, ['imperium', 'chaos', 'orks', 'tau'])
for (const faction of FACTIONS) {
  const opponent = FACTIONS.find((candidate) => candidate !== faction)
  const mixedBattle = createBattle({ id: `faction-${faction}`, players: [
    { userId: 'one', username: 'One', faction },
    { userId: 'two', username: 'Two', faction: opponent },
  ], now: 1 })
  assert.equal(mixedBattle.units.filter((unit) => unit.playerIndex === 0).length, 3)
  assert.equal(mixedBattle.units.filter((unit) => unit.playerIndex === 1).length, 3)
  assert(mixedBattle.units.every((unit) => unit.weapons.ranged && unit.weapons.melee))
}

console.log('Боевой движок: проверены четыре фракции, смешанные составы и правила хода, атаки, захвата и сдачи.')
