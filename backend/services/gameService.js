import { campaignLevelIds, factionIds, loreEntries, quizAnswers } from '../data/gameData.js'
import { tacticalCampaigns } from '../data/tacticalCampaigns.js'
import { getProgress, saveProgress } from '../storage.js'

export function freshProgress() {
  return { xp: 0, studiedFactions: [], dailyMission: null, achievements: [], answeredQuestions: [], discoveredEntries: [], readEntries: [], completedLevels: [], rewardGrants: [], tacticalCampaigns: {}, interceptedLore: {}, updatedAt: new Date().toISOString() }
}
export function getState(profileId) {
  const saved = getProgress(profileId)
  if (!saved) return freshProgress()
  const state = { ...freshProgress(), ...saved }
  for (const key of ['studiedFactions', 'achievements', 'answeredQuestions', 'discoveredEntries', 'readEntries', 'completedLevels', 'rewardGrants']) {
    if (!Array.isArray(state[key])) state[key] = []
  }
  if (!state.tacticalCampaigns || typeof state.tacticalCampaigns !== 'object' || Array.isArray(state.tacticalCampaigns)) state.tacticalCampaigns = {}
  state.achievements = state.achievements.filter((id) => id !== 'quiz-complete' && id !== 'signal-decoder')
  if (!state.interceptedLore || typeof state.interceptedLore !== 'object' || Array.isArray(state.interceptedLore)) state.interceptedLore = {}
  for (const faction of factionIds) if (!Array.isArray(state.interceptedLore[faction])) state.interceptedLore[faction] = []
  return state
}
function persist(profileId, state) { return saveProgress(profileId, state) }
function addAchievement(state, id) { if (!state.achievements.includes(id)) state.achievements.push(id) }
function awardCampaignCompletion(state, levelId, xp = 100) {
  const rewardKey = `operation:${levelId}:completion`
  const alreadyClaimed = state.rewardGrants.includes(rewardKey) || state.completedLevels.includes(levelId)
  if (!state.completedLevels.includes(levelId)) state.completedLevels.push(levelId)
  if (!state.rewardGrants.includes(rewardKey)) state.rewardGrants.push(rewardKey)
  const achievementId = `campaign-${levelId}`
  const hadAchievement = state.achievements.includes(achievementId)
  if (!alreadyClaimed) {
    state.xp += xp
    addAchievement(state, achievementId)
  }
  return { rewardKey, xpGranted: alreadyClaimed ? 0 : xp, achievementIds: alreadyClaimed || hadAchievement ? [] : [achievementId], dossierIds: alreadyClaimed ? [] : [levelId], alreadyClaimed }
}
function isUnlocked(entry, state) {
  return entry.requiredEntries
    ? entry.requiredEntries.every((id) => state.readEntries.includes(id))
    : state.discoveredEntries.includes(entry.id) || state.readEntries.includes(entry.id)
}
export function completeCampaign(profileId, faction, levelId) {
  const validFaction = factionIds.includes(faction) ? faction : 'imperium'
  const levels = campaignLevelIds[validFaction]
  const index = levels.indexOf(levelId)
  if (index < 0) return { status: 404, error: 'Операция не найдена.' }
  const state = getState(profileId)
  if (index > 0 && !state.completedLevels.includes(levels[index - 1])) return { status: 403, error: 'Сначала заверши предыдущую операцию.' }
  awardCampaignCompletion(state, levelId)
  return { state: persist(profileId, state) }
}

function normalizeTacticalCampaign(state, operationId) {
  const existing = state.tacticalCampaigns[operationId]
  if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
    existing.completedMissionIds = Array.isArray(existing.completedMissionIds) ? [...new Set(existing.completedMissionIds.filter((id) => typeof id === 'string'))] : []
    existing.results = Array.isArray(existing.results) ? existing.results.filter((entry) => entry && typeof entry === 'object' && typeof entry.resultId === 'string' && typeof entry.missionId === 'string' && ['victory', 'defeat', 'draw'].includes(entry.outcome)) : []
    existing.completedAt = typeof existing.completedAt === 'string' ? existing.completedAt : null
    existing.statistics = existing.statistics && typeof existing.statistics === 'object' && !Array.isArray(existing.statistics) ? existing.statistics : null
    return existing
  }
  const campaign = { completedMissionIds: [], results: [], completedAt: null, result: null, statistics: null }
  state.tacticalCampaigns[operationId] = campaign
  return campaign
}

