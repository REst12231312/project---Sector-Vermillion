import { postJson } from './api'
const STORAGE_KEY = 'sv-progress'
export const FACTION_IDS = ['imperium', 'orks', 'chaos', 'tau']
export const QUIZ_IDS = ['sector-1', 'sector-2', 'sector-3', 'sector-4']

export function getTodayKey() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      xp: Number(saved.xp ?? localStorage.getItem('sv-xp') ?? 0),
      studiedFactions: Array.isArray(saved.studiedFactions) ? saved.studiedFactions : [],
      dailyMission: saved.dailyMission || (localStorage.getItem('sv-daily-mission') === getTodayKey() ? getTodayKey() : null),
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
      answeredQuestions: Array.isArray(saved.answeredQuestions) ? saved.answeredQuestions : [],
      readEntries: Array.isArray(saved.readEntries) ? saved.readEntries : [],
    }
  } catch {
    return { xp: 0, studiedFactions: [], dailyMission: null, achievements: [], answeredQuestions: [], readEntries: [] }
  }
}

export function applyServerProgress(progress) {
  return saveProgress({
    xp: Number(progress.xp) || 0,
    studiedFactions: Array.isArray(progress.studiedFactions) ? progress.studiedFactions : [],
    dailyMission: progress.dailyMission || null,
    achievements: Array.isArray(progress.achievements) ? progress.achievements : [],
    answeredQuestions: Array.isArray(progress.answeredQuestions) ? progress.answeredQuestions : [],
    readEntries: Array.isArray(progress.readEntries) ? progress.readEntries : [],
  })
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  localStorage.setItem('sv-xp', String(progress.xp))
  window.dispatchEvent(new CustomEvent('sv-progress-updated', { detail: progress }))
  return progress
}

export function studyFaction(factionId) {
  const progress = getProgress()
  if (progress.studiedFactions.includes(factionId)) return progress

  const studiedFactions = [...progress.studiedFactions, factionId]
  const achievements = [...progress.achievements]
  let xp = progress.xp + 25
  let dailyMission = progress.dailyMission

  if (dailyMission !== getTodayKey()) {
    dailyMission = getTodayKey()
    xp += 50
    achievements.push('first-daily')
  }
  if (studiedFactions.length === FACTION_IDS.length && !achievements.includes('all-factions')) {
    achievements.push('all-factions')
    xp += 100
  }
  if (!achievements.includes('first-dossier')) achievements.push('first-dossier')

  const updated = saveProgress({ ...progress, xp, studiedFactions, dailyMission, achievements })
  postJson(`/study/${factionId}`, {}).then(applyServerProgress).catch(() => {})
  return updated
}

export async function submitQuizAnswer(questionId, answerIndex) {
  try {
    const result = await postJson('/quiz', { questionId, answerIndex })
    if (result.progress) return saveProgress(result.progress)
  } catch (error) {
    if (error.message.includes('Ответ неверный')) throw error
  }
  const progress = getProgress()
  if (progress.answeredQuestions.includes(questionId) || !QUIZ_IDS.includes(questionId)) return progress

  const answeredQuestions = [...progress.answeredQuestions, questionId]
  const achievements = [...progress.achievements]
  let xp = progress.xp + 15
  if (answeredQuestions.length === QUIZ_IDS.length && !achievements.includes('quiz-complete')) {
    achievements.push('quiz-complete')
    xp += 50
  }
  return saveProgress({ ...progress, xp, answeredQuestions, achievements })
}
