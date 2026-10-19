import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const dataDirectory = process.env.SECTOR_DATA_DIRECTORY || path.join(path.dirname(fileURLToPath(import.meta.url)), 'data')
const progressPath = path.join(dataDirectory, 'progress.json')
const usersPath = path.join(dataDirectory, 'users.json')
const onlineStatePath = path.join(dataDirectory, 'online-state.json')
function readJson(filePath, fallback) { try { return JSON.parse(fs.readFileSync(filePath, 'utf8')) } catch { return fallback } }
function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.tmp`
  fs.writeFileSync(temporaryPath, JSON.stringify(value, null, 2))
  fs.renameSync(temporaryPath, filePath)
}
export function readProgress() { return readJson(progressPath, {}) }
export function getProgress(profileId) { return readProgress()[profileId] ?? null }
export function saveProgress(profileId, state) {
  const progress = readProgress()
  state.updatedAt = new Date().toISOString()
  progress[profileId] = state
  writeJson(progressPath, progress)
  return state
}
export function readOnlineState() { return readJson(onlineStatePath, { sessions: [], waitingPlayers: [], rooms: [] }) }
export function saveOnlineState(state) { writeJson(onlineStatePath, state); return state }
export function readUsers() { return readJson(usersPath, []) }
export function findUser(username) { return readUsers().find((user) => user.username === username) ?? null }
export function findUserById(id) { return readUsers().find((user) => user.id === id) ?? null }
export function createUser(user) { const users = readUsers(); users.push(user); writeJson(usersPath, users) }
export function updateUserFaction(id, faction) {
  const users = readUsers()
  const user = users.find((candidate) => candidate.id === id)
  if (!user) return null
  user.faction = faction
  writeJson(usersPath, users)
  return user
}
export function updateUserOnlineIdentity(id, identity) {
  const users = readUsers()
  const user = users.find((candidate) => candidate.id === id)
  if (!user) return null
  user.onlineIdentity = { ...(user.onlineIdentity || {}), ...identity }
  writeJson(usersPath, users)
  return user
}
export function usernameExists(username) { return readUsers().some((user) => user.username === username) }
export function createAuthSecret() {
  fs.mkdirSync(dataDirectory, { recursive: true })
  const secretPath = path.join(dataDirectory, 'auth-secret')
  if (!fs.existsSync(secretPath)) {
    try { fs.writeFileSync(secretPath, randomBytes(48).toString('hex'), { flag: 'wx' }) } catch (error) { if (error.code !== 'EEXIST') throw error }
  }
  return fs.readFileSync(secretPath, 'utf8').trim()
}
