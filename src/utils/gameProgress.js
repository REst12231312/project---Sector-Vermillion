const STORAGE_KEY = 'sv-progress'
export const FACTION_IDS = ['imperium', 'orks', 'chaos', 'tau']

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
    }
  } catch {
    return { xp: 0, studiedFactions: [], dailyMission: null, achievements: [] }
  }
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

  return saveProgress({ xp, studiedFactions, dailyMission, achievements })
}
