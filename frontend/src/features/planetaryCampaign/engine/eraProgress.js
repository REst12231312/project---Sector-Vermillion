import { getCurrentUser } from '../../../utils/api'
import { resolveStoryEvents } from './storyEventResolver'

export const ERA_PROGRESS_VERSION = 1
const ERA_STORAGE_PREFIX = 'sv-planet-eras'

export function createEmptyEraProgress() {
  return { version: ERA_PROGRESS_VERSION, planets: {} }
}

function userIdentity(user) {
  return user?.id || user?._id || user?.username || 'guest'
}

export function getEraProgressStorageKey(user = getCurrentUser()) {
  return `${ERA_STORAGE_PREFIX}:v${ERA_PROGRESS_VERSION}:${encodeURIComponent(String(userIdentity(user)))}`
}

export function loadEraProgress(storage = window.localStorage, user = getCurrentUser()) {
  try {
    const parsed = JSON.parse(storage.getItem(getEraProgressStorageKey(user)) || 'null')
    if (!parsed || parsed.version !== ERA_PROGRESS_VERSION || !parsed.planets || typeof parsed.planets !== 'object') return createEmptyEraProgress()
    return parsed
  } catch {
    return createEmptyEraProgress()
  }
}

export function saveEraProgress(progress, storage = window.localStorage, user = getCurrentUser()) {
  const normalized = { ...createEmptyEraProgress(), ...progress, version: ERA_PROGRESS_VERSION }
  try { storage.setItem(getEraProgressStorageKey(user), JSON.stringify(normalized)) } catch { /* Continue with in-memory progress if browser storage is unavailable. */ }
  return normalized
}

export function getPlanetEraLedger(progress, planetId) {
  const source = progress?.planets?.[planetId]
  const ledger = source && typeof source === 'object' && !Array.isArray(source) ? source : {}
  return {
    ...ledger,
    eras: ledger.eras && typeof ledger.eras === 'object' && !Array.isArray(ledger.eras) ? ledger.eras : {},
    firedStoryEventIds: Array.isArray(ledger.firedStoryEventIds) ? ledger.firedStoryEventIds : [],
    knownUnlockedEraIds: Array.isArray(ledger.knownUnlockedEraIds) ? ledger.knownUnlockedEraIds : [],
    pendingEraNotifications: Array.isArray(ledger.pendingEraNotifications) ? ledger.pendingEraNotifications : [],
    seenEraNotifications: Array.isArray(ledger.seenEraNotifications) ? ledger.seenEraNotifications : [],
    replaySessions: ledger.replaySessions && typeof ledger.replaySessions === 'object' && !Array.isArray(ledger.replaySessions) ? ledger.replaySessions : {},
  }
}

export function buildEraUnlockContext(storyProgress, territoryProgressByEra, territories, eras) {
  const completedMissionIds = new Set(storyProgress.completedLevels || [])
  const completedTerritoryIds = new Set()
  const completedEraIds = new Set()
  for (const era of eras) {
    const progress = territoryProgressByEra[era.id]
    for (const missionId of progress?.completedMissionIds || []) completedMissionIds.add(missionId)
    for (const territory of territories.filter((entry) => entry.eraId === era.id && entry.missions.length > 0)) {
      if (territory.missions.every((missionId) => completedMissionIds.has(missionId))) completedTerritoryIds.add(territory.id)
    }
    if (era.requiredMissionIds?.length && era.requiredMissionIds.every((missionId) => completedMissionIds.has(missionId))) completedEraIds.add(era.id)
  }
  return {
    completedMissionIds: [...completedMissionIds],
    completedTerritoryIds: [...completedTerritoryIds],
    completedEraIds: [...completedEraIds],
    // The archive's real unlock state is tracked by knowledge entries, separately
    // from campaign operations. A discovered or read entry is available to the user.
    unlockedDossierIds: [...new Set([...(storyProgress.discoveredEntries || []), ...(storyProgress.readEntries || [])])],
  }
}

export function reconcileEraProgress(progress, { planetId, eraStatuses, eras, storyEvents = [], unlockContext = {} }) {
  const planetLedger = getPlanetEraLedger(progress, planetId)
  const eventResult = resolveStoryEvents(storyEvents, unlockContext, planetLedger.firedStoryEventIds)
  const knownUnlockedEraIds = new Set(planetLedger.knownUnlockedEraIds || [])
  const pendingEraNotifications = new Set(planetLedger.pendingEraNotifications || [])
  const seenEraNotifications = new Set(planetLedger.seenEraNotifications || [])
  const unlockedEraIds = new Set((eraStatuses || []).filter((entry) => entry.status !== 'hidden').map((entry) => entry.eraId))

  for (const status of eraStatuses || []) {
    if (status.status === 'hidden') continue
    const era = eras.find((item) => item.id === status.eraId)
    if (era?.unlock?.type === 'default') {
      knownUnlockedEraIds.add(era.id)
      continue
    }
    if (!knownUnlockedEraIds.has(status.eraId)) {
      knownUnlockedEraIds.add(status.eraId)
      if (!seenEraNotifications.has(status.eraId)) pendingEraNotifications.add(status.eraId)
    }
  }

  for (const action of eventResult.actions) {
    if (action.type === 'unlock_era' && unlockedEraIds.has(action.eraId) && !seenEraNotifications.has(action.eraId)) pendingEraNotifications.add(action.eraId)
  }

  const nextPlanetLedger = {
    ...planetLedger,
    eras: { ...planetLedger.eras },
    firedStoryEventIds: eventResult.firedEventIds,
    knownUnlockedEraIds: [...knownUnlockedEraIds],
    pendingEraNotifications: [...pendingEraNotifications],
    seenEraNotifications: [...seenEraNotifications],
  }
  const next = { ...progress, version: ERA_PROGRESS_VERSION, planets: { ...progress.planets, [planetId]: nextPlanetLedger } }
  return { progress: next, changed: JSON.stringify(next) !== JSON.stringify(progress), newlyFiredEventIds: eventResult.firedEvents }
}

export function acknowledgeEraNotification(progress, planetId, eraId) {
  const planetLedger = getPlanetEraLedger(progress, planetId)
  if (!planetLedger.pendingEraNotifications.includes(eraId)) return progress
  const nextPlanetLedger = {
    ...planetLedger,
    pendingEraNotifications: planetLedger.pendingEraNotifications.filter((id) => id !== eraId),
    seenEraNotifications: [...new Set([...planetLedger.seenEraNotifications, eraId])],
  }
  return { ...progress, planets: { ...progress.planets, [planetId]: nextPlanetLedger } }
}