export function recordTacticalMission(profileId, faction, operationId, payload = {}) {
  const config = tacticalCampaigns[operationId]
  if (!config) return { status: 404, error: 'Тактическая кампания не найдена.' }
  if (faction !== config.factionId || payload.factionId !== config.factionId || payload.planetId !== config.planetId || payload.eraId !== config.eraId || payload.campaignId !== config.campaignId) {
    return { status: 403, error: 'Параметры кампании не соответствуют профилю игрока.' }
  }
  const mission = config.missions.find((entry) => entry.id === payload.missionId)
  if (!mission) return { status: 404, error: 'Миссия не входит в эту кампанию.' }
  if (!['victory', 'defeat', 'draw'].includes(payload.outcome)) return { status: 400, error: 'Неизвестный результат миссии.' }
  if (typeof payload.resultId !== 'string' || payload.resultId.length < 1 || payload.resultId.length > 120) return { status: 400, error: 'Некорректный идентификатор результата.' }
  const state = getState(profileId)
  const campaign = normalizeTacticalCampaign(state, operationId)
  if ((mission.requires || []).some((id) => !campaign.completedMissionIds.includes(id))) return { status: 403, error: 'Сначала заверши предыдущую миссию этого направления.' }
  if (campaign.results.some((entry) => entry.resultId === payload.resultId)) return { progress: state, result: campaign.results.find((entry) => entry.resultId === payload.resultId), alreadyRecorded: true }
  const safeNumber = (value, fallback, max) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(max, Math.floor(Number(value)))) : fallback
  const result = {
    resultId: payload.resultId,
    missionId: mission.id,
    territoryId: mission.territoryId,
    outcome: payload.outcome,
    rounds: safeNumber(payload.rounds, 0, 1000),
    survivingUnits: safeNumber(payload.survivingUnits, 0, 100),
    completedAt: typeof payload.completedAt === 'string' && !Number.isNaN(Date.parse(payload.completedAt)) ? payload.completedAt : new Date().toISOString(),
  }
  campaign.results.push(result)
  if (result.outcome === 'victory' && !campaign.completedMissionIds.includes(mission.id)) campaign.completedMissionIds.push(mission.id)
  persist(profileId, state)
  return { progress: state, result, alreadyRecorded: false }
}

