import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { createAuthSecret, createUser, findUser, findUserById, updateUserFaction, usernameExists } from '../storage.js'
import { factionIds } from '../data/gameData.js'
const scrypt = promisify(scryptCallback)
const authSecret = createAuthSecret()
const publicUser = ({ id, username, faction, onlineIdentity }) => ({ id, username, faction: faction || 'imperium', chapter: onlineIdentity?.chapter || '', legion: onlineIdentity?.legion || '' })
export function makeToken(user) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, username: user.username, faction: user.faction || 'imperium', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })}`
  return `${unsigned}.${createHmac('sha256', authSecret).update(unsigned).digest('base64url')}`
}
export function verifyToken(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const expected = createHmac('sha256', authSecret).update(`${parts[0]}.${parts[1]}`).digest()
  let provided
  try { provided = Buffer.from(parts[2], 'base64url') } catch { return null }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null
  try { const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); return payload.exp > Math.floor(Date.now() / 1000) ? payload : null } catch { return null }
}
export async function register({ username: rawUsername, password: rawPassword, faction: rawFaction }) {
  const username = String(rawUsername || '').trim().toLowerCase()
  const password = String(rawPassword || '')
  const faction = String(rawFaction || 'imperium')
  if (!/^[a-z0-9_]{3,24}$/.test(username)) return { status: 400, error: 'Имя: 3–24 символа, только латиница, цифры и _.' }
  if (password.length < 8 || password.length > 128) return { status: 400, error: 'Пароль должен содержать от 8 до 128 символов.' }
  if (!factionIds.includes(faction)) return { status: 400, error: 'Выбери доступную фракцию.' }
  if (usernameExists(username)) return { status: 409, error: 'Это имя уже занято. Выбери другое или войди.' }
  const id = randomBytes(16).toString('hex'), salt = randomBytes(16).toString('hex')
  const passwordHash = (await scrypt(password, salt, 64)).toString('hex')
  const user = { id, username, faction, salt, passwordHash, createdAt: new Date().toISOString() }
  createUser(user)
  return { status: 201, token: makeToken(user), user: publicUser(user) }
}
export async function login({ username: rawUsername, password: rawPassword }) {
  const username = String(rawUsername || '').trim().toLowerCase(), password = String(rawPassword || '')
  const user = findUser(username)
  if (!user || password.length > 128) return { status: 401, error: 'Неверное имя или пароль.' }
  const passwordHash = (await scrypt(password, user.salt, 64)).toString('hex')
  const expected = Buffer.from(user.passwordHash, 'hex'), provided = Buffer.from(passwordHash, 'hex')
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return { status: 401, error: 'Неверное имя или пароль.' }
  return { status: 200, token: makeToken(user), user: publicUser(user) }
}

const defectionChoices = {
  'imperium-origin': ['Захватить ближайший склад'],
  'great-crusade': ['Окружить столицу'],
  primarchs: ['Потребовать немедленной присяги'],
}

export function defectToChaos(userId, { levelId, choiceTitle } = {}) {
  const existingUser = findUserById(userId)
  if (!existingUser) return { status: 404, error: 'Профиль не найден.' }
  if (existingUser.faction !== 'imperium') return { status: 409, error: 'Этот переход доступен только из кампании Империума.' }
  if (!defectionChoices[levelId]?.includes(choiceTitle)) {
    return { status: 400, error: 'Этот приказ не ведёт к расколу. Выбери отмеченное решение в операции.' }
  }
  const currentUser = updateUserFaction(userId, 'chaos')
  return { status: 200, token: makeToken(currentUser), user: publicUser(currentUser) }
}
