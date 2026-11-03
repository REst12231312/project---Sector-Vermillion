import React from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { missionById } from '../data/missions'
import { planetById } from '../data/planets'
import { planetEraConfigs } from '../data/planetEras'
import { storyEvents } from '../data/storyEvents'
import { territoryConfigs } from '../data/territories'
import { terraMap } from '../data/terraMap'
import { terraSiegeMap } from '../data/terraSiegeMap'
import { getProgress } from '../../../utils/gameProgress'
import { beginTerritoryMission, loadTerritoryProgress, saveTerritoryProgress } from '../engine/territoryProgress'
import { acknowledgeEraNotification, buildEraUnlockContext, getPlanetEraLedger, loadEraProgress, reconcileEraProgress, saveEraProgress } from '../engine/eraProgress'
import { beginReplaySession } from '../engine/replaySession'
import { resolveEraStatuses } from '../engine/unlockResolver'
import { resolveFrontlines, resolveTerritoryMapState } from '../engine/territoryMapState'
import usePlanetCamera from '../hooks/usePlanetCamera'
import PlanetMap from '../components/PlanetMap'
import PlanetMapControls from '../components/PlanetMapControls'
import TerritoryInfoPanel from '../components/TerritoryInfoPanel'
import EraArchive from '../components/EraArchive'
import EraUnlockModal from '../components/EraUnlockModal'
import PlanetCampaignHud from '../components/PlanetCampaignHud'
import UnavailableEra from '../components/UnavailableEra'
import { readOperationCampaignContext } from '../integration/campaignNavigation'
import { isOperationCampaignCompleted, loadOperationProgress } from '../integration/campaignProgressAdapter'
import { completeTacticalCampaign } from '../integration/campaignRewardAdapter'
import CampaignCompletion from '../components/CampaignCompletion'
import { campaignLevels } from '../../../data/imperiumCampaign'
import '../styles/tacticalMap.css'
import '../styles/planetMap.css'
import '../styles/planetMapRedesign.css'

const mapById = { 'terra-unification': terraMap, 'terra-siege': terraSiegeMap }