export function completeTacticalCampaign(profileId, faction, operationId) {
  const config = tacticalCampaigns[operationId]
  if (!config) return { status: 404, error: 'Тактическая кампания не найдена.' }
  if (faction !== config.factionId) return { status: 403, error: 'Эта кампания недоступна выбранной фракции.' }
  const state = getState(profileId)
  const campaign = normalizeTacticalCampaign(state, operationId)
  const completedMissionIds = config.missions.map((mission) => mission.id).filter((id) => campaign.completedMissionIds.includes(id) && campaign.results.some((entry) => entry.missionId === id && entry.outcome === 'victory'))
  if (completedMissionIds.length !== config.missions.length) return { status: 403, error: 'Не все обязательные тактические миссии подтверждены сервером.' }
  if (campaign.completedAt) {
    return { progress: state, result: { operationId, campaignId: config.campaignId, planetId: config.planetId, eraId: config.eraId, factionId: config.factionId, result: 'victory', completedMissions: completedMissionIds, statistics: campaign.statistics, completedAt: campaign.completedAt }, reward: { rewardKey: `operation:${operationId}:completion`, xpGranted: 0, achievementIds: [], dossierIds: [], alreadyClaimed: true } }
  }
  const reward = awardCampaignCompletion(state, operationId, config.rewardXp)
  campaign.result = 'victory'
  const canonicalResults = config.missions.map((mission) => campaign.results.find((entry) => entry.missionId === mission.id && entry.outcome === 'victory')).filter(Boolean)
  campaign.statistics = {
    totalRounds: canonicalResults.reduce((total, entry) => total + entry.rounds, 0),
    unitsLost: canonicalResults.reduce((total, entry) => total + Math.max(0, 3 - entry.survivingUnits), 0),
    survivingUnits: canonicalResults.at(-1)?.survivingUnits || 0,
    territoriesCaptured: new Set(canonicalResults.map((entry) => entry.territoryId)).size,
  }
  campaign.completedAt = new Date().toISOString()
  persist(profileId, state)
  return { progress: state, result: { operationId, campaignId: config.campaignId, planetId: config.planetId, eraId: config.eraId, factionId: config.factionId, result: 'victory', completedMissions: completedMissionIds, statistics: campaign.statistics, completedAt: campaign.completedAt }, reward }
}
export function getFactionFragments(factionId) {
  const fragments = loreEntries.filter((entry) => entry.factionId === factionId)
  if (!fragments.length) return null
  return fragments.map((entry, index) => ({
    id: entry.id,
    cipherText: entry.cipherText,
    choices: [entry, fragments[(index + 3) % fragments.length], fragments[(index + 7) % fragments.length]]
      .map(({ id, keyword, hint }) => ({ choiceId: id, keyword, explanation: hint }))
      .sort(() => Math.random() - 0.5),
  }))
}
export function studyFaction(profileId, factionId) {
  if (!factionIds.includes(factionId)) return null
  const state = getState(profileId)
  if (!state.studiedFactions.includes(factionId)) {
    state.studiedFactions.push(factionId)
    state.xp += 25
  }
  const today = new Date().toISOString().slice(0, 10)
  if (state.dailyMission !== today) {
    state.dailyMission = today
    state.xp += 50
    addAchievement(state, 'first-daily')
  }
  addAchievement(state, 'first-dossier')
  if (factionIds.every((id) => state.studiedFactions.includes(id)) && !state.achievements.includes('all-factions')) {
    addAchievement(state, 'all-factions')
    state.xp += 100
  }
  return persist(profileId, state)
}
export function recordSignalIntercept(profileId) {
  const state = getState(profileId)
  const achievementId = 'first-enemy-signal'
  const awarded = !state.achievements.includes(achievementId)
  if (awarded) {
    addAchievement(state, achievementId)
    persist(profileId, state)
  }
  return { progress: state, awarded }
}
export function recordInterceptedLore(profileId, ownFaction, sourceFaction, recordId) {
  if (!factionIds.includes(ownFaction) || !factionIds.includes(sourceFaction) || sourceFaction === ownFaction) {
    return { status: 400, error: 'Нельзя сохранить досье этой стороны.' }
  }
  if (!campaignLevelIds[sourceFaction].includes(recordId)) {
    return { status: 404, error: 'Перехваченное досье не найдено.' }
  }

  const state = getState(profileId)
  if (!state.interceptedLore || typeof state.interceptedLore !== 'object') state.interceptedLore = {}
  for (const faction of factionIds) {
    if (!Array.isArray(state.interceptedLore[faction])) state.interceptedLore[faction] = []
  }

  const records = state.interceptedLore[sourceFaction]
  if (!records.includes(recordId)) records.push(recordId)

  const awardedCampaignIds = []
  for (const interceptedRecordId of records) {
    const campaignAchievementId = `campaign-${interceptedRecordId}`
    if (!state.achievements.includes(campaignAchievementId)) {
      addAchievement(state, campaignAchievementId)
      awardedCampaignIds.push(campaignAchievementId)
    }
  }

  const achievementId = `all-lore-${sourceFaction}`
  const awarded = campaignLevelIds[sourceFaction].every((id) => records.includes(id)) && !state.achievements.includes(achievementId)
  if (awarded) addAchievement(state, achievementId)
  persist(profileId, state)
  return { progress: state, awarded, awardedCampaignIds, sourceFaction }
}
export function answerQuiz(profileId, questionId, answerIndex) {
  if (!Object.hasOwn(quizAnswers, questionId)) return { status: 404, error: 'Вопрос не найден.' }
  const state = getState(profileId)
  const alreadyAnswered = state.answeredQuestions.includes(questionId)
  if (!alreadyAnswered && Number(answerIndex) !== quizAnswers[questionId]) return { status: 400, correct: false, error: 'Ответ неверный. Перечитай досье и попробуй ещё раз.' }
  if (!alreadyAnswered) {
    state.answeredQuestions.push(questionId)
    state.xp += 15
  }
  return { correct: true, alreadyAnswered, progress: persist(profileId, state) }
}
export function getKnowledge(profileId) {
  const state = getState(profileId)
  const entries = loreEntries.map((entry) => {
    const unlocked = isUnlocked(entry, state)
    return { ...entry, keyword: unlocked ? entry.keyword : null, hint: unlocked ? entry.hint : null, title: unlocked ? entry.title : null, unlocked, read: state.readEntries.includes(entry.id), body: unlocked ? entry.body : null }
  })
  return { terms: entries.filter((entry) => entry.unlocked).map(({ keyword, category, title, id }) => ({ keyword, category, title, entryId: id })), entries }
}
export function discoverEntry(profileId, entryId, choiceId) {
  const entry = loreEntries.find((candidate) => candidate.id === entryId && candidate.factionId)
  if (!entry) return { status: 404, error: 'Ключевой фрагмент не найден.' }
  if (choiceId !== entry.id) return { status: 400, error: 'Это понятие не совпадает с фрагментом. Перечитай сообщение и попробуй другой вариант.' }
  const state = getState(profileId)
  if (!state.discoveredEntries.includes(entry.id)) { state.discoveredEntries.push(entry.id); state.xp += 5 }
  return { entry: { id: entry.id, title: entry.title, keyword: entry.keyword }, progress: persist(profileId, state) }
}
export function readEntry(profileId, entryId) {
  const entry = loreEntries.find((candidate) => candidate.id === entryId)
  if (!entry) return { status: 404, error: 'Запись не найдена.' }
  const state = getState(profileId)
  if (!isUnlocked(entry, state)) return { status: 403, error: 'Эта запись пока закрыта. Изучи нужные досье и прочитай связанные материалы.' }
  if (!state.readEntries.includes(entry.id)) {
    state.readEntries.push(entry.id)
    state.xp += entry.category === 'НОВАЯ ЗОНА' ? 50 : 20
  }
  return { entry, progress: persist(profileId, state) }
}
