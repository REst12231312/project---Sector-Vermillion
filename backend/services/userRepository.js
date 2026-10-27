import { MongoClient } from 'mongodb'
import {
  createUser as createJsonUser,
  findUser as findJsonUser,
  findUserById as findJsonUserById,
  readUsers,
  usernameExists as jsonUsernameExists,
  writeUsers,
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
    ]).then(async () => {
      if (await db.collection('users').estimatedDocumentCount() !== 0) return
      const legacyUsers = readUsers()
      if (!legacyUsers.length) return
      await db.collection('users').insertMany(legacyUsers.map((user) => ({
        ...user, favoriteFaction: user.favoriteFaction || user.faction || 'imperium', avatarId: user.avatarId || 'default',
      })), { ordered: false })
    }).catch((error) => { indexPromise = null; throw error })
  }
  await indexPromise
  return { users: db.collection('users') }
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

export async function savePasswordHash(id, passwordHash) { return updateUser(id, { passwordHash, passwordScheme: 'bcrypt', salt: undefined }) }
