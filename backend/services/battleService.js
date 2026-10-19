import { randomBytes } from 'node:crypto'
import { applyBattleAction, battleSnapshot, createBattle, FACTIONS } from '../game/battleEngine.js'
import { readOnlineState, saveOnlineState } from '../storage.js'

export const TURN_TIME_LIMIT_MS = 60_000
export const RECONNECT_GRACE_MS = 90_000
const PRESENCE_STALE_MS = 15_000

const savedOnlineState = readOnlineState()
const sessions = new Map((Array.isArray(savedOnlineState.sessions) ? savedOnlineState.sessions : []).map((match) => [match.id, match]))
const waitingPlayers = Array.isArray(savedOnlineState.waitingPlayers) ? savedOnlineState.waitingPlayers : []
const rooms = new Map((Array.isArray(savedOnlineState.rooms) ? savedOnlineState.rooms : []).map((room) => [room.code, room]))
const userMatches = new Map()
const userRooms = new Map()
const now = Date.now()

for (const match of sessions.values()) {
  if (match.status === 'active') {
    match.turnDeadlineAt ||= now + TURN_TIME_LIMIT_MS
    match.recentCommands ||= []
    match.playerPresence ||= {}
    for (const player of match.players) {
      match.playerPresence[player.userId] = { connected: true, lastSeenAt: now, reconnectDeadlineAt: null }
      userMatches.set(player.userId, match.id)
    }
  }
}
for (const room of rooms.values()) for (const player of room.players || []) userRooms.set(player.userId, room.code)

function persistOnlineState() {
  saveOnlineState({ sessions: [...sessions.values()], waitingPlayers, rooms: [...rooms.values()] })
}

function appendLog(match, text, at = Date.now()) {
  match.log ||= []
  const sequence = (match.log.at(-1)?.sequence || match.log.length) + 1
  match.log.push({ id: `${match.id}-${match.turn}-${sequence}`, sequence, turn: match.turn, text })
  if (match.log.length > 100) match.log.shift()
  match.updatedAt = at
}

function playerInRoom(room, userId) { return room.players.find((player) => player.userId === userId) }
function validFaction(faction) { return FACTIONS.includes(faction) }
function roomForUser(userId) {
  const code = userRooms.get(userId)
  return code ? rooms.get(code) : null
}

function createMatch(first, second, roomCode = null, at = Date.now()) {
  const match = createBattle({
    id: randomBytes(9).toString('base64url'), players: [first, second],
    firstPlayerIndex: Math.random() < 0.5 ? 0 : 1,
    topPlayerIndex: Math.random() < 0.5 ? 0 : 1,
    reverseObjectives: Math.random() < 0.5, now: at,
  })
  match.roomCode = roomCode
  match.turnDeadlineAt = at + TURN_TIME_LIMIT_MS
  match.playerPresence = Object.fromEntries(match.players.map((player) => [player.userId, {
    connected: true, lastSeenAt: at, reconnectDeadlineAt: null,
  }]))
  match.recentCommands = []
  sessions.set(match.id, match)
  match.players.forEach((player) => userMatches.set(player.userId, match.id))
  return match
}

function roomSnapshot(room, userId) {
  const match = room.matchId ? sessions.get(room.matchId) : null
  if (match?.status === 'finished' && room.status === 'active') room.status = 'finished'
  return {
    code: room.code,
    status: room.status,
    ownerId: room.ownerId,
    players: room.players.map((player) => ({
      userId: player.userId, username: player.username, faction: player.faction,
      ready: Boolean(player.ready), connected: player.userId === userId || Date.now() - (player.lastSeenAt || 0) <= PRESENCE_STALE_MS,
    })),
    matchId: room.matchId,
    viewerId: userId,
    rematchReady: { ...(room.rematchReady || {}) },
  }
}

function touchRoom(room, userId, at = Date.now()) {
  const player = playerInRoom(room, userId)
  if (player) player.lastSeenAt = at
}

function markConnected(match, userId, at = Date.now()) {
  const presence = match.playerPresence[userId] || {}
  const reconnected = !presence.connected
  match.playerPresence[userId] = { connected: true, lastSeenAt: at, reconnectDeadlineAt: null }
  if (reconnected) appendLog(match, `${match.players.find((player) => player.userId === userId)?.username} восстановил связь.`, at)
  return reconnected
}

function finishDisconnectedPlayer(match, userId, at) {
  const player = match.players.find((candidate) => candidate.userId === userId)
  const winner = match.players.find((candidate) => candidate.userId !== userId)
  match.status = 'finished'
  match.winnerIndex = winner.index
  match.winReason = `${player.username} не восстановил связь за 90 секунд.`
  match.turnDeadlineAt = null
  appendLog(match, `${winner.username} одержал победу. ${match.winReason}`, at)
}

