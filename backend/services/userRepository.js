import { MongoClient } from 'mongodb'
import {
  createUser as createJsonUser,
  findUser as findJsonUser,
  findUserById as findJsonUserById,
  readUsers,
  readMatchHistoryRecords,
  updateUserOnlineIdentity as updateJsonUserOnlineIdentity,
  usernameExists as jsonUsernameExists,
  writeUsers,
  writeMatchHistoryRecords,
} from '../storage.js'

let clientPromise
let indexPromise

async function collections() {
  const uri = process.env.MONGODB_URI
  if (!uri) return null
  if (!clientPromise) {
    const client = new MongoClient(uri, { appName: 'SectorVermillion', serverSelectionTimeoutMS: 5000 })
    clientPromise = client.connect().catch((error) => { clientPromise = null; indexPromise = null; throw error })
  }
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB || undefined)
  if (!indexPromise) {
    indexPromise = Promise.all([
      db.collection('users').createIndex({ username: 1 }, { unique: true }),
      db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true }),
      db.collection('users').createIndex({ refreshTokenHash: 1 }, { sparse: true }),
      db.collection('matchHistory').createIndex({ matchId: 1 }, { unique: true }),
      db.collection('matchHistory').createIndex({ 'participants.userId': 1, playedAt: -1 }),
    ]).then(async () => {
      if (await db.collection('users').estimatedDocumentCount() !== 0) return
      const legacyUsers = readUsers()
      if (!legacyUsers.length) return
      await db.collection('users').insertMany(legacyUsers.map((user) => ({
        ...user, favoriteFaction: user.favoriteFaction || user.faction || 'imperium', avatarId: user.avatarId || 'default',
      })), { ordered: false })
      const legacyHistory = [...readMatchHistoryRecords(), ...legacyUsers.flatMap((user) => user.matchHistory || [])]
      if (legacyHistory.length) await db.collection('matchHistory').bulkWrite(legacyHistory.map((entry) => ({
        updateOne: { filter: { matchId: entry.matchId }, update: { $setOnInsert: entry }, upsert: true },
      })), { ordered: false })
    }).catch((error) => { indexPromise = null; throw error })
  }
  await indexPromise
  return { users: db.collection('users'), matchHistory: db.collection('matchHistory') }
}

function normalizedUser(user) {
  if (!user) return null
  return { ...user, id: user.id || String(user._id), favoriteFaction: user.favoriteFaction || user.faction || 'imperium', avatarId: user.avatarId || 'default' }
}

export async function findUser(usernameOrEmail) {
  const identifier = String(usernameOrEmail || '').trim().toLowerCase()
  const db = await collections()
  if (!db) return findJsonUser(identifier) || readUsers().find((user) => user.email === identifier) || null
  return normalizedUser(await db.users.findOne({ $or: [{ username: identifier }, { email: identifier }] }))
}

export async function findUserById(id) {
  const db = await collections()
  if (!db) return findJsonUserById(id)
  return normalizedUser(await db.users.findOne({ id: String(id) }))
}

export async function findUserByRefreshHash(hash) {
  const db = await collections()
  if (!db) return readUsers().find((user) => user.refreshTokenHash === hash) || null
  return normalizedUser(await db.users.findOne({ refreshTokenHash: hash }))
}

export async function createUser(user) {
  const value = { favoriteFaction: user.faction || 'imperium', avatarId: 'default', ...user }
  const db = await collections()
  if (!db) {
    if (jsonUsernameExists(value.username) || readUsers().some((candidate) => candidate.email === value.email)) return null
    createJsonUser(value)
    return value
  }
  try { await db.users.insertOne(value); return value }
  catch (error) { if (error?.code === 11000) return null; throw error }
}

export async function updateUser(id, changes) {
  const db = await collections()
  if (!db) {
    const users = readUsers()
    const user = users.find((candidate) => candidate.id === id)
    if (!user) return null
    if (changes.username && users.some((candidate) => candidate.id !== id && candidate.username === changes.username)) return { duplicate: true }
    if (changes.email && users.some((candidate) => candidate.id !== id && candidate.email === changes.email)) return { duplicate: true }
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) delete user[key]
      else user[key] = value
    }
    user.updatedAt = new Date().toISOString()
    writeUsers(users)
    return user
  }
  try {
    const set = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined))
    const unset = Object.fromEntries(Object.entries(changes).filter(([, value]) => value === undefined).map(([key]) => [key, '']))
    const update = { $set: { ...set, updatedAt: new Date() } }
    if (Object.keys(unset).length) update.$unset = unset
    const result = await db.users.findOneAndUpdate({ id: String(id) }, update, { returnDocument: 'after' })
    return normalizedUser(result)
  } catch (error) { if (error?.code === 11000) return { duplicate: true }; throw error }
}

export async function setRefreshToken(id, hash, expiresAt) {
  return updateUser(id, { refreshTokenHash: hash || undefined, refreshExpiresAt: expiresAt || undefined })
}

