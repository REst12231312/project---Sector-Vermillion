import { getCurrentUser } from '../../../utils/api'

export const OPERATION_PROGRESS_VERSION = 1
const STORAGE_PREFIX = 'sv-operation-campaign'
const emptyProgress = () => ({ version: OPERATION_PROGRESS_VERSION, operations: {} })

function userKey(user) {
  return user?.id || user?._id || user?.username || 'guest'
}

export function getOperationProgressStorageKey(user = getCurrentUser()) {
  return `${STORAGE_PREFIX}:v${OPERATION_PROGRESS_VERSION}:${encodeURIComponent(String(userKey(user)))}`
}

export function loadOperationProgress(storage = window.localStorage, user = getCurrentUser()) {
  try {
    const parsed = JSON.parse(storage.getItem(getOperationProgressStorageKey(user)) || 'null')
    if (parsed?.version !== OPERATION_PROGRESS_VERSION || !parsed.operations || typeof parsed.operations !== 'object' || Array.isArray(parsed.operations)) return emptyProgress()
    return parsed
  } catch {
    return emptyProgress()
  }
}

export function saveOperationProgress(progress, storage = window.localStorage, user = getCurrentUser()) {
  const normalized = { ...emptyProgress(), ...progress, version: OPERATION_PROGRESS_VERSION }
  try { storage.setItem(getOperationProgressStorageKey(user), JSON.stringify(normalized)) } catch { /* Preserve in-memory state if local storage is unavailable. */ }
  return normalized
}

export function recordOperationMissionResult(progress, operationId, requiredMissionIds, result) {
  if (!operationId || !Array.isArray(requiredMissionIds) || !result?.missionId || !result?.resultId) return progress
  if (!requiredMissionIds.includes(result.missionId)) return progress
  const prior = progress.operations?.[operationId] || { completedMissionIds: [], results: [], status: 'in_progress', completedAt: null }
  if (prior.results.some((entry) => entry.resultId === result.resultId)) return progress
  const completedMissionIds = new Set(prior.completedMissionIds || [])
  if (result.outcome === 'victory') completedMissionIds.add(result.missionId)
  const completed = requiredMissionIds.length > 0 && requiredMissionIds.every((id) => completedMissionIds.has(id))
  const operationProgress = {
    ...prior,
    completedMissionIds: [...completedMissionIds],
    results: [...(Array.isArray(prior.results) ? prior.results : []), { ...result }],
    status: completed ? 'completed' : 'in_progress',
    completedAt: prior.completedAt || (completed ? result.recordedAt || new Date().toISOString() : null),
  }
  return { ...progress, version: OPERATION_PROGRESS_VERSION, operations: { ...progress.operations, [operationId]: operationProgress } }
}

export function isOperationCampaignCompleted(progress, operationId) {
  return progress?.operations?.[operationId]?.status === 'completed'
}

export function mergeCampaignCompletions(legacyCompletedLevels, operationProgress) {
  const completed = new Set(Array.isArray(legacyCompletedLevels) ? legacyCompletedLevels : [])
  for (const [operationId, record] of Object.entries(operationProgress?.operations || {})) {
    if (record.status === 'completed') completed.add(operationId)
  }
  return [...completed]
}
