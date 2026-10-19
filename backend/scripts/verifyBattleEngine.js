import assert from 'node:assert/strict'
import { applyBattleAction, availableMoves, createBattle, FACTIONS } from '../game/battleEngine.js'

const players = [
  { userId: 'imperium', username: 'Imperium', faction: 'imperium' },
  { userId: 'orks', username: 'Orks', faction: 'orks' },
]
const battle = (id = 'verification') => createBattle({ id, players, now: 1 })
const run = (state, playerId, type, payload = {}, dice = []) => {
  let index = 0
  return applyBattleAction(state, playerId, type, payload, () => dice[index++] ?? 0.5, 2)
}

let state = battle()
assert.equal(state.players[state.activePlayer].userId, 'imperium')
assert.equal(state.units.find((unit) => unit.id === '0-tactical').x, 2)
assert.equal(state.units.find((unit) => unit.id === '1-boy').x, 9)
assert(availableMoves(state, 'imperium', '0-tactical').some(({ x, y }) => x === 3 && y === 1))
assert.equal(availableMoves(state, 'orks', '1-boy').length, 0)

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