export async function rotateRefreshToken(previousHash, nextHash, expiresAt) {
  const db = await collections()
  if (!db) {
    const users = readUsers()
    const user = users.find((candidate) => candidate.refreshTokenHash === previousHash)
    if (!user || !user.refreshExpiresAt || new Date(user.refreshExpiresAt).getTime() <= Date.now()) return null
    user.refreshTokenHash = nextHash; user.refreshExpiresAt = expiresAt; user.updatedAt = new Date().toISOString()
    writeUsers(users)
    return user
  }
  const result = await db.users.findOneAndUpdate(
    { refreshTokenHash: previousHash, refreshExpiresAt: { $gt: new Date() } },
    { $set: { refreshTokenHash: nextHash, refreshExpiresAt: expiresAt, updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
  return normalizedUser(result)
}

export async function revokeRefreshToken(hash) {
  if (!hash) return false
  const db = await collections()
  if (!db) {
    const users = readUsers()
    const user = users.find((candidate) => candidate.refreshTokenHash === hash)
    if (!user) return false
    delete user.refreshTokenHash; delete user.refreshExpiresAt
    writeUsers(users)
    return true
  }
  const result = await db.users.updateOne({ refreshTokenHash: hash }, { $unset: { refreshTokenHash: '', refreshExpiresAt: '' } })
  return result.modifiedCount > 0
}

export async function updateUserFaction(id, faction) {
  return updateUser(id, { faction, favoriteFaction: faction })
}

export async function updateUserOnlineIdentity(id, identity) {
  const user = await findUserById(id)
  if (!user) return null
  const onlineIdentity = { ...(user.onlineIdentity || {}), ...identity }
  if (!process.env.MONGODB_URI) return updateJsonUserOnlineIdentity(id, identity)
  return updateUser(id, { onlineIdentity })
}

export async function savePasswordHash(id, passwordHash) { return updateUser(id, { passwordHash, passwordScheme: 'bcrypt', salt: undefined }) }

export async function recordMatchHistory(match) {
  const db = await collections()
  const playedAt = new Date(match.finishedAt || match.updatedAt || Date.now())
  const winner = match.players?.[match.winnerIndex]
  const entry = {
    matchId: match.id,
    participants: (match.players || []).map((player) => ({ userId: player.userId, username: player.username, faction: player.faction })),
    winnerUserId: winner?.userId || null,
    winMethod: match.winMethod || match.winReason || 'unknown',
    durationSeconds: Math.max(0, Math.floor(((match.finishedAt || match.updatedAt || Date.now()) - (match.startedAt || match.createdAt || Date.now())) / 1000)),
    turns: match.turn || 0,
    mapId: match.mapId || 'sector-crossing',
    mapName: match.mapName || match.mapId || 'Перекрёсток Сектора',
    playedAt,
  }
  if (!db) {
    const entries = readMatchHistoryRecords()
    if (!entries.some((item) => item.matchId === entry.matchId)) {
      entries.push(entry)
      writeMatchHistoryRecords(entries)
    }
    return entry
  }
  try { await db.matchHistory.updateOne({ matchId: entry.matchId }, { $setOnInsert: entry }, { upsert: true }) }
  catch (error) { if (error?.code !== 11000) throw error }
  return entry
}

export async function getMatchHistory(userId, { limit = 50 } = {}) {
  const db = await collections()
  const cappedLimit = Math.min(100, Math.max(1, Number(limit) || 50))
  let entries
  if (!db) entries = readMatchHistoryRecords().filter((item) => item.participants.some((participant) => participant.userId === userId))
  else entries = await db.matchHistory.find({ 'participants.userId': userId }).sort({ playedAt: -1 }).limit(cappedLimit).toArray()
  entries = entries.sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt)).slice(0, cappedLimit)
  return entries.map((item) => ({ ...item, id: item.matchId, playedAt: new Date(item.playedAt).toISOString() }))
}

export async function getMatchStats(userId) {
  const db = await collections()
  if (db) {
    const [summaryRows, factionRows] = await Promise.all([
      db.matchHistory.aggregate([
        { $match: { 'participants.userId': userId } },
        { $group: { _id: null, matches: { $sum: 1 }, wins: { $sum: { $cond: [{ $eq: ['$winnerUserId', userId] }, 1, 0] } } } },
      ]).toArray(),
      db.matchHistory.aggregate([
        { $unwind: '$participants' }, { $match: { 'participants.userId': userId } },
        { $group: { _id: '$participants.faction', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 1 },
      ]).toArray(),
    ])
    const matches = summaryRows[0]?.matches || 0, wins = summaryRows[0]?.wins || 0
    return { matches, wins, losses: matches - wins, winRate: matches ? Math.round((wins / matches) * 100) : 0, favoriteFaction: factionRows[0]?._id || null }
  }
  const history = readMatchHistoryRecords().filter((match) => match.participants.some((participant) => participant.userId === userId))
  const wins = history.filter((match) => match.winnerUserId === userId).length
  const losses = history.length - wins
  const factionCounts = new Map()
  for (const match of history) {
    const faction = match.participants.find((participant) => participant.userId === userId)?.faction
    if (faction) factionCounts.set(faction, (factionCounts.get(faction) || 0) + 1)
  }
  const favoriteFaction = [...factionCounts].sort((a, b) => b[1] - a[1])[0]?.[0] || null
  return { matches: history.length, wins, losses, winRate: history.length ? Math.round((wins / history.length) * 100) : 0, favoriteFaction }
}
