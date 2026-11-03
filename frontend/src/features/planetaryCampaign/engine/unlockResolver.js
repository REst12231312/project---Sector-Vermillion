const conditionTypes = new Set(['default', 'mission_completed', 'territory_completed', 'era_completed', 'dossier_unlocked', 'all_completed', 'any_completed'])
const asList = (value) => Array.isArray(value) ? value : []

function collectEraDependencies(condition, references = []) {
  if (!condition || typeof condition !== 'object') return references
  if (condition.type === 'era_completed' && typeof condition.eraId === 'string') references.push(condition.eraId)
  for (const child of condition.conditions || []) collectEraDependencies(child, references)
  return references
}

function validateCondition(condition, path, errors) {
  if (!condition || typeof condition !== 'object' || !conditionTypes.has(condition.type)) {
    errors.push(`${path}: неизвестное условие открытия.`)
    return
  }
  if (condition.type === 'mission_completed' && !condition.missionId) errors.push(`${path}: отсутствует missionId.`)
  if (condition.type === 'territory_completed' && !condition.territoryId) errors.push(`${path}: отсутствует territoryId.`)
  if (condition.type === 'era_completed' && !condition.eraId) errors.push(`${path}: отсутствует eraId.`)
  if (condition.type === 'dossier_unlocked' && !condition.dossierId) errors.push(`${path}: отсутствует dossierId.`)
  if (condition.type === 'all_completed' || condition.type === 'any_completed') {
    if (!Array.isArray(condition.conditions) || condition.conditions.length === 0) errors.push(`${path}: нужен непустой список conditions.`)
    else condition.conditions.forEach((child, index) => validateCondition(child, `${path}.conditions[${index}]`, errors))
  }
}

export function validateEraConfigs(eras) {
  const errors = []
  const byId = new Map()
  for (const era of eras || []) {
    if (!era?.id) errors.push('У эпохи отсутствует id.')
    else if (byId.has(era.id)) errors.push(`Повторяющийся id эпохи: ${era.id}.`)
    else byId.set(era.id, era)
    if (!era?.planetId) errors.push(`${era?.id || 'Эпоха'}: отсутствует planetId.`)
    if (!era?.mapId) errors.push(`${era?.id || 'Эпоха'}: отсутствует mapId.`)
    validateCondition(era?.unlock, `${era?.id || 'era'}.unlock`, errors)
  }
  for (const era of eras || []) {
    for (const dependency of collectEraDependencies(era.unlock)) {
      if (!byId.has(dependency)) errors.push(`${era.id}: неизвестная зависимость от эпохи ${dependency}.`)
    }
  }
  const visiting = new Set()
  const visited = new Set()
  function walk(eraId, stack) {
    if (visiting.has(eraId)) {
      errors.push(`Обнаружен цикл разблокировки эпох: ${[...stack, eraId].join(' → ')}.`)
      return
    }
    if (visited.has(eraId)) return
    const era = byId.get(eraId)
    if (!era) return
    visiting.add(eraId)
    for (const dependency of collectEraDependencies(era.unlock)) walk(dependency, [...stack, eraId])
    visiting.delete(eraId)
    visited.add(eraId)
  }
  byId.forEach((_, eraId) => walk(eraId, []))
  return errors
}

function conditionMet(condition, context, eraById, stack) {
  if (!condition || typeof condition !== 'object') return false
  if (condition.type === 'default') return true
  if (condition.type === 'mission_completed') return context.completedMissionIds.has(condition.missionId)
  if (condition.type === 'territory_completed') return context.completedTerritoryIds.has(condition.territoryId)
  if (condition.type === 'dossier_unlocked') return context.unlockedDossierIds.has(condition.dossierId)
  if (condition.type === 'era_completed') {
    if (stack.has(condition.eraId)) return false
    if (context.completedEraIds.has(condition.eraId)) return true
    const dependency = eraById.get(condition.eraId)
    return Boolean(dependency?.requiredMissionIds?.length && dependency.requiredMissionIds.every((id) => context.completedMissionIds.has(id)))
  }
  if (condition.type === 'all_completed') return Array.isArray(condition.conditions) && condition.conditions.length > 0 && condition.conditions.every((item) => conditionMet(item, context, eraById, stack))
  if (condition.type === 'any_completed') return Array.isArray(condition.conditions) && condition.conditions.length > 0 && condition.conditions.some((item) => conditionMet(item, context, eraById, stack))
  return false
}

export function resolveEraStatuses(eras, context = {}) {
  const eraById = new Map((eras || []).map((era) => [era.id, era]))
  const completedMissionIds = new Set(asList(context.completedMissionIds))
  const normalizedContext = {
    completedMissionIds,
    completedTerritoryIds: new Set(asList(context.completedTerritoryIds)),
    completedEraIds: new Set(asList(context.completedEraIds)),
    unlockedDossierIds: new Set(asList(context.unlockedDossierIds)),
  }
  const cache = new Map()
  function resolve(eraId, stack = new Set()) {
    if (cache.has(eraId)) return cache.get(eraId)
    if (stack.has(eraId)) return 'hidden'
    const era = eraById.get(eraId)
    if (!era) return 'hidden'
    const nextStack = new Set(stack)
    nextStack.add(eraId)
    const unlock = era.unlock || { type: 'unknown' }
    if (!conditionMet(unlock, normalizedContext, eraById, nextStack)) {
      cache.set(eraId, 'hidden')
      return 'hidden'
    }
    const completed = asList(context.completedEraIds).includes(eraId) || Boolean(era.requiredMissionIds?.length && era.requiredMissionIds.every((id) => completedMissionIds.has(id)))
    const status = completed ? 'completed' : 'unlocked'
    cache.set(eraId, status)
    return status
  }
  return (eras || []).map((era) => ({ eraId: era.id, status: resolve(era.id) }))
}
