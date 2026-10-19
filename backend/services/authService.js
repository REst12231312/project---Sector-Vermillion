import bcrypt from 'bcryptjs'
import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { createAuthSecret } from '../storage.js'
import { factionIds } from '../data/gameData.js'
import { createUser, findUser, findUserById, findUserByRefreshHash, revokeRefreshToken, rotateRefreshToken, savePasswordHash, setRefreshToken, updateUser, updateUserFaction } from './userRepository.js'

const scrypt = promisify(scryptCallback)
const authSecret = process.env.JWT_SECRET || createAuthSecret()
const ACCESS_TOKEN_LIFETIME_SECONDS = 15 * 60
const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000
const passwordHashRounds = Number(process.env.BCRYPT_ROUNDS || 12)

export const publicUser = ({ id, username, email, faction, favoriteFaction, avatarId, onlineIdentity, createdAt }) => ({
  id, username, email: email || '', faction: faction || 'imperium', favoriteFaction: favoriteFaction || faction || 'imperium',
  avatarId: avatarId || 'default', chapter: onlineIdentity?.chapter || '', legion: onlineIdentity?.legion || '', createdAt: createdAt || null,
})

export function makeToken(user) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_LIFETIME_SECONDS })}`
  return `${unsigned}.${createHmac('sha256', authSecret).update(unsigned).digest('base64url')}`
}

export function verifyToken(token) {
  if (typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const expected = createHmac('sha256', authSecret).update(`${parts[0]}.${parts[1]}`).digest()
  let provided
  try { provided = Buffer.from(parts[2], 'base64url') } catch { return null }
  if (provided.length !== expected.length || !timingSafeEqual(expected, provided)) return null
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return header.alg === 'HS256' && typeof payload.sub === 'string' && payload.exp > Math.floor(Date.now() / 1000) ? payload : null
  } catch { return null }
}

function refreshHash(token) { return createHash('sha256').update(token).digest('hex') }

async function createSession(user) {
  const refreshToken = randomBytes(48).toString('base64url')
  await setRefreshToken(user.id, refreshHash(refreshToken), new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS))
  return { token: makeToken(user), refreshToken, user: publicUser(user) }
}

export async function register({ username: rawUsername, email: rawEmail, password: rawPassword, faction: rawFaction }) {
  const username = String(rawUsername || '').trim().toLowerCase()
  const email = String(rawEmail || '').trim().toLowerCase()
  const password = String(rawPassword || '')
  const faction = String(rawFaction || 'imperium')
  if (!/^[a-z0-9_]{3,24}$/.test(username)) return { status: 400, error: 'Позывной: 3–24 символа, только латиница, цифры и _.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { status: 400, error: 'Укажи корректный адрес электронной почты.' }
  if (password.length < 8 || password.length > 128 || bcrypt.truncates(password)) return { status: 400, error: 'Пароль должен содержать 8–128 символов и не превышать 72 байта UTF-8.' }
  if (!factionIds.includes(faction)) return { status: 400, error: 'Выбери доступную фракцию.' }
  const id = randomBytes(16).toString('hex')
  const user = {
    id, username, email, faction, favoriteFaction: faction, avatarId: 'default',
    passwordHash: await bcrypt.hash(password, passwordHashRounds), passwordScheme: 'bcrypt',
    createdAt: new Date().toISOString(),
  }
  const inserted = await createUser(user)
  if (!inserted) return { status: 409, error: 'Это имя или адрес уже используется. Войди или выбери другие.' }
  return { status: 201, ...(await createSession(inserted)) }
}

export async function login({ username: rawUsername, email: rawEmail, identifier: rawIdentifier, password: rawPassword }) {
  const identifier = String(rawIdentifier || rawUsername || rawEmail || '').trim().toLowerCase()
  const password = String(rawPassword || '')
  const user = await findUser(identifier)
  if (!user || password.length > 128) return { status: 401, error: 'Неверный позывной, email или пароль.' }

  let valid = false
  if (user.passwordScheme === 'bcrypt' || String(user.passwordHash || '').startsWith('$2')) {
    valid = !bcrypt.truncates(password) && await bcrypt.compare(password, user.passwordHash)
  } else if (user.salt) {
    const passwordHash = (await scrypt(password, user.salt, 64)).toString('hex')
    const expected = Buffer.from(user.passwordHash || '', 'hex'), provided = Buffer.from(passwordHash, 'hex')
    valid = expected.length === provided.length && timingSafeEqual(expected, provided)
    if (valid) await savePasswordHash(user.id, await bcrypt.hash(password, passwordHashRounds))
  }
  if (!valid) return { status: 401, error: 'Неверный позывной, email или пароль.' }
  return { status: 200, ...(await createSession(user)) }
}

export async function refreshSession(refreshToken) {
  if (typeof refreshToken !== 'string' || refreshToken.length < 32) return { status: 401, error: 'Сеанс истёк. Войди повторно.' }
  const user = await findUserByRefreshHash(refreshHash(refreshToken))
  if (!user || !user.refreshExpiresAt || new Date(user.refreshExpiresAt).getTime() <= Date.now()) return { status: 401, error: 'Сеанс истёк. Войди повторно.' }
  const nextRefreshToken = randomBytes(48).toString('base64url')
  const updated = await rotateRefreshToken(refreshHash(refreshToken), refreshHash(nextRefreshToken), new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS))
  if (!updated) return { status: 401, error: 'Сеанс уже обновлён. Войди повторно.' }
  return { status: 200, token: makeToken(updated), refreshToken: nextRefreshToken, user: publicUser(updated) }
}

export async function logout(refreshToken) {
  if (typeof refreshToken !== 'string' || refreshToken.length < 32) return
  await revokeRefreshToken(refreshHash(refreshToken))
}

const defectionChoices = {
  'imperium-origin': ['Захватить ближайший склад'],
  'great-crusade': ['Окружить столицу'],
  primarchs: ['Потребовать немедленной присяги'],
}

export async function defectToChaos(userId, { levelId, choiceTitle } = {}) {
  const existingUser = await findUserById(userId)
  if (!existingUser) return { status: 404, error: 'Профиль не найден.' }
  if (existingUser.faction !== 'imperium') return { status: 409, error: 'Этот переход доступен только из кампании Империума.' }
  if (!defectionChoices[levelId]?.includes(choiceTitle)) return { status: 400, error: 'Этот приказ не ведёт к расколу. Выбери отмеченное решение в операции.' }
  const currentUser = await updateUserFaction(userId, 'chaos')
  return { status: 200, token: makeToken(currentUser), user: publicUser(currentUser) }
}

export async function updateProfile(userId, { username: rawUsername, avatarId, favoriteFaction } = {}) {
  const changes = {}
  if (rawUsername !== undefined) {
    const username = String(rawUsername || '').trim().toLowerCase()
    if (!/^[a-z0-9_]{3,24}$/.test(username)) return { status: 400, error: 'Позывной: 3–24 символа, только латиница, цифры и _.' }
    changes.username = username
  }
  if (avatarId !== undefined) {
    const allowedAvatars = ['default', 'imperium', 'chaos', 'orks', 'tau', 'skull', 'eagle', 'star']
    if (!allowedAvatars.includes(avatarId)) return { status: 400, error: 'Выбери доступный знак профиля.' }
    changes.avatarId = avatarId
  }
  if (favoriteFaction !== undefined) {
    if (!factionIds.includes(favoriteFaction)) return { status: 400, error: 'Выбери доступную фракцию.' }
    changes.favoriteFaction = favoriteFaction
  }
  if (!Object.keys(changes).length) return { status: 400, error: 'Нет изменений профиля.' }
  const user = await updateUser(userId, changes)
  if (user?.duplicate) return { status: 409, error: 'Такой позывной уже занят.' }
  if (!user) return { status: 404, error: 'Профиль не найден.' }
  return { status: 200, user: publicUser(user), token: makeToken(user) }
}

export async function changePassword(userId, { currentPassword, newPassword } = {}) {
  const user = await findUserById(userId)
  if (!user) return { status: 404, error: 'Профиль не найден.' }
  const current = String(currentPassword || ''), next = String(newPassword || '')
  if (next.length < 8 || next.length > 128 || bcrypt.truncates(next)) return { status: 400, error: 'Новый пароль должен содержать 8–128 символов и не превышать 72 байта UTF-8.' }
  let valid = false
  if (user.passwordScheme === 'bcrypt' || String(user.passwordHash || '').startsWith('$2')) valid = !bcrypt.truncates(current) && await bcrypt.compare(current, user.passwordHash)
  else if (user.salt) {
    const hash = (await scrypt(current, user.salt, 64)).toString('hex')
    const expected = Buffer.from(user.passwordHash || '', 'hex'), provided = Buffer.from(hash, 'hex')
    valid = expected.length === provided.length && timingSafeEqual(expected, provided)
  }
  if (!valid) return { status: 401, error: 'Текущий пароль неверен.' }
  const updated = await savePasswordHash(userId, await bcrypt.hash(next, passwordHashRounds))
  if (!updated) return { status: 404, error: 'Профиль не найден.' }
  const session = await createSession(updated)
  return { status: 200, ...session }
}
