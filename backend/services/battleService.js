import { randomBytes } from 'node:crypto'
import { applyBattleAction, battleSnapshot, createBattle, FACTIONS } from '../game/battleEngine.js'
import { readOnlineState, saveOnlineState } from '../storage.js'

const savedOnlineState = readOnlineState()
const sessions = new Map((Array.isArray(savedOnlineState.sessions) ? savedOnlineState.sessions : []).map((match) => [match.id, match]))
const waitingPlayers = Array.isArray(savedOnlineState.waitingPlayers) ? savedOnlineState.waitingPlayers : []
const userMatches = new Map([...sessions.values()].filter((match) => match.status !== 'finished').flatMap((match) => match.players.map((player) => [player.userId, match.id])))

function persistOnlineState() {
  saveOnlineState({ sessions: [...sessions.values()], waitingPlayers })
}

function createMatch(first, second) {
  const match = createBattle({
    id: randomBytes(9).toString('base64url'),
    players: [first, second],
    firstPlayerIndex: Math.random() < 0.5 ? 0 : 1,
    topPlayerIndex: Math.random() < 0.5 ? 0 : 1,
    reverseObjectives: Math.random() < 0.5,
  })
  sessions.set(match.id, match)
  match.players.forEach((player) => userMatches.set(player.userId, match.id))
  persistOnlineState()
  return match
}

export function queueForMatch(user, faction) {
  const currentId = userMatches.get(user.id)
  if (currentId && sessions.get(currentId)?.status !== 'finished') return { status: 'matched', matchId: currentId }
  if (!FACTIONS.includes(faction)) return { error: 'Выбери Империум, Хаос, Орков или Тау.', statusCode: 400 }
  const existing = waitingPlayers.find((entry) => entry.userId === user.id)
  if (existing) {
    existing.faction = faction
    persistOnlineState()
    return { status: 'waiting' }
  }
  const opponentIndex = waitingPlayers.findIndex((entry) => entry.userId !== user.id)
  if (opponentIndex >= 0) {
    const [opponent] = waitingPlayers.splice(opponentIndex, 1)
    const match = createMatch(opponent, { userId: user.id, username: user.username, faction })
    return { status: 'matched', matchId: match.id }
  }
  waitingPlayers.push({ userId: user.id, username: user.username, faction })
  persistOnlineState()
  return { status: 'waiting' }
}

export function cancelQueue(userId) {
  const index = waitingPlayers.findIndex((entry) => entry.userId === userId)
  if (index >= 0) {
    waitingPlayers.splice(index, 1)
    persistOnlineState()
  }
}

export function getMatch(matchId, userId) {
  const match = sessions.get(matchId)
  if (!match || !match.players.some((player) => player.userId === userId)) return null
  return battleSnapshot(match, userId)
}

export function performMatchAction(matchId, userId, type, payload) {
  const match = sessions.get(matchId)
  if (!match || !match.players.some((player) => player.userId === userId)) return { error: 'Операция не найдена.', status: 404 }
  const result = applyBattleAction(match, userId, type, payload)
  if (result.error) return { error: result.error, status: result.status }
  sessions.set(matchId, result.state)
  persistOnlineState()
  return { match: battleSnapshot(result.state, userId), attack: result.attack }
}
