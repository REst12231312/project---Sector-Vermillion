import { postJson } from './api'
const STORAGE_KEY = 'sv-progress'
export const FACTION_IDS = ['imperium', 'chaos', 'orks', 'tau']
export const IMPERIUM_LEVEL_IDS = ['imperium-origin', 'great-crusade', 'primarchs', 'istvaan-iii-warning', 'istvaan-v', 'imperium-calth', 'siege-terra-loyalist', 'scouring-aftermath']
export const CHAOS_LEVEL_IDS = ['chaos-whispers', 'davin-fall', 'istvaan-betrayal', 'chaos-calth', 'siege-terra', 'battle-luna', 'eye-retreat']
export const ORKS_LEVEL_IDS = ['orks-gathering', 'orks-ullanor-gates', 'orks-ullanor-battle', 'orks-scattered-warband', 'orks-armageddon']
export const TAU_LEVEL_IDS = ['tau-first-sphere', 'tau-damocles', 'tau-arkunasha', 'tau-farsight-enclaves', 'tau-fourth-sphere', 'tau-fifth-sphere']
export const FACTION_DETAILS = {
  imperium: { name: 'Империум человечества', shortName: 'Империум', mark: 'I', levelIds: IMPERIUM_LEVEL_IDS, archivePath: '/archive/imperium' },
  chaos: { name: 'Силы Хаоса', shortName: 'Хаос', mark: '⛧', levelIds: CHAOS_LEVEL_IDS, archivePath: '/archive/chaos' },
  orks: { name: 'Орки', shortName: 'Орки', mark: 'WAAAGH!', levelIds: ORKS_LEVEL_IDS, archivePath: '/archive/orks' },
  tau: { name: 'Империя Тау', shortName: 'Тау', mark: 'Т’АУ', levelIds: TAU_LEVEL_IDS, archivePath: '/archive/tau' },
}
export const QUIZ_IDS = ['sector-1', 'sector-2', 'sector-3', 'sector-4']
export const IMPERIUM_RANKS = [
  { id: 'neophyte', name: 'Неофит', minXP: 0 },
  { id: 'battle-brother', name: 'Боевой брат', minXP: 100 },
  { id: 'lieutenant', name: 'Лейтенант', minXP: 200 },
  { id: 'captain', name: 'Капитан', minXP: 300 },
  { id: 'magister', name: 'Магистр', minXP: 400 },
]
export const CHAOS_RANKS = [
  { id: 'cultist', name: 'Культист', minXP: 0 },
  { id: 'initiated', name: 'Посвящённый', minXP: 100 },
  { id: 'chosen', name: 'Избранный Хаоса', minXP: 200 },
  { id: 'champion', name: 'Чемпион Хаоса', minXP: 300 },
  { id: 'chaos-lord', name: 'Лорд Хаоса', minXP: 400 },
]
export const ORKS_RANKS = [
  { id: 'boy', name: 'Боец', minXP: 0 },
  { id: 'nob', name: 'Ноб', minXP: 100 },
  { id: 'boss', name: 'Босс', minXP: 200 },
  { id: 'big-boss', name: 'Большой босс', minXP: 300 },
  { id: 'warboss', name: 'Варбосс', minXP: 400 },
]
export const TAU_RANKS = [
  { id: 'shas-la', name: 'Шас’ла', minXP: 0 },
  { id: 'shas-ui', name: 'Шас’уи', minXP: 100 },
  { id: 'shas-vre', name: 'Шас’вре', minXP: 200 },
  { id: 'shas-el', name: 'Шас’эль', minXP: 300 },
  { id: 'shas-o', name: 'Шас’о', minXP: 400 },
]

export function getFactionRank(xp = 0, faction = 'imperium') {
  const ranks = faction === 'chaos' ? CHAOS_RANKS : faction === 'orks' ? ORKS_RANKS : faction === 'tau' ? TAU_RANKS : IMPERIUM_RANKS
  const currentXP = Math.max(0, Number(xp) || 0)
  const rankIndex = ranks.reduce((found, rank, index) => currentXP >= rank.minXP ? index : found, 0)
  return { ...ranks[Math.max(0, rankIndex)], next: ranks[rankIndex + 1] || null }
}

export const getImperiumRank = (xp = 0) => getFactionRank(xp, 'imperium')

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
      achievements: Array.isArray(saved.achievements) ? saved.achievements.filter((id) => id !== 'quiz-complete' && id !== 'signal-decoder') : [],
      answeredQuestions: Array.isArray(saved.answeredQuestions) ? saved.answeredQuestions : [],
      discoveredEntries: Array.isArray(saved.discoveredEntries) ? saved.discoveredEntries : [],
      readEntries: Array.isArray(saved.readEntries) ? saved.readEntries : [],
      completedLevels: Array.isArray(saved.completedLevels) ? saved.completedLevels : [],
      interceptedLore: saved.interceptedLore && typeof saved.interceptedLore === 'object' ? saved.interceptedLore : {},
    }
  } catch {
    return { xp: 0, studiedFactions: [], dailyMission: null, achievements: [], answeredQuestions: [], discoveredEntries: [], readEntries: [], completedLevels: [], interceptedLore: {} }
  }
}

export function applyServerProgress(progress) {
  return saveProgress({
    xp: Number(progress.xp) || 0,
    studiedFactions: Array.isArray(progress.studiedFactions) ? progress.studiedFactions : [],
    dailyMission: progress.dailyMission || null,
    achievements: Array.isArray(progress.achievements) ? progress.achievements.filter((id) => id !== 'quiz-complete' && id !== 'signal-decoder') : [],
    answeredQuestions: Array.isArray(progress.answeredQuestions) ? progress.answeredQuestions : [],
    discoveredEntries: Array.isArray(progress.discoveredEntries) ? progress.discoveredEntries : [],
    readEntries: Array.isArray(progress.readEntries) ? progress.readEntries : [],
    completedLevels: Array.isArray(progress.completedLevels) ? progress.completedLevels : [],
    interceptedLore: progress.interceptedLore && typeof progress.interceptedLore === 'object' ? progress.interceptedLore : {},
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
  const xp = progress.xp + 15
  return saveProgress({ ...progress, xp, answeredQuestions })
}
