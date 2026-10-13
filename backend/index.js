import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto'
import { promisify } from 'node:util'

const app = express()
const port = Number(process.env.PORT || 4000)
const here = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(here, 'data', 'progress.json')
const usersPath = path.join(here, 'data', 'users.json')
const secretPath = path.join(here, 'data', 'auth-secret')
const scrypt = promisify(scryptCallback)
fs.mkdirSync(path.dirname(secretPath), { recursive: true })
if (!fs.existsSync(secretPath)) fs.writeFileSync(secretPath, randomBytes(48).toString('hex'), { flag: 'wx' })
const authSecret = fs.readFileSync(secretPath, 'utf8').trim()
const factionIds = ['imperium', 'orks', 'chaos', 'tau']
const quizAnswers = { 'sector-1': 0, 'sector-2': 0, 'sector-3': 1, 'sector-4': 2 }
const clueNotes = [
  { id: 'log-01', factionId: 'imperium', title: 'Запись дозорного', text: 'В полевом конспекте Империума отмечено: сигнал из зоны 07 повторяет один знак — V.', clue: 'V' },
  { id: 'log-02', factionId: 'orks', title: 'Обрывок астропатического сообщения', text: 'В заметках об орочьем набеге сохранилось: ...ERMILLION... Помехи скрыли первые символы.', clue: 'ERMILLION' },
  { id: 'log-03', factionId: 'chaos', title: 'Пометка хранителя', text: 'На полях досье о Варпе записано: координаты VER-IX. Римская девятка указывает номер сектора.', clue: 'IX' },
]
const chapter = { id: 'chapter-02', title: 'Глава II · Сигнал из глубины', teaser: 'В зоне VER-IX обнаружен источник повторяющегося сигнала. Кто его отправил — неизвестно.' }

