import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = Number(process.env.PORT || 4000)
const here = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(here, 'data', 'progress.json')
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
app.get('/api/progress', (req, res) => res.json(getState(String(req.query.profile || 'acolyte'))))
app.post('/api/progress/sync', (req, res) => {
  const incoming = req.body || {}
  const state = getState()
  state.xp = Math.max(state.xp, Math.min(100000, Number(incoming.xp) || 0))
  for (const key of ['studiedFactions', 'achievements', 'answeredQuestions']) {
    if (Array.isArray(incoming[key])) state[key] = [...new Set([...state[key], ...incoming[key].filter((id) => typeof id === 'string')])]
  }
  if (typeof incoming.dailyMission === 'string') state.dailyMission = incoming.dailyMission
  res.json(saveState(String(incoming.profile || 'acolyte'), state))
})
app.post('/api/study/:factionId', (req, res) => {
  const profileId = String(req.body?.profile || 'acolyte')
  const state = getState(profileId)
  if (!awardStudy(state, req.params.factionId)) return res.status(404).json({ error: 'Досье не найдено.' })
  res.json(saveState(profileId, state))
})
app.post('/api/quiz', (req, res) => {
  const { questionId, answerIndex } = req.body || {}
  const profileId = String(req.body?.profile || 'acolyte')
  if (!(questionId in quizAnswers)) return res.status(404).json({ error: 'Вопрос не найден.' })
  const state = getState(profileId)
  if (state.answeredQuestions.includes(questionId)) return res.json({ correct: true, alreadyAnswered: true, progress: state })
  if (Number(answerIndex) !== quizAnswers[questionId]) return res.status(400).json({ correct: false, error: 'Ответ неверный. Перечитай досье и попробуй ещё раз.' })
  state.answeredQuestions.push(questionId)
  state.xp += 15
  if (state.answeredQuestions.length === Object.keys(quizAnswers).length && !state.achievements.includes('quiz-complete')) {
    state.achievements.push('quiz-complete')
    state.xp += 50
  }
  res.json({ correct: true, progress: saveState(profileId, state) })
})
app.get('/api/notes', (req, res) => {
  const progress = getState(String(req.query.profile || 'acolyte'))
  res.json(clueNotes.filter((note) => progress.studiedFactions.includes(note.factionId)).map(({ id, title, text }) => ({ id, title, text })))
})
app.get('/api/chapters/locked', (req, res) => res.json({ chapter, unlocked: getState(String(req.query.profile || 'acolyte')).decodedChapters.includes(chapter.id) }))
app.post('/api/chapters/locked/decode', (req, res) => {
  const answer = String(req.body?.answer || '').trim().toUpperCase().replace(/\s+/g, '')
  const profileId = String(req.body?.profile || 'acolyte')
  const state = getState(profileId)
  const requiredNotes = clueNotes.map((note) => note.factionId)
  if (!requiredNotes.every((factionId) => state.studiedFactions.includes(factionId))) return res.status(403).json({ error: 'Доступ закрыт. Изучи досье, связанные с тремя фрагментами сигнала.' })
  if (answer !== 'VERMILLIONIX') return res.status(400).json({ error: 'Код не принят. Сверь фрагменты в архивных записях.' })
  if (!state.decodedChapters.includes(chapter.id)) {
    state.decodedChapters.push(chapter.id)
    state.xp += 75
    if (!state.achievements.includes('signal-decoder')) state.achievements.push('signal-decoder')
  }
  res.json({ unlocked: true, chapter: { ...chapter, body: 'Сигнал пришёл не из глубин космоса. Он исходил из заброшенной ретрансляционной станции в самой зоне VER-IX. Последняя запись станции содержит координаты следующего узла, но файл повреждён. Архивариусу предстоит восстановить цепочку маяков, изучая новые досье и собирая фрагменты из полевых заметок.' }, progress: saveState(profileId, state) })
})
app.listen(port, () => console.log(`Sector: Vermillion API listening on http://localhost:${port}`))
