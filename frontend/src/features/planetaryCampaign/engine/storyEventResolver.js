function triggerMet(trigger, context) {
  if (!trigger) return false
  if (trigger.type === 'mission_completed') return (context.completedMissionIds || []).includes(trigger.missionId)
  if (trigger.type === 'territory_completed') return (context.completedTerritoryIds || []).includes(trigger.territoryId)
  if (trigger.type === 'era_completed') return (context.completedEraIds || []).includes(trigger.eraId)
  if (trigger.type === 'dossier_unlocked') return (context.unlockedDossierIds || []).includes(trigger.dossierId)
  return false
}

export function resolveStoryEvents(events, context = {}, firedEventIds = []) {
  const fired = new Set(firedEventIds)
  const firedEvents = []
  const actions = []
  for (const event of events || []) {
    if (!event?.id || fired.has(event.id) || !triggerMet(event.trigger, context)) continue
    fired.add(event.id)
    firedEvents.push(event.id)
    actions.push(...(event.actions || []).map((action) => ({ ...action, sourceEventId: event.id })))
  }
  return { firedEventIds: [...fired], firedEvents, actions }
}