function freshState() {
  return { xp: 0, studiedFactions: [], dailyMission: null, achievements: [], answeredQuestions: [], decodedChapters: [], updatedAt: new Date().toISOString() }
}
function readData() {
  try { return JSON.parse(fs.readFileSync(dataPath, 'utf8')) } catch { return {} }
}
function writeData(data) {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true })
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
}
function getState(profileId = 'acolyte') {
  const data = readData()
  return data[profileId] || freshState()
}
function saveState(profileId, state) {
  const data = readData()
  state.updatedAt = new Date().toISOString()
  data[profileId] = state
  writeData(data)
  return state
}
function today() { return new Date().toISOString().slice(0, 10) }
function readUsers() {
  try { return JSON.parse(fs.readFileSync(usersPath, 'utf8')) } catch { return [] }
}
function writeUsers(users) {
  fs.mkdirSync(path.dirname(usersPath), { recursive: true })
  const temporary = `${usersPath}.tmp`
  fs.writeFileSync(temporary, JSON.stringify(users, null, 2))
  fs.renameSync(temporary, usersPath)
}
function makeToken(user) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({ sub: user.id, username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })
  const unsigned = `${header}.${payload}`
  const signature = createHmac('sha256', authSecret).update(unsigned).digest('base64url')
  return `${unsigned}.${signature}`
}
function verifyToken(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const unsigned = `${parts[0]}.${parts[1]}`
  const expected = createHmac('sha256', authSecret).update(unsigned).digest()
  let provided
  try { provided = Buffer.from(parts[2], 'base64url') } catch { return null }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null
  } catch { return null }
}
function requireAuth(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const user = token && verifyToken(token)
  if (!user) return res.status(401).json({ error: 'Войди в архив, чтобы продолжить.' })
  req.user = user
  next()
}
function awardStudy(state, factionId) {
  if (!factionIds.includes(factionId)) return null
  if (state.studiedFactions.includes(factionId)) return state
  state.studiedFactions.push(factionId)
  state.xp += 25
  if (state.dailyMission !== today()) {
    state.dailyMission = today()
    state.xp += 50
    if (!state.achievements.includes('first-daily')) state.achievements.push('first-daily')
  }
  if (!state.achievements.includes('first-dossier')) state.achievements.push('first-dossier')
  if (state.studiedFactions.length === factionIds.length && !state.achievements.includes('all-factions')) {
    state.achievements.push('all-factions')
    state.xp += 100
  }
  return state
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }))
app.use(express.json({ limit: '16kb' }))
app.get('/api/health', (_req, res) => res.json({ status: 'online', service: 'Sector: Vermillion API' }))
app.post('/api/auth/register', async (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!/^[a-z0-9_]{3,24}$/.test(username)) return res.status(400).json({ error: 'Имя: 3–24 символа, только латиница, цифры и _.' })
  if (password.length < 8 || password.length > 128) return res.status(400).json({ error: 'Пароль должен содержать от 8 до 128 символов.' })
  const users = readUsers()
  if (users.some((user) => user.username === username)) return res.status(409).json({ error: 'Это имя уже занято. Выбери другое или войди.' })
  const id = randomBytes(16).toString('hex')
  const salt = randomBytes(16).toString('hex')
  const passwordHash = (await scrypt(password, salt, 64)).toString('hex')
  const user = { id, username, salt, passwordHash, createdAt: new Date().toISOString() }
  users.push(user)
  writeUsers(users)
  res.status(201).json({ token: makeToken(user), user: { id, username } })
})
app.post('/api/auth/login', async (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const user = readUsers().find((candidate) => candidate.username === username)
  if (!user || password.length > 128) return res.status(401).json({ error: 'Неверное имя или пароль.' })
  const passwordHash = (await scrypt(password, user.salt, 64)).toString('hex')
  const expected = Buffer.from(user.passwordHash, 'hex')
  const provided = Buffer.from(passwordHash, 'hex')
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return res.status(401).json({ error: 'Неверное имя или пароль.' })
  res.json({ token: makeToken(user), user: { id: user.id, username: user.username } })
})
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: { id: req.user.sub, username: req.user.username } }))
app.get('/api/progress', requireAuth, (req, res) => res.json(getState(req.user.sub)))
app.post('/api/study/:factionId', requireAuth, (req, res) => {
  const state = getState(req.user.sub)
  if (!awardStudy(state, req.params.factionId)) return res.status(404).json({ error: 'Досье не найдено.' })
  res.json(saveState(req.user.sub, state))
})
app.post('/api/quiz', requireAuth, (req, res) => {
  const { questionId, answerIndex } = req.body || {}
  if (!(questionId in quizAnswers)) return res.status(404).json({ error: 'Вопрос не найден.' })
  const state = getState(req.user.sub)
  if (state.answeredQuestions.includes(questionId)) return res.json({ correct: true, alreadyAnswered: true, progress: state })
  if (Number(answerIndex) !== quizAnswers[questionId]) return res.status(400).json({ correct: false, error: 'Ответ неверный. Перечитай досье и попробуй ещё раз.' })
  state.answeredQuestions.push(questionId)
  state.xp += 15
  if (state.answeredQuestions.length === Object.keys(quizAnswers).length && !state.achievements.includes('quiz-complete')) {
    state.achievements.push('quiz-complete')
    state.xp += 50
  }
  res.json({ correct: true, progress: saveState(req.user.sub, state) })
})
app.get('/api/notes', requireAuth, (req, res) => {
  const progress = getState(req.user.sub)
  res.json(clueNotes.filter((note) => progress.studiedFactions.includes(note.factionId)).map(({ id, title, text }) => ({ id, title, text })))
})
app.get('/api/chapters/locked', requireAuth, (req, res) => res.json({ chapter, unlocked: getState(req.user.sub).decodedChapters.includes(chapter.id) }))
app.post('/api/chapters/locked/decode', requireAuth, (req, res) => {
  const answer = String(req.body?.answer || '').trim().toUpperCase().replace(/\s+/g, '')
  const state = getState(req.user.sub)
  const requiredNotes = clueNotes.map((note) => note.factionId)
  if (!requiredNotes.every((factionId) => state.studiedFactions.includes(factionId))) return res.status(403).json({ error: 'Доступ закрыт. Изучи досье, связанные с тремя фрагментами сигнала.' })
  if (answer !== 'VERMILLIONIX') return res.status(400).json({ error: 'Код не принят. Сверь фрагменты в архивных записях.' })
  if (!state.decodedChapters.includes(chapter.id)) {
    state.decodedChapters.push(chapter.id)
    state.xp += 75
    if (!state.achievements.includes('signal-decoder')) state.achievements.push('signal-decoder')
  }
  res.json({ unlocked: true, chapter: { ...chapter, body: 'Сигнал пришёл не из глубин космоса. Он исходил из заброшенной ретрансляционной станции в самой зоне VER-IX. Последняя запись станции содержит координаты следующего узла, но файл повреждён. Архивариусу предстоит восстановить цепочку маяков, изучая новые досье и собирая фрагменты из полевых заметок.' }, progress: saveState(req.user.sub, state) })
})
app.listen(port, () => console.log(`Sector: Vermillion API listening on http://localhost:${port}`))
