import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sector-vermillion-online-'))
process.env.SECTOR_DATA_DIRECTORY = dataDirectory
const service = await import('../services/battleService.js')
const storage = await import('../storage.js')
const { availableAttacks, availableMoves } = await import('../game/battleEngine.js')

after(() => {
  delete process.env.SECTOR_DATA_DIRECTORY
  fs.rmSync(dataDirectory, { recursive: true, force: true })
})

test('private room, idempotent actions, restart recovery, timers, reconnect, rematch and room limits', async () => {
  const one = { id: 'test-owner', username: 'Owner' }
  const two = { id: 'test-guest', username: 'Guest' }
  const third = { id: 'test-intruder', username: 'Intruder' }

  const created = service.createPrivateRoom(one, 'imperium')
  assert.equal(created.room.status, 'waiting')
  assert.equal(created.room.players.length, 1)
  const joined = service.joinPrivateRoom(created.room.code, two, 'tau')
  assert.equal(joined.room.players.length, 2)
  assert.equal(service.joinPrivateRoom(created.room.code, third, 'orks').statusCode, 409, 'a third player must be rejected')
  assert.equal(service.setRoomReady(created.room.code, one.id, 'true').statusCode, 400, 'readiness must be a boolean')

  const ownerReady = service.setRoomReady(created.room.code, one.id, true)
  assert.equal(ownerReady.room.status, 'waiting', 'the match must wait for both ready flags')
  assert.equal(ownerReady.matchId, null)
  const started = service.setRoomReady(created.room.code, two.id, true)
  assert.equal(started.room.status, 'active')
  const matchId = started.matchId
  assert.ok(matchId)

  const match = service.getMatch(matchId, one.id)
  assert.equal(match.units.length, 6)
  const activeUser = match.players[match.activePlayer].userId
  const activeIndex = match.players[match.activePlayer].index
  const movingUnit = match.units.find((unit) => unit.playerIndex === activeIndex)
  const occupied = new Set(match.units.filter((unit) => unit.hp > 0).map((unit) => `${unit.x},${unit.y}`))
  const blocked = new Set(match.obstacles.map((cell) => `${cell.x},${cell.y}`))
  const destination = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
    .map(([dx, dy]) => ({ x: movingUnit.x + dx, y: movingUnit.y + dy }))
    .find((cell) => {
      const cornerBlocked = Math.abs(cell.x - movingUnit.x) === 1 && Math.abs(cell.y - movingUnit.y) === 1
        && match.obstacles.some((obstacle) => obstacle.x === movingUnit.x && obstacle.y === cell.y)
        && match.obstacles.some((obstacle) => obstacle.x === cell.x && obstacle.y === movingUnit.y)
      return cell.x >= 0 && cell.y >= 0 && cell.x < 12 && cell.y < 12 && !occupied.has(`${cell.x},${cell.y}`) && !blocked.has(`${cell.x},${cell.y}`) && !cornerBlocked
    })
  assert.ok(destination)
  const concurrentMove = (actionId) => Promise.resolve().then(() => service.performMatchAction(matchId, activeUser, 'move', { unitId: movingUnit.id, ...destination }, actionId))
  const simultaneousMoves = await Promise.all([concurrentMove('concurrent-move-0001'), concurrentMove('concurrent-move-0002')])
  assert.equal(simultaneousMoves.filter((result) => !result.error).length, 1, 'simultaneous moves for one unit must serialize to one accepted command')
  assert.equal(simultaneousMoves.filter((result) => result.status === 409).length, 1)

  const actionId = 'stable-command-0001'
  const firstResult = service.performMatchAction(matchId, activeUser, 'end-turn', {}, actionId)
  assert.equal(firstResult.error, undefined)
  const retryResult = service.performMatchAction(matchId, activeUser, 'end-turn', {}, actionId)
  assert.equal(retryResult.match.activePlayer, firstResult.match.activePlayer, 'retry must return the original result without ending another turn')
  assert.equal(service.performMatchAction(matchId, activeUser, 'surrender', {}, actionId).status, 409, 'an action id cannot be reused for a different command')

  let attackRetryChecked = false
  for (let step = 0; step < 80 && !attackRetryChecked; step += 1) {
    let current = service.getMatch(matchId, one.id)
    if (current.status !== 'active') break
    const currentPlayer = current.players[current.activePlayer]
    const currentUser = currentPlayer.userId
    let availableAttack = null
    for (const unit of current.units.filter((candidate) => candidate.playerIndex === currentPlayer.index && candidate.hp > 0)) {
      availableAttack = availableAttacks(current, currentUser, unit.id)[0]
      if (availableAttack) { availableAttack.unitId = unit.id; break }
    }
    if (availableAttack) {
      const attackPayload = { ...availableAttack }
      const hpBeforeAttack = current.units.filter((unit) => unit.playerIndex !== currentPlayer.index).reduce((sum, unit) => sum + unit.hp, 0)
      const attackId = 'lost-attack-response-0001'
      const acceptedAttack = service.performMatchAction(matchId, currentUser, 'attack', attackPayload, attackId)
      assert.equal(acceptedAttack.error, undefined)
      const hpAfterAttack = acceptedAttack.match.units.filter((unit) => unit.playerIndex !== currentPlayer.index).reduce((sum, unit) => sum + unit.hp, 0)
      const retriedAttack = service.performMatchAction(matchId, currentUser, 'attack', attackPayload, attackId)
      assert.deepEqual(retriedAttack, acceptedAttack, 'a lost attack response must replay the original result')
      assert.equal(retriedAttack.match.units.filter((unit) => unit.playerIndex !== currentPlayer.index).reduce((sum, unit) => sum + unit.hp, 0), hpAfterAttack)
      assert.ok(hpAfterAttack <= hpBeforeAttack)
      attackRetryChecked = true
      break
    }

    const enemies = current.units.filter((unit) => unit.hp > 0 && unit.playerIndex !== currentPlayer.index)
    for (const unit of current.units.filter((candidate) => candidate.playerIndex === currentPlayer.index && candidate.hp > 0)) {
      const moves = availableMoves(current, currentUser, unit.id)
      const currentDistance = Math.min(...enemies.map((enemy) => Math.max(Math.abs(unit.x - enemy.x), Math.abs(unit.y - enemy.y))))
      const bestMove = moves.map((move) => ({ ...move, distance: Math.min(...enemies.map((enemy) => Math.max(Math.abs(move.x - enemy.x), Math.abs(move.y - enemy.y)))) }))
        .filter((move) => move.distance < currentDistance)
        .sort((left, right) => left.distance - right.distance)[0]
      if (bestMove) {
        const moveResult = service.performMatchAction(matchId, currentUser, 'move', { unitId: unit.id, x: bestMove.x, y: bestMove.y }, `approach-${step}-${unit.id}`)
        assert.equal(moveResult.error, undefined)
        current = moveResult.match
      }
    }
    const endTurn = service.performMatchAction(matchId, currentUser, 'end-turn', {}, `approach-end-turn-${step}`)
    assert.equal(endTurn.error, undefined)
  }
  assert.equal(attackRetryChecked, true, 'test battle must reach an attack so interrupted-response retry is covered')

  const childCode = `const service = await import(${JSON.stringify(new URL('../services/battleService.js', import.meta.url).href)}); const match = service.getMatch(${JSON.stringify(matchId)}, ${JSON.stringify(two.id)}); const room = service.getPrivateRoom(${JSON.stringify(created.room.code)}, ${JSON.stringify(two.id)}); console.log(JSON.stringify({ id: match?.id, units: match?.units.length, roomStatus: room?.status, roomPlayers: room?.players.length }));`
  const childOutput = execFileSync(process.execPath, ['--input-type=module', '-e', childCode], {
    env: { ...process.env, SECTOR_DATA_DIRECTORY: dataDirectory }, encoding: 'utf8',
  })
  const recoveredMatch = JSON.parse(childOutput.trim())
  assert.equal(recoveredMatch.id, matchId, 'active matches must load from persistent storage after process restart')
  assert.equal(recoveredMatch.units, 6)
  assert.equal(recoveredMatch.roomStatus, 'active', 'private rooms must survive a server restart')
  assert.equal(recoveredMatch.roomPlayers, 2)

  const persisted = storage.readOnlineState()
  const savedMatch = persisted.sessions.find((candidate) => candidate.id === matchId)
  const previousPlayer = savedMatch.activePlayer
  service.sweepOnlineMatches(savedMatch.turnDeadlineAt + 1)
  const timedMatch = service.getMatch(matchId, activeUser)
  assert.notEqual(timedMatch.activePlayer, previousPlayer, 'a 60-second turn deadline must pass the inactive player turn')

  const disconnectedUser = timedMatch.players.find((player) => player.userId !== activeUser).userId
  service.sweepOnlineMatches(Date.now() + 20_000)
  const reconnectedMatch = service.getMatch(matchId, disconnectedUser)
  assert.equal(reconnectedMatch.playerPresence[reconnectedMatch.players.find((player) => player.userId === disconnectedUser).index].connected, true, 'a returning player heartbeat must restore their connection')
  const synchronizedMatch = service.getMatch(matchId, activeUser)
  const synchronizedReconnectedMatch = service.getMatch(matchId, disconnectedUser)
  assert.deepEqual(synchronizedReconnectedMatch.units, synchronizedMatch.units, 'both clients must see the same units after reconnect')
  assert.deepEqual(synchronizedReconnectedMatch.controlPoints, synchronizedMatch.controlPoints, 'both clients must see the same control points after reconnect')
  assert.deepEqual(synchronizedReconnectedMatch.log, synchronizedMatch.log, 'both clients must see the same battle log after reconnect')

  service.sweepOnlineMatches(Date.now() + 20_000)
  const afterDisconnect = storage.readOnlineState().sessions.find((candidate) => candidate.id === matchId)
  const expiredUser = afterDisconnect.players.map((player) => player.userId)
    .filter((userId) => !afterDisconnect.playerPresence[userId].connected)
    .sort((left, right) => afterDisconnect.playerPresence[left].reconnectDeadlineAt - afterDisconnect.playerPresence[right].reconnectDeadlineAt)[0]
  const graceDeadline = afterDisconnect.playerPresence[expiredUser].reconnectDeadlineAt
  service.sweepOnlineMatches(graceDeadline + 1)
  const forfeited = service.getMatch(matchId, expiredUser)
  assert.equal(forfeited.status, 'finished', 'a player who misses the 90-second reconnect window must forfeit')
  const forfeitingPlayer = forfeited.players.find((player) => forfeited.winReason.includes(player.username))
  assert.ok(forfeitingPlayer)
  assert.equal(forfeited.winnerIndex, forfeited.players.find((player) => player.index !== forfeitingPlayer.index).index)

  const finishedRoom = service.getPrivateRoom(created.room.code, one.id)
  assert.equal(finishedRoom.status, 'finished')
  const firstRematchVote = service.readyForRematch(created.room.code, one.id)
  assert.equal(firstRematchVote.room.status, 'finished', 'one rematch vote must not launch a match')
  const secondRematchVote = service.readyForRematch(created.room.code, two.id)
  assert.equal(secondRematchVote.room.status, 'active')
  assert.ok(secondRematchVote.matchId)
  assert.notEqual(secondRematchVote.matchId, matchId)
  assert.equal(service.leavePrivateRoom(created.room.code, one.id).statusCode, 409, 'room members cannot leave the room during a match')
  const rematch = service.getMatch(secondRematchVote.matchId, one.id)
  const surrenderingPlayer = rematch.players[rematch.activePlayer]
  const surrendered = service.performMatchAction(rematch.id, surrenderingPlayer.userId, 'surrender', {}, 'test-surrender-command-0001')
  assert.equal(surrendered.match.status, 'finished')
  const guestLeaves = service.leavePrivateRoom(created.room.code, two.id)
  assert.equal(guestLeaves.status, 'left')
  const reused = service.joinPrivateRoom(created.room.code, third, 'orks')
  assert.equal(reused.room.players.length, 2, 'the vacated guest seat can be reused')
  assert.equal(service.leavePrivateRoom(created.room.code, one.id).status, 'deleted', 'the owner can delete a waiting room')

  assert.equal(service.queueForMatch(third, 'tau').status, 'waiting', 'quick matchmaking must remain available')
  service.cancelQueue(third.id)
  assert.equal(service.queueForMatch(one, 'chaos').status, 'waiting')
  const quickMatch = service.queueForMatch(two, 'orks')
  assert.equal(quickMatch.status, 'matched')
  assert.deepEqual(service.getMatch(quickMatch.matchId, one.id).players.map((player) => player.faction), ['chaos', 'orks'])
})