function sweepExpiredMatches(at = Date.now()) {
  let changed = false
  for (const match of sessions.values()) {
    if (match.status !== 'active') continue
    for (const player of match.players) {
      const presence = match.playerPresence?.[player.userId]
      if (!presence || presence.connected === false) continue
      if (at - presence.lastSeenAt > PRESENCE_STALE_MS) {
        presence.connected = false
        presence.reconnectDeadlineAt = presence.lastSeenAt + RECONNECT_GRACE_MS
        appendLog(match, `${player.username} потерял связь. На восстановление есть 90 секунд.`, at)
        changed = true
      }
    }
    const disconnected = match.players.find((player) => {
      const presence = match.playerPresence?.[player.userId]
      return presence && !presence.connected && presence.reconnectDeadlineAt <= at
    })
    if (disconnected) {
      finishDisconnectedPlayer(match, disconnected.userId, at)
      changed = true
      continue
    }
    if (match.turnDeadlineAt && at >= match.turnDeadlineAt) {
      const active = match.players.find((player) => player.index === match.activePlayer)
      appendLog(match, `Время хода игрока ${active.username} истекло. Ход пропущен.`, at)
      const result = applyBattleAction(match, active.userId, 'end-turn', {}, Math.random, at)
      if (!result.error) sessions.set(match.id, result.state)
      const updated = sessions.get(match.id)
      updated.turnDeadlineAt = updated.status === 'active' ? at + TURN_TIME_LIMIT_MS : null
      changed = true
    }
  }
  if (changed) persistOnlineState()
}

function accessibleRoom(code, userId) {
  const room = rooms.get(String(code || '').trim().toUpperCase())
  if (!room || !playerInRoom(room, userId)) return null
  return room
}

export function queueForMatch(user, faction) {
  sweepExpiredMatches()
  const currentId = userMatches.get(user.id)
  if (currentId && sessions.get(currentId)?.status !== 'finished') return { status: 'matched', matchId: currentId }
  if (!validFaction(faction)) return { error: 'Выбери Империум, Хаос, Орков или Тау.', statusCode: 400 }
  if (roomForUser(user.id)) return { error: 'Сначала выйди из частной комнаты.', statusCode: 409 }
  const existing = waitingPlayers.find((entry) => entry.userId === user.id)
  if (existing) {
    existing.faction = faction
    persistOnlineState()
    return { status: 'waiting' }
  }
  const opponentIndex = waitingPlayers.findIndex((entry) => entry.userId !== user.id && !roomForUser(entry.userId))
  if (opponentIndex >= 0) {
    const [opponent] = waitingPlayers.splice(opponentIndex, 1)
    const match = createMatch(opponent, { userId: user.id, username: user.username, faction })
    persistOnlineState()
    return { status: 'matched', matchId: match.id }
  }
  waitingPlayers.push({ userId: user.id, username: user.username, faction })
  persistOnlineState()
  return { status: 'waiting' }
}

export function cancelQueue(userId) {
  const index = waitingPlayers.findIndex((entry) => entry.userId === userId)
  if (index >= 0) { waitingPlayers.splice(index, 1); persistOnlineState() }
}

export function getMatch(matchId, userId) {
  sweepExpiredMatches()
  const match = sessions.get(matchId)
  if (!match || !match.players.some((player) => player.userId === userId)) return null
  if (match.status === 'active' && markConnected(match, userId)) persistOnlineState()
  else if (match.status === 'active') match.playerPresence[userId].lastSeenAt = Date.now()
  return battleSnapshot(match, userId)
}

export function performMatchAction(matchId, userId, type, payload, actionId) {
  sweepExpiredMatches()
  const match = sessions.get(matchId)
  if (!match || !match.players.some((player) => player.userId === userId)) return { error: 'Операция не найдена.', status: 404 }
  if (typeof actionId !== 'string' || actionId.length < 8 || actionId.length > 128) return { error: 'Для команды требуется уникальный идентификатор.', status: 400 }
  markConnected(match, userId)
  const signature = JSON.stringify({ type, payload: payload || {} })
  const previous = match.recentCommands.find((command) => command.userId === userId && command.actionId === actionId)
  if (previous) return previous.signature === signature
    ? previous.response
    : { error: 'Идентификатор уже использован для другой команды.', status: 409 }
  const result = applyBattleAction(match, userId, type, payload)
  if (result.error) return { error: result.error, status: result.status }
  const updated = result.state
  updated.roomCode = match.roomCode || null
  updated.playerPresence = match.playerPresence
  updated.recentCommands = match.recentCommands
  updated.turnDeadlineAt = type === 'end-turn' && updated.status === 'active' ? Date.now() + TURN_TIME_LIMIT_MS : updated.status === 'active' ? match.turnDeadlineAt : null
  const response = { match: battleSnapshot(updated, userId), attack: result.attack }
  updated.recentCommands.push({ userId, actionId, signature, response })
  sessions.set(matchId, updated)
  persistOnlineState()
  return response
}

