import { getCurrentUser } from '../../../utils/api'
import { createMissionSetup } from './missionEngine'

export const TERRITORY_PROGRESS_VERSION = 1
const STORAGE_PREFIX = 'sv-tactical-territory'
const DEFAULT_SCOPE = { planetId: 'terra', eraId: 'unification' }

export function createEmptyTerritoryProgress() {
  return { version: TERRITORY_PROGRESS_VERSION, planetId: DEFAULT_SCOPE.planetId, eraId: DEFAULT_SCOPE.eraId, completedMissionIds: [], missionRecords: {}, history: [], territoryControl: 'enemy', territoryControls: {}, pendingConsequences: [], grantedConsequenceIds: [], consumedConsequenceIds: [], activeMissionId: null, activeMissionSetup: null, retryMissionSetup: null }
}

export function getTerritoryStorageKey(user = getCurrentUser(), scope = DEFAULT_SCOPE) {
  const identity = user?.id || user?._id || user?.username || 'guest'
  return `${STORAGE_PREFIX}:v${TERRITORY_PROGRESS_VERSION}:${encodeURIComponent(String(identity))}:${encodeURIComponent(scope.planetId)}:${encodeURIComponent(scope.eraId)}`
}

export function loadTerritoryProgress(storage = window.localStorage, user = getCurrentUser(), scope = DEFAULT_SCOPE) {
  try {
    const storageKey = getTerritoryStorageKey(user, scope)
    let raw = storage.getItem(storageKey)
    let migratedLegacy = false
    if (!raw && scope.planetId === DEFAULT_SCOPE.planetId && scope.eraId === DEFAULT_SCOPE.eraId) {
      const legacyKey = `${STORAGE_PREFIX}:v${TERRITORY_PROGRESS_VERSION}:${encodeURIComponent(String(user?.id || user?._id || user?.username || 'guest'))}`
      raw = storage.getItem(legacyKey)
      migratedLegacy = Boolean(raw)
    }
    const parsed = JSON.parse(raw || 'null')
    if (!parsed || parsed.version !== TERRITORY_PROGRESS_VERSION) return createEmptyTerritoryProgress()
    if ((parsed.planetId && parsed.planetId !== scope.planetId) || (parsed.eraId && parsed.eraId !== scope.eraId)) return createEmptyTerritoryProgress()
    const normalized = {
      ...createEmptyTerritoryProgress(), ...parsed, planetId: scope.planetId, eraId: scope.eraId,
      completedMissionIds: Array.isArray(parsed.completedMissionIds) ? parsed.completedMissionIds : [],
      missionRecords: parsed.missionRecords && typeof parsed.missionRecords === 'object' ? parsed.missionRecords : {},
      territoryControls: parsed.territoryControls && typeof parsed.territoryControls === 'object' ? parsed.territoryControls : {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
      pendingConsequences: Array.isArray(parsed.pendingConsequences) ? parsed.pendingConsequences : [],
      grantedConsequenceIds: Array.isArray(parsed.grantedConsequenceIds) ? parsed.grantedConsequenceIds : [],
      consumedConsequenceIds: Array.isArray(parsed.consumedConsequenceIds) ? parsed.consumedConsequenceIds : [],
    }
    if (migratedLegacy) {
      try { storage.setItem(storageKey, JSON.stringify(normalized)) } catch { /* Keep the legacy save readable when migration storage is unavailable. */ }
    }
    return normalized
  } catch {
    return createEmptyTerritoryProgress()
  }
}

export function saveTerritoryProgress(progress, storage = window.localStorage, user = getCurrentUser(), scope = DEFAULT_SCOPE) {
  const normalized = { ...createEmptyTerritoryProgress(), ...progress, planetId: scope.planetId, eraId: scope.eraId, version: TERRITORY_PROGRESS_VERSION }
  try { storage.setItem(getTerritoryStorageKey(user, scope), JSON.stringify(normalized)) } catch { /* storage can be unavailable in private browsing */ }
  return normalized
}

export function getTerritoryMissionStatuses(territory, progress) {
  let nextAvailableIndex = territory.missions.findIndex((id) => !progress.completedMissionIds.includes(id))
  if (nextAvailableIndex < 0) nextAvailableIndex = territory.missions.length
  return territory.missions.map((id, index) => ({
    missionId: id,
    status: progress.completedMissionIds.includes(id) ? 'completed' : index < nextAvailableIndex ? 'completed' : index === nextAvailableIndex ? progress.activeMissionId === id ? 'in_progress' : 'available' : 'locked',
    result: progress.missionRecords[id] || null,
  }))
}

export function beginTerritoryMission(progress, missionConfig) {
  if (progress.activeMissionId === missionConfig.id && progress.activeMissionSetup?.missionId === missionConfig.id) return { progress, setup: progress.activeMissionSetup }
  const pending = progress.pendingConsequences.filter((item) => item.nextMissionId === missionConfig.id && !progress.consumedConsequenceIds.includes(item.id))
  const setup = progress.retryMissionSetup?.missionId === missionConfig.id ? progress.retryMissionSetup : createMissionSetup(missionConfig, pending)
  const consumedConsequenceIds = [...new Set([...progress.consumedConsequenceIds, ...setup.consumedConsequenceIds])]
  const nextProgress = {
    ...progress,
    pendingConsequences: progress.pendingConsequences.filter((item) => !setup.consumedConsequenceIds.includes(item.id)),
    consumedConsequenceIds,
    activeMissionId: missionConfig.id,
    activeMissionSetup: setup,
    retryMissionSetup: null,
  }
  return { progress: nextProgress, setup }
}

export function recordTerritoryMissionResult(progress, territory, missionConfig, battleState) {
  const outcome = battleState.missionOutcome || battleState.battleStatus
  const runNumber = (progress.history.filter((entry) => entry.missionId === missionConfig.id).length || 0) + 1
  const survivingUnits = battleState.units.filter((unit) => unit.side === 'player' && unit.hp > 0).map((unit) => ({ id: unit.id, name: unit.name, hp: unit.hp, maxHp: unit.maxHp }))
  const result = {
    id: `${missionConfig.id}-run-${runNumber}`, missionId: missionConfig.id, missionName: missionConfig.name, outcome,
    rounds: battleState.round, survivingUnits, strategicObjects: battleState.strategicObjects.map((object) => ({ id: object.id, name: object.name, hp: object.hp, maxHp: object.maxHp, status: object.hp <= 0 ? 'destroyed' : object.status })),
    missionProgress: { ...battleState.missionProgress }, appliedConsequences: battleState.appliedConsequences || [], completedAt: new Date().toISOString(),
  }
  const history = [...progress.history, result]
  const priorRecord = progress.missionRecords[missionConfig.id]
  const preserveSuccessfulRecord = priorRecord?.outcome === 'victory'
  const missionRecords = preserveSuccessfulRecord ? progress.missionRecords : { ...progress.missionRecords, [missionConfig.id]: result }
  let completedMissionIds = [...progress.completedMissionIds]
  let territoryControls = { ...(progress.territoryControls || {}) }
  let territoryControl = territoryControls[territory.id] || (territory.id === 'terra-northern-front' ? progress.territoryControl : 'enemy')
  let pendingConsequences = [...progress.pendingConsequences]
  let grantedConsequenceIds = [...progress.grantedConsequenceIds]
  const firstVictory = outcome === 'victory' && !completedMissionIds.includes(missionConfig.id)
  if (firstVictory) {
    completedMissionIds.push(missionConfig.id)
    if (territoryControl === 'enemy') territoryControl = 'contested'
    for (const consequence of missionConfig.onVictoryConsequences || []) {
      if (grantedConsequenceIds.includes(consequence.id)) continue
      if (consequence.requiresSurvivingUnits && survivingUnits.length < consequence.requiresSurvivingUnits) continue
      pendingConsequences.push({ ...consequence, sourceMissionId: missionConfig.id })
      grantedConsequenceIds.push(consequence.id)
    }
  }
  if (territory.missions.length > 0 && territory.missions.every((id) => completedMissionIds.includes(id))) territoryControl = 'player'
  territoryControls[territory.id] = territoryControl
  return {
    ...progress,
    completedMissionIds,
    missionRecords,
    history,
    territoryControl,
    territoryControls,
    pendingConsequences,
    grantedConsequenceIds,
    activeMissionId: null,
    activeMissionSetup: null,
    retryMissionSetup: outcome === 'victory' ? null : battleState.missionSetup || null,
  }
}
