import { getPlanetEraLedger } from './eraProgress'

export function beginReplaySession(progress, { planetId, eraId, territoryId, missionId }, sessionId) {
  const planetLedger = getPlanetEraLedger(progress, planetId)
  const eraLedger = planetLedger.eras?.[eraId] || { replaySessions: {} }
  const replaySessions = { ...(eraLedger.replaySessions || {}) }
  const id = sessionId || `replay-${missionId}-${Object.keys(replaySessions).length + 1}`
  const session = { id, planetId, eraId, territoryId, missionId, status: 'active', results: [], startedAt: new Date().toISOString() }
  const nextPlanetLedger = { ...planetLedger, eras: { ...planetLedger.eras, [eraId]: { ...eraLedger, replaySessions: { ...replaySessions, [id]: session } } } }
  return { progress: { ...progress, planets: { ...progress.planets, [planetId]: nextPlanetLedger } }, session }
}

export function recordReplayResult(progress, sessionId, result) {
  if (!sessionId || !result?.battleId) return progress
  const planetLedger = getPlanetEraLedger(progress, result.planetId)
  const eraLedger = planetLedger.eras?.[result.eraId]
  const session = eraLedger?.replaySessions?.[sessionId]
  if (!session || session.missionId !== result.missionId || session.results.some((entry) => entry.battleId === result.battleId)) return progress
  const updated = { ...session, status: 'completed', results: [...session.results, { ...result, recordedAt: new Date().toISOString() }] }
  return {
    ...progress,
    planets: { ...progress.planets, [result.planetId]: {
      ...planetLedger,
      eras: { ...planetLedger.eras, [result.eraId]: { ...eraLedger, replaySessions: { ...eraLedger.replaySessions, [sessionId]: updated } } },
    } },
  }
}
