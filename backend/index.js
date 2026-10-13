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
const loreEntries = [
  { id: 'neophyte-record', factionId: 'imperium', keyword: 'НЕОФИТ', category: 'ДОСЬЕ', title: 'Рекрут из пепельных доков', body: 'В отчёте гарнизона слово «неофит» стоит рядом с именем безымянного рекрута, спасённого после боя у пепельных доков. На его броне нашли знак сломанного маяка. Он утверждает, что слышал сигнал из-под поверхности планеты.' },
  { id: 'waaagh-report', factionId: 'orks', keyword: 'ВААГХ!', category: 'ПОЛЕВОЙ ЖУРНАЛ', title: 'Битва у Красного маяка', body: 'Орочий налёт сорвал эвакуацию с доков. В перехваченном крике повторяется «Ваагх!», а карта боя указывает на Красный маяк — тот же знак, что был на броне неофита. После боя маяк продолжил передавать сигнал.' },
  { id: 'warp-echo', factionId: 'chaos', keyword: 'ВАРП', category: 'ПОВРЕЖДЁННАЯ ЗАПИСЬ', title: 'Шёпот под руинами', body: 'В подземном храме нашли запись культистов о разломе в Варпе. Они пришли к маяку не за артефактом, а чтобы не дать кому-то выйти из стазисной камеры. Последняя строка содержит координату VER-IX.' },
  { id: 'zone-ver-ix', requiredEntries: ['neophyte-record', 'waaagh-report', 'warp-echo'], keyword: 'VER-IX', category: 'НОВАЯ ЗОНА', title: 'VER-IX · Пепельный маяк', body: 'Архив свёл три свидетельства в одну точку: заброшенный маяк на планете Кайрос-9. Здесь столкнулись гарнизон, орочий налёт и силы Хаоса. Под руинами обнаружена стазисная камера с генетическими маркерами, похожими на маркеры примарха. Имя стёрто из записи.' },
]

function freshState() {
  return { xp: 0, studiedFactions: [], dailyMission: null, achievements: [], answeredQuestions: [], readEntries: [], updatedAt: new Date().toISOString() }
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
  const saved = data[profileId]
  if (!saved) return freshState()
  return { ...freshState(), ...saved, readEntries: Array.isArray(saved.readEntries) ? saved.readEntries : [] }
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
app.get('/api/knowledge', requireAuth, (req, res) => {
  const progress = getState(req.user.sub)
  const entries = loreEntries.map((entry) => {
    const unlocked = entry.factionId ? progress.studiedFactions.includes(entry.factionId) : entry.requiredEntries.every((id) => progress.readEntries.includes(id))
    return { ...entry, unlocked, read: progress.readEntries.includes(entry.id), body: unlocked ? entry.body : null }
  })
  res.json({ terms: entries.filter((entry) => entry.unlocked).map(({ keyword, category, title, id }) => ({ keyword, category, title, entryId: id })), entries })
})
app.post('/api/knowledge/:entryId/read', requireAuth, (req, res) => {
  const entry = loreEntries.find((candidate) => candidate.id === req.params.entryId)
  if (!entry) return res.status(404).json({ error: 'Запись не найдена.' })
  const state = getState(req.user.sub)
  const unlocked = entry.factionId ? state.studiedFactions.includes(entry.factionId) : entry.requiredEntries.every((id) => state.readEntries.includes(id))
  if (!unlocked) return res.status(403).json({ error: 'Эта запись пока закрыта. Изучи нужные досье и прочитай связанные материалы.' })
  if (!state.readEntries.includes(entry.id)) {
    state.readEntries.push(entry.id)
    state.xp += entry.category === 'НОВАЯ ЗОНА' ? 50 : 20
    if (entry.id === 'zone-ver-ix' && !state.achievements.includes('signal-decoder')) state.achievements.push('signal-decoder')
  }
  res.json({ entry, progress: saveState(req.user.sub, state) })
})
app.listen(port, () => console.log(`Sector: Vermillion API listening on http://localhost:${port}`))