export function createPrivateRoom(user, faction) {
  if (!validFaction(faction)) return { error: 'Выбери одну из четырёх фракций.', statusCode: 400 }
  const currentId = userMatches.get(user.id)
  if (currentId && sessions.get(currentId)?.status === 'active') return { error: 'Заверши текущий матч перед созданием комнаты.', statusCode: 409 }
  if (roomForUser(user.id)) return { error: 'Ты уже находишься в частной комнате.', statusCode: 409 }
  cancelQueue(user.id)
  let code
  do { code = randomBytes(4).toString('hex').toUpperCase() } while (rooms.has(code))
  const room = {
    code, ownerId: user.id, status: 'waiting', matchId: null, createdAt: Date.now(),
    players: [{ userId: user.id, username: user.username, faction, ready: false, lastSeenAt: Date.now() }],
    rematchReady: {},
  }
  rooms.set(code, room); userRooms.set(user.id, code); persistOnlineState()
  return { room: roomSnapshot(room, user.id) }
}

export function joinPrivateRoom(code, user, faction) {
  if (!validFaction(faction)) return { error: 'Выбери одну из четырёх фракций.', statusCode: 400 }
  const room = rooms.get(String(code || '').trim().toUpperCase())
  if (!room) return { error: 'Комната не найдена.', statusCode: 404 }
  if (playerInRoom(room, user.id)) { touchRoom(room, user.id); return { room: roomSnapshot(room, user.id) } }
  if (room.players.length >= 2) return { error: 'В комнате уже два игрока.', statusCode: 409 }
  if (room.status !== 'waiting') return { error: 'К этой комнате уже нельзя присоединиться.', statusCode: 409 }
  const currentId = userMatches.get(user.id)
  if (currentId && sessions.get(currentId)?.status === 'active') return { error: 'Заверши текущий матч перед входом в комнату.', statusCode: 409 }
  if (roomForUser(user.id)) return { error: 'Ты уже находишься в частной комнате.', statusCode: 409 }
  cancelQueue(user.id)
  room.players.push({ userId: user.id, username: user.username, faction, ready: false, lastSeenAt: Date.now() })
  userRooms.set(user.id, room.code); room.status = 'waiting'; persistOnlineState()
  return { room: roomSnapshot(room, user.id) }
}

export function getPrivateRoom(code, userId) {
  const room = accessibleRoom(code, userId)
  if (!room) return null
  touchRoom(room, userId)
  const previousStatus = room.status
  const snapshot = roomSnapshot(room, userId)
  if (previousStatus !== room.status) persistOnlineState()
  return snapshot
}

export function setRoomReady(code, userId, ready) {
  const room = accessibleRoom(code, userId)
  if (!room) return { error: 'Комната не найдена или доступ закрыт.', statusCode: 404 }
  if (typeof ready !== 'boolean') return { error: 'Укажи готовность игрока.', statusCode: 400 }
  if (room.status !== 'waiting') return { error: 'Комната больше не ожидает готовности.', statusCode: 409 }
  const player = playerInRoom(room, userId)
  player.ready = ready
  player.lastSeenAt = Date.now()
  if (room.players.length === 2 && room.players.every((member) => member.ready)) {
    room.status = 'active'
    const [first, second] = room.players.map(({ userId: id, username, faction }) => ({ userId: id, username, faction }))
    const match = createMatch(first, second, room.code)
    room.matchId = match.id
  }
  persistOnlineState()
  return { room: roomSnapshot(room, userId), matchId: room.matchId }
}

export function leavePrivateRoom(code, userId) {
  const room = accessibleRoom(code, userId)
  if (!room) return { error: 'Комната не найдена или доступ закрыт.', statusCode: 404 }
  roomSnapshot(room, userId)
  if (room.status === 'active') return { error: 'Во время боя используй сдачу, чтобы завершить матч.', statusCode: 409 }
  if (room.ownerId === userId) {
    rooms.delete(room.code)
    for (const player of room.players) userRooms.delete(player.userId)
    persistOnlineState()
    return { status: 'deleted' }
  }
  room.players = room.players.filter((player) => player.userId !== userId)
  userRooms.delete(userId); room.status = 'waiting'; room.rematchReady = {}
  room.players.forEach((player) => { player.ready = false })
  persistOnlineState()
  return { status: 'left', room: roomSnapshot(room, room.ownerId) }
}

export function readyForRematch(code, userId) {
  const room = accessibleRoom(code, userId)
  if (!room) return { error: 'Комната не найдена или доступ закрыт.', statusCode: 404 }
  roomSnapshot(room, userId)
  if (room.status !== 'finished' || room.players.length !== 2) return { error: 'Повторный бой пока недоступен.', statusCode: 409 }
  room.rematchReady ||= {}
  room.rematchReady[userId] = true
  if (room.players.every((player) => room.rematchReady[player.userId])) {
    room.players.forEach((player) => { player.ready = true })
    const [first, second] = room.players.map(({ userId: id, username, faction }) => ({ userId: id, username, faction }))
    const match = createMatch(first, second, room.code)
    room.matchId = match.id; room.status = 'active'; room.rematchReady = {}
  }
  persistOnlineState()
  return { room: roomSnapshot(room, userId), matchId: room.matchId }
}

export function sweepOnlineMatches(at = Date.now()) { sweepExpiredMatches(at) }

const maintenanceTimer = setInterval(() => sweepExpiredMatches(), 1000)
maintenanceTimer.unref?.()