export default function PlanetCampaignPage() {
  const routeParams = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestedPlanetId = routeParams.planetId || searchParams.get('planet') || 'terra'
  const planet = planetById[requestedPlanetId]
  const eras = planetEraConfigs.filter((era) => era.planetId === requestedPlanetId)
  const requestedEraId = routeParams.eraId || searchParams.get('era') || planet?.defaultEraId
  const campaignContext = readOperationCampaignContext(searchParams)
  const [storyProgress, setStoryProgress] = React.useState(getProgress)
  const [eraLedger, setEraLedger] = React.useState(() => loadEraProgress())
  const progressByEra = React.useMemo(() => Object.fromEntries(eras.map((era) => [
    era.id,
    loadTerritoryProgress(undefined, undefined, { planetId: requestedPlanetId, eraId: era.id }),
  ])), [eras, requestedPlanetId])
  const unlockContext = React.useMemo(() => buildEraUnlockContext(storyProgress, progressByEra, territoryConfigs, eras), [storyProgress, progressByEra, eras])
  const eraStatuses = React.useMemo(() => resolveEraStatuses(eras, unlockContext), [eras, unlockContext])
  const planetEvents = storyEvents.filter((event) => event.planetId === requestedPlanetId)
  const reconciliation = React.useMemo(() => reconcileEraProgress(eraLedger, { planetId: requestedPlanetId, eraStatuses, eras, storyEvents: planetEvents, unlockContext }), [eraLedger, requestedPlanetId, eraStatuses, eras, planetEvents, unlockContext])
  const selectedEraStatus = eraStatuses.find((item) => item.eraId === requestedEraId)?.status || 'hidden'

  React.useEffect(() => {
    const updateProgress = (event) => setStoryProgress(event.detail || getProgress())
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  React.useEffect(() => {
    if (!reconciliation.changed) return
    const saved = saveEraProgress(reconciliation.progress)
    setEraLedger(saved)
  }, [reconciliation])

  if (campaignContext.error) return <UnavailableEra planetId={requestedPlanetId} message={campaignContext.error} />
  if (!planet || selectedEraStatus === 'hidden') return <UnavailableEra planetId={requestedPlanetId} />

  const era = eras.find((entry) => entry.id === requestedEraId)
  if (!era || !mapById[era.mapId]) return <UnavailableEra planetId={requestedPlanetId} />
  const pendingNotificationId = getPlanetEraLedger(eraLedger, requestedPlanetId).pendingEraNotifications.find((id) => eraStatuses.some((item) => item.eraId === id && item.status !== 'hidden'))
  const pendingNotification = eras.find((item) => item.id === pendingNotificationId) || null

  function acknowledgeNotification(eraId) {
    const updated = saveEraProgress(acknowledgeEraNotification(eraLedger, requestedPlanetId, eraId))
    setEraLedger(updated)
  }

  function enterNewEra() {
    if (!pendingNotification) return
    acknowledgeNotification(pendingNotification.id)
    const firstTerritory = territoryConfigs.find((entry) => pendingNotification.territoryIds.includes(entry.id))
    navigate(`/planets/${planet.id}/eras/${pendingNotification.id}${firstTerritory ? `?territory=${encodeURIComponent(firstTerritory.id)}` : ''}`)
  }

  if (campaignContext.operation && (campaignContext.operation.planetId !== planet.id || campaignContext.operation.eraId !== era.id)) return <UnavailableEra planetId={requestedPlanetId} message="Параметры операции не соответствуют выбранной кампании." />

  return <>
    <EraCampaignPage key={`${planet.id}:${era.id}`} planet={planet} era={era} eraStatus={selectedEraStatus} eraStatuses={eraStatuses} eras={eras} progressByEra={progressByEra} eraLedger={eraLedger} setEraLedger={setEraLedger} searchParams={searchParams} setSearchParams={setSearchParams} navigate={navigate} operationContext={campaignContext.operation} returnPath={campaignContext.returnPath} />
    {pendingNotification && <EraUnlockModal planet={planet} era={pendingNotification} onEnter={enterNewEra} onClose={() => acknowledgeNotification(pendingNotification.id)} />}
  </>
}

function EraCampaignPage({ planet, era, eraStatus, eraStatuses, eras, progressByEra, eraLedger, setEraLedger, searchParams, setSearchParams, navigate, operationContext, returnPath }) {
  const map = mapById[era.mapId]
  const campaignOperation = campaignLevels.find((entry) => entry.id === operationContext?.operationId)
  const territoryList = territoryConfigs.filter((territory) => era.territoryIds.includes(territory.id))
  const [selectedId, setSelectedId] = React.useState(() => map.regions.some((region) => region.id === searchParams.get('territory')) ? searchParams.get('territory') : null)
  const [selectedMissionId, setSelectedMissionId] = React.useState(() => {
    const id = searchParams.get('mission')
    return territoryList.some((territory) => territory.missions.includes(id)) ? id : null
  })
  const [hoveredId, setHoveredId] = React.useState(null)
  const [progress, setProgress] = React.useState(() => loadTerritoryProgress(undefined, undefined, { planetId: planet.id, eraId: era.id }))
  const [campaignSync, setCampaignSync] = React.useState({ status: 'idle', report: null, error: '' })
  const camera = usePlanetCamera()
  const territories = React.useMemo(() => resolveTerritoryMapState(map.regions, territoryList, missionById, progress), [map, territoryList, progress])
  const frontlines = React.useMemo(() => resolveFrontlines(territories), [territories])
  const selectedTerritory = territories.find((item) => item.id === selectedId) || null
  const hoveredTerritory = territories.find((item) => item.id === hoveredId) || null
  const completedCount = era.requiredMissionIds.filter((id) => progress.completedMissionIds.includes(id)).length
  const needsRewardSync = Boolean(operationContext && isOperationCampaignCompleted(loadOperationProgress(), operationContext.operationId) && !storyOperationSynced(operationContext.operationId))
  const progressForArchive = progressByEra

  function buildCampaignQuery(territoryId = null, missionId = null) {
    const query = new URLSearchParams({ planet: planet.id, era: era.id })
    if (territoryId) query.set('territory', territoryId)
    if (missionId) query.set('mission', missionId)
    if (operationContext) {
      query.set('operationId', operationContext.operationId)
      query.set('planetId', operationContext.planetId)
      query.set('eraId', operationContext.eraId)
      query.set('factionId', operationContext.factionId)
      query.set('returnPath', returnPath)
    }
    return query
  }

  function selectTerritory(region) {
    setSelectedId(region.id)
    setSelectedMissionId(null)
    setSearchParams(buildCampaignQuery(region.id), { replace: true })
  }

  function selectMission(region, missionEntry) {
    setSelectedId(region.id)
    setSelectedMissionId(missionEntry.missionId)
    setSearchParams(buildCampaignQuery(region.id, missionEntry.missionId), { replace: true })
  }

  function closePanel() {
    setSelectedId(null)
    setSelectedMissionId(null)
    setSearchParams(buildCampaignQuery(), { replace: true })
  }

  function launchMission(mission, replay = false) {
    const territory = territoryList.find((entry) => entry.id === mission.territoryId)
    if (!territory || !territory.missions.includes(mission.id)) return
    const status = selectedTerritory?.missionResults.find((entry) => entry.missionId === mission.id)?.status
    if (replay ? status !== 'completed' : !['available', 'in_progress'].includes(status)) return
    const query = new URLSearchParams({ planet: planet.id, era: era.id, territory: territory.id })
    if (replay) {
      const replayStart = beginReplaySession(eraLedger, { planetId: planet.id, eraId: era.id, territoryId: territory.id, missionId: mission.id })
      const savedLedger = saveEraProgress(replayStart.progress)
      setEraLedger(savedLedger)
      query.set('replay', '1')
      query.set('replaySession', replayStart.session.id)
    } else {
      const prepared = beginTerritoryMission(progress, mission)
      setProgress(saveTerritoryProgress(prepared.progress, undefined, undefined, { planetId: planet.id, eraId: era.id }))
    }
      const operationQuery = operationContext ? `&${new URLSearchParams({ operationId: operationContext.operationId, planetId: operationContext.planetId, eraId: operationContext.eraId, factionId: operationContext.factionId, returnPath }).toString()}` : ''
      navigate(`/tactical-demo?mission=${encodeURIComponent(mission.id)}&${query.toString()}${operationQuery}`)
  }

  function storyOperationSynced(operationId) {
    return (getProgress().completedLevels || []).includes(operationId)
  }

  async function retryCampaignSync() {
    setCampaignSync({ status: 'syncing', report: null, error: '' })
    try {
      const report = await completeTacticalCampaign(operationContext.operationId, progress)
      setCampaignSync({ status: 'saved', report, error: '' })
    } catch (error) {
      setCampaignSync({ status: 'error', report: null, error: error.message || 'Не удалось синхронизировать награду.' })
    }
  }

  return <main className="planet-campaign-page">
    <PlanetCampaignHud planet={planet} era={era} operation={campaignOperation} completedMissions={completedCount} totalMissions={era.requiredMissionIds.length} returnPath={returnPath} />
    {needsRewardSync && <CampaignCompletion operationId={operationContext.operationId} returnPath={returnPath} sync={campaignSync} onRetry={retryCampaignSync} />}
    <div className="planet-campaign-layout">
      <section className="planet-map-panel" aria-label={`Карта планеты: ${era.title}`}>
        <div className="planet-map-caption"><span>ПОВЕРХНОСТНАЯ КАРТА · {planet.name.toUpperCase()}</span><span>{era.title.toUpperCase()} · М31</span></div>
        <div ref={camera.frameRef} className="planet-map-frame">
          <PlanetMap map={map} territories={territories} frontlines={frontlines} selectedId={selectedId} selectedMissionId={selectedMissionId} hoveredId={hoveredId} onSelectTerritory={selectTerritory} onSelectMission={selectMission} onHoverTerritory={setHoveredId} camera={camera.camera} isPanning={camera.isPanning} onPointerDown={camera.onPointerDown} onPointerMove={camera.onPointerMove} onPointerUp={camera.onPointerUp} guardClick={camera.onMapClick} onMapBackgroundClick={(event) => { if (!event.target.closest('[data-territory]') && !event.target.closest('.map-mission-marker')) closePanel() }} factionId={operationContext?.factionId || 'imperium'} />
          <PlanetMapControls scale={camera.camera.scale} onZoomIn={() => camera.zoomBy(1.2)} onZoomOut={() => camera.zoomBy(1 / 1.2)} onReset={camera.resetCamera} />
          {hoveredTerritory && hoveredId !== selectedId && <div className="planet-map-tooltip"><b>{hoveredTerritory.name}</b><span>{hoveredTerritory.control === 'enemy' ? 'Под контролем противника' : hoveredTerritory.control === 'player' ? 'Под контролем Империума' : 'Оспаривается'} · {hoveredTerritory.availability === 'locked' ? 'операции не развёрнуты' : hoveredTerritory.availability === 'completed' ? 'кампания завершена' : 'есть доступные задания'}</span></div>}
        </div>
        <div className="planet-map-legend"><span><i className="legend-territory enemy"/>Противник</span><span><i className="legend-territory contested"/>Оспаривается</span><span><i className="legend-territory player"/>Империум</span><span><i className="legend-frontline"/>Линия фронта</span></div>
      </section>
      <TerritoryInfoPanel territory={selectedTerritory} selectedMission={selectedTerritory?.missionResults.find((entry) => entry.missionId === selectedMissionId)} territories={territories} campaignTitle={campaignOperation?.title} objective={campaignOperation?.objective || campaignOperation?.description} planet={planet} era={era} progress={progress} missionById={missionById} onLaunch={(mission) => launchMission(mission)} onReplay={(mission) => launchMission(mission, true)} onClose={closePanel} />
    </div>
    <details className="planet-era-drawer">
      <summary>Хроника Терры <span>Исторические эпохи</span></summary>
      <EraArchive planet={planet} eras={eras} statuses={eraStatuses} progressByEra={progressForArchive} />
    </details>
  </main>
}
