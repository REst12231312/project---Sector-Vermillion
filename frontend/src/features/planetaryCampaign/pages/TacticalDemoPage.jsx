import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TacticalMap from '../components/TacticalMap'
import OrderPanel from '../components/OrderPanel'
import OrderList from '../components/OrderList'
import BattleAnimation from '../components/BattleAnimation'
import BattleResults from '../components/BattleResults'
import MissionObjectivePanel from '../components/MissionObjectivePanel'
import MissionResultScreen from '../components/MissionResultScreen'
import TacticalOperationHud from '../components/TacticalOperationHud'
import { missionById } from '../data/missions'
import { territoryById } from '../data/territories'
import { planetEraConfigs } from '../data/planetEras'
import { getProgress } from '../../../utils/gameProgress'
import { campaignLevels } from '../../../data/imperiumCampaign'
import { buildEraUnlockContext, getPlanetEraLedger, loadEraProgress, saveEraProgress } from '../engine/eraProgress'
import { recordReplayResult } from '../engine/replaySession'
import { resolveEraStatuses } from '../engine/unlockResolver'
import { createMissionBattleState, createMissionSetup } from '../engine/missionEngine'
import UnavailableEra from '../components/UnavailableEra'
import { appendOperationContext, readOperationCampaignContext } from '../integration/campaignNavigation'
import { isOperationCampaignCompleted, loadOperationProgress, recordOperationMissionResult, saveOperationProgress } from '../integration/campaignProgressAdapter'
import { completeTacticalCampaign } from '../integration/campaignRewardAdapter'
import { beginTerritoryMission, getTerritoryMissionStatuses, loadTerritoryProgress, recordTerritoryMissionResult, saveTerritoryProgress } from '../engine/territoryProgress'
import { assignOrder, cancelOrder, confirmOrders, makeMoveOrder, returnToPlanning } from '../engine/orderPlanning'
import { getReachableMoves } from '../engine/pathfinding'
import { hasLineOfSight, manhattanDistance } from '../engine/lineOfSight'
import { resolveRound as resolveTacticalRound, startNextRound } from '../engine/battleEngine'
import { BATTLE_CONFIG } from '../engine/battleConfig'
import '../styles/tacticalMap.css'
import '../styles/operationHud.css'

const terrainLegend = [['plain', 'Равнина'], ['obstacle', 'Препятствие'], ['cover', 'Укрытие'], ['objective', 'Объект']]

export default function TacticalDemoPage() {
  const [searchParams] = useSearchParams()
  const campaignContext = readOperationCampaignContext(searchParams)
  const missionConfig = missionById[searchParams.get('mission')] || missionById['terra-north-capture']
  const isReplay = searchParams.get('replay') === '1'
  const replaySessionId = searchParams.get('replaySession')
  const eraConfigs = planetEraConfigs.filter((era) => era.planetId === missionConfig.planetId)
  const progressByEra = Object.fromEntries(eraConfigs.map((era) => [era.id, loadTerritoryProgress(undefined, undefined, { planetId: era.planetId, eraId: era.id })]))
  const context = buildEraUnlockContext(getProgress(), progressByEra, Object.values(territoryById), eraConfigs)
  const eraStatus = resolveEraStatuses(eraConfigs, context).find((entry) => entry.eraId === missionConfig.eraId)?.status || 'hidden'
  const progress = progressByEra[missionConfig.eraId]
  const territory = territoryById[missionConfig.territoryId]
  const missionStatus = territory && progress ? getTerritoryMissionStatuses(territory, progress).find((entry) => entry.missionId === missionConfig.id)?.status : null
  const replayLedger = isReplay ? getPlanetEraLedger(loadEraProgress(), missionConfig.planetId).eras?.[missionConfig.eraId]?.replaySessions?.[replaySessionId] : null
  const replayValid = !isReplay || Boolean(replaySessionId && replayLedger?.missionId === missionConfig.id && missionStatus === 'completed')
  const campaignMissionAvailable = isReplay || ['available', 'in_progress'].includes(missionStatus)
  if (campaignContext.error || (campaignContext.operation && (campaignContext.operation.planetId !== missionConfig.planetId || campaignContext.operation.eraId !== missionConfig.eraId)) || eraStatus === 'hidden' || !replayValid || !territory || !campaignMissionAvailable) return <UnavailableEra planetId={missionConfig.planetId} message={campaignContext.error || undefined} />
  return <TacticalMissionPage key={`${missionConfig.id}:${isReplay ? replaySessionId : 'campaign'}`} missionConfig={missionConfig} isReplay={isReplay} replaySessionId={replaySessionId} operationContext={campaignContext.operation} returnPath={campaignContext.returnPath} />
}

function initializeMission(missionConfig, isReplay, replaySessionId) {
  const scope = { planetId: missionConfig.planetId, eraId: missionConfig.eraId }
  const territoryProgress = loadTerritoryProgress(undefined, undefined, scope)
  if (isReplay) {
    const setup = { ...createMissionSetup(missionConfig), battleId: `battle-${replaySessionId}-${Date.now()}` }
    return { battle: createMissionBattleState(missionConfig, setup), progress: territoryProgress }
  }
  const prepared = beginTerritoryMission(territoryProgress, missionConfig)
  const savedProgress = saveTerritoryProgress(prepared.progress, undefined, undefined, scope)
  return { battle: createMissionBattleState(missionConfig, prepared.setup), progress: savedProgress }
}

function TacticalMissionPage({ missionConfig, isReplay = false, replaySessionId = null, operationContext = null, returnPath = '/campaign' }) {
  const territory = territoryById[missionConfig.territoryId]
  const [initialState] = React.useState(() => initializeMission(missionConfig, isReplay, replaySessionId))
  const firstCompletion = !initialState.progress.completedMissionIds.includes(missionConfig.id)
  const [battle, setBattle] = React.useState(initialState.battle)
  const [territoryProgress, setTerritoryProgress] = React.useState(initialState.progress)
  const [pilotCampaignComplete, setPilotCampaignComplete] = React.useState(() => operationContext ? isOperationCampaignCompleted(loadOperationProgress(), operationContext.operationId) : false)
  const [campaignSync, setCampaignSync] = React.useState({ status: 'idle', report: null, error: '' })
  const [selectedCell, setSelectedCell] = React.useState(null)
  const [selectedUnitId, setSelectedUnitId] = React.useState(initialState.battle.units.find((unit) => unit.side === 'player')?.id || null)
  const [selectedObjectId, setSelectedObjectId] = React.useState(null)
  const [mode, setMode] = React.useState(null)
  const [notice, setNotice] = React.useState('')
  const [playback, setPlayback] = React.useState(null)
  const [animationUnits, setAnimationUnits] = React.useState(null)
  const [animationObjects, setAnimationObjects] = React.useState(null)
  const [activeEvent, setActiveEvent] = React.useState(null)
  const units = battle.units
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) || null
  const selectedAlly = selectedUnit?.side === 'player' && selectedUnit.hp > 0 ? selectedUnit : null
  const selectedOrder = battle.playerOrders.find((order) => order.unitId === selectedAlly?.id)
  const confirmed = battle.planningStatus === 'confirmed'
  const resolving = Boolean(playback)
  const displayedUnits = animationUnits || units
  const strategicObjects = battle.strategicObjects || []
  const displayedObjects = animationObjects || strategicObjects
  const livingEnemies = units.filter((unit) => unit.side === 'enemy' && unit.hp > 0 && unit.status !== 'destroyed')
  const losBlockers = strategicObjects.filter((object) => object.hp > 0 && object.blocksLineOfSight)
  const targetableUnitIds = mode === 'attack' && selectedAlly ? livingEnemies.filter((enemy) => manhattanDistance(selectedAlly, enemy) <= selectedAlly.attackRange && hasLineOfSight(battle.map, selectedAlly, enemy, losBlockers)).map((enemy) => enemy.id) : []
  const targetableObjectIds = mode === 'attack' && selectedAlly ? strategicObjects.filter((object) => object.side !== 'player' && object.hp > 0 && manhattanDistance(selectedAlly, object) <= selectedAlly.attackRange && hasLineOfSight(battle.map, selectedAlly, object, losBlockers.filter((blocker) => blocker.id !== object.id))).map((object) => object.id) : []
  const movementBlockers = strategicObjects.filter((object) => object.hp > 0 && object.blocksMovement)
  const reachable = mode === 'move' && selectedAlly ? getReachableMoves(battle.map, units, selectedAlly, selectedAlly.moveRange, movementBlockers).map((move) => move.position) : []
  const orderTarget = selectedOrder?.type === 'attack' ? units.find((unit) => unit.id === selectedOrder.targetUnitId) || strategicObjects.find((object) => object.id === selectedOrder.targetObjectId) : null
  const orderTargetingSelectedUnit = selectedUnit?.side === 'enemy' ? battle.playerOrders.find((order) => order.type === 'attack' && order.targetUnitId === selectedUnit.id) : null
  const orderTargetingSelectedObject = selectedObjectId ? battle.playerOrders.find((order) => order.type === 'attack' && order.targetObjectId === selectedObjectId) : null
  const attackingUnit = (orderTargetingSelectedUnit || orderTargetingSelectedObject) ? units.find((unit) => unit.id === (orderTargetingSelectedUnit || orderTargetingSelectedObject).unitId) : null
  const rangePreview = selectedUnit && selectedCell ? { distance: selectedOrder?.type === 'attack' && orderTarget ? manhattanDistance(selectedUnit, orderTarget) : manhattanDistance(selectedUnit, selectedCell) } : null

  async function syncCompletedCampaign(progress = territoryProgress) {
    if (!operationContext) return
    setCampaignSync({ status: 'syncing', report: null, error: '' })
    try {
      const report = await completeTacticalCampaign(operationContext.operationId, progress)
      setCampaignSync({ status: 'saved', report, error: '' })
    } catch (error) {
      setCampaignSync({ status: 'error', report: null, error: error.message || 'Не удалось сохранить награду. Проверь соединение и повтори синхронизацию.' })
    }
  }

  React.useEffect(() => {
    if (!playback) return undefined
    if (playback.index >= playback.events.length) {
      const finishTimer = window.setTimeout(() => { setBattle(playback.nextState); setPlayback(null); setAnimationUnits(null); setAnimationObjects(null); setActiveEvent(null) }, 260)
      return () => window.clearTimeout(finishTimer)
    }
    const event = playback.events[playback.index]
    setActiveEvent(event)
    if (event.type === 'unit_moved') setAnimationUnits((current) => current?.map((unit) => unit.id === event.unitIds[0] ? { ...unit, ...event.data.to } : unit))
    if (event.type === 'damage_dealt') setAnimationUnits((current) => current?.map((unit) => unit.id === event.data.targetId ? { ...unit, hp: Math.max(0, unit.hp - event.data.damage) } : unit))
    if (event.type === 'unit_destroyed') setAnimationUnits((current) => current?.map((unit) => unit.id === event.unitIds[0] ? { ...unit, hp: 0, status: 'destroyed' } : unit))
    if (event.type === 'damage_dealt' && event.data.targetType === 'object') setAnimationObjects((current) => current?.map((object) => object.id === event.data.targetObjectId ? { ...object, hp: Math.max(0, object.hp - event.data.damage) } : object))
    if (event.type === 'objective_destroyed') setAnimationObjects((current) => current?.map((object) => object.id === event.unitIds[0] ? { ...object, hp: 0, status: 'destroyed' } : object))
    const duration = event.type === 'unit_moved' ? BATTLE_CONFIG.animationStepMs : event.type === 'attack_performed' ? BATTLE_CONFIG.attackEffectMs : 150
    const timer = window.setTimeout(() => setPlayback((current) => current ? { ...current, index: current.index + 1 } : current), duration)
    return () => window.clearTimeout(timer)
  }, [playback])

  function showErrors(errors) { setNotice(errors.join(' ')) }

  function chooseUnit(unit) {
    if (confirmed || battle.phase !== 'planning') return
    if (unit.side === 'enemy') {
      if (mode === 'attack' && selectedAlly) {
        const result = assignOrder(battle, { unitId: selectedAlly.id, type: 'attack', targetUnitId: unit.id })
        if (result.errors.length) showErrors(result.errors)
        else { setBattle(result.battle); setNotice(`Атака запланирована: ${unit.name}. Урон будет рассчитан при выполнении.`); setMode(null) }
      } else {
        setSelectedUnitId(unit.id)
        setSelectedObjectId(null)
        setMode(null)
        setNotice('Просмотр характеристик противника. Вражеские отряды нельзя управлять.')
      }
      setSelectedCell({ x: unit.x, y: unit.y, type: battle.map.cells[unit.y * battle.map.width + unit.x].type })
      return
    }
    if (unit.hp <= 0 || unit.status === 'destroyed') { setNotice('Уничтоженным подразделением нельзя управлять.'); return }
    setSelectedUnitId(unit.id)
    setSelectedObjectId(null)
    setSelectedCell({ x: unit.x, y: unit.y, type: battle.map.cells[unit.y * battle.map.width + unit.x].type })
    setMode(null)
    setNotice('')
  }

  function chooseObject(object) {
    if (confirmed || battle.phase !== 'planning') return
    if (mode === 'attack' && selectedAlly && object.side !== 'player') {
      const result = assignOrder(battle, { unitId: selectedAlly.id, type: 'attack', targetObjectId: object.id })
      if (result.errors.length) showErrors(result.errors)
      else { setBattle(result.battle); setNotice(`Атака запланирована: ${object.name}. Урон будет рассчитан при выполнении.`); setMode(null) }
    } else {
      setSelectedObjectId(object.id)
      setSelectedUnitId(null)
      setSelectedCell({ x: object.x, y: object.y, type: battle.map.cells[object.y * battle.map.width + object.x].type })
      setMode(null)
      setNotice('Просмотр стратегического объекта.')
    }
  }

  function selectCell(cell) {
    if (confirmed || battle.phase !== 'planning') return
    setSelectedCell({ x: cell.x, y: cell.y, type: cell.type })
    if (mode !== 'move' || !selectedAlly) return
    const result = makeMoveOrder(battle, selectedAlly.id, { x: cell.x, y: cell.y })
    if (result.errors.length) { showErrors(result.errors); return }
    const assigned = assignOrder(battle, result.order)
    if (assigned.errors.length) { showErrors(assigned.errors); return }
    setBattle(assigned.battle)
    setMode(null)
    setNotice(`Маршрут запланирован: ${result.order.path.length - 1} переходов. Перемещение пока не выполняется.`)
  }

  function setSimpleOrder(type) {
    if (!selectedAlly || confirmed || battle.phase !== 'planning') return
    const result = assignOrder(battle, { unitId: selectedAlly.id, type })
    if (result.errors.length) { showErrors(result.errors); return }
    setBattle(result.battle)
    setMode(null)
    setNotice(type === 'defend' ? 'Оборона запланирована. Боевой эффект на этом этапе не применяется.' : 'Удержание позиции запланировано.')
  }

  function confirmRound() {
    const result = confirmOrders(battle)
    if (!result.ok) { showErrors(result.errors); return }
    setBattle(result.battle)
    setMode(null)
    setNotice('Приказы подтверждены. Ожидание выполнения раунда.')
  }

  function executeRound() {
    if (!confirmed || battle.phase !== 'planning' || resolving) return
    const result = resolveTacticalRound({ battleState: battle })
    if (!result.ok) { showErrors(result.errors); return }
    let savedProgress = territoryProgress
    if (result.nextState.phase === 'finished') {
      if (isReplay) {
        const ledger = loadEraProgress()
        const updatedLedger = recordReplayResult(ledger, replaySessionId, {
          battleId: result.nextState.battleId, planetId: missionConfig.planetId, eraId: missionConfig.eraId, territoryId: territory.id,
          missionId: missionConfig.id, outcome: result.nextState.missionOutcome, rounds: result.nextState.round,
          survivingUnits: result.nextState.units.filter((unit) => unit.side === 'player' && unit.hp > 0).map((unit) => ({ id: unit.id, name: unit.name, hp: unit.hp, maxHp: unit.maxHp })),
          strategicObjects: result.nextState.strategicObjects.map((object) => ({ id: object.id, name: object.name, hp: object.hp, maxHp: object.maxHp, status: object.status })),
        })
        saveEraProgress(updatedLedger)
      } else {
        savedProgress = saveTerritoryProgress(recordTerritoryMissionResult(territoryProgress, territory, missionConfig, result.nextState), undefined, undefined, { planetId: missionConfig.planetId, eraId: missionConfig.eraId })
        setTerritoryProgress(savedProgress)
        if (operationContext) {
          const era = planetEraConfigs.find((entry) => entry.id === operationContext.eraId && entry.planetId === operationContext.planetId)
          const lastResult = savedProgress.history[savedProgress.history.length - 1]
          const currentOperationProgress = loadOperationProgress()
          const updatedOperationProgress = recordOperationMissionResult(currentOperationProgress, operationContext.operationId, era?.requiredMissionIds || [], {
            resultId: lastResult?.id,
            missionId: missionConfig.id,
            outcome: result.nextState.missionOutcome,
            rounds: result.nextState.round,
            recordedAt: lastResult?.completedAt,
          })
          const storedOperationProgress = saveOperationProgress(updatedOperationProgress)
          const completed = isOperationCampaignCompleted(storedOperationProgress, operationContext.operationId)
          setPilotCampaignComplete(completed)
          if (completed) syncCompletedCampaign(savedProgress)
        }
      }
    }
    setNotice('')
    setAnimationUnits(battle.units.map((unit) => ({ ...unit })))
    setAnimationObjects((battle.strategicObjects || []).map((object) => ({ ...object })))
    setPlayback({ events: result.events, nextState: result.nextState, index: 0 })
    setBattle({ ...result.nextState, phase: 'resolving' })
  }

  function skipAnimation() {
    if (!playback) return
    setBattle(playback.nextState)
    setPlayback(null)
    setAnimationUnits(null)
    setAnimationObjects(null)
    setActiveEvent(null)
  }

  function proceedToNextRound() {
    const result = startNextRound(battle)
    if (!result.ok) { showErrors(result.errors); return }
    setBattle(result.nextState)
    const nextAlly = result.nextState.units.find((unit) => unit.side === 'player' && unit.hp > 0)
    setSelectedUnitId(nextAlly?.id || null)
    setSelectedCell(nextAlly ? { x: nextAlly.x, y: nextAlly.y, type: result.nextState.map.cells[nextAlly.y * result.nextState.map.width + nextAlly.x].type } : null)
    setMode(null)
    setNotice('')
  }

  function retryMission() {
    if (isReplay) {
      const setup = { ...createMissionSetup(missionConfig), battleId: `battle-${replaySessionId}-${Date.now()}` }
      const nextBattle = createMissionBattleState(missionConfig, setup)
      setBattle(nextBattle)
      setSelectedUnitId(nextBattle.units.find((unit) => unit.side === 'player')?.id || null)
      setSelectedObjectId(null)
      setSelectedCell(null)
      setMode(null)
      setNotice('')
      return
    }
    const prepared = beginTerritoryMission(territoryProgress, missionConfig)
    const saved = saveTerritoryProgress(prepared.progress, undefined, undefined, { planetId: missionConfig.planetId, eraId: missionConfig.eraId })
    const nextBattle = createMissionBattleState(missionConfig, prepared.setup)
    setTerritoryProgress(saved)
    setBattle(nextBattle)
    setSelectedUnitId(nextBattle.units.find((unit) => unit.side === 'player')?.id || null)
    setSelectedObjectId(null)
    setSelectedCell(null)
    setMode(null)
    setNotice('')
  }

  const objective = missionConfig.objectives.find((item) => item.type === 'capture_point') || null
  const territoryStatuses = getTerritoryMissionStatuses(territory, territoryProgress)
  const currentMissionIndex = territory.missions.indexOf(missionConfig.id)
  const nextMissionStatus = territoryStatuses.find((item) => item.missionId === territory.missions[currentMissionIndex + 1])
  const nextMission = !isReplay && battle.missionOutcome === 'victory' && nextMissionStatus?.status === 'available' ? missionById[nextMissionStatus.missionId] : null
  const selectedObject = strategicObjects.find((object) => object.id === selectedObjectId)
  const campaignEra = planetEraConfigs.find((era) => era.planetId === missionConfig.planetId && era.id === missionConfig.eraId)
  const operationMissionIds = operationContext ? campaignEra?.requiredMissionIds || [] : territory.missions
  const operationStep = Math.max(1, operationMissionIds.indexOf(missionConfig.id) + 1)
  const operationTitle = campaignLevels.find((entry) => entry.id === operationContext?.operationId)?.title || territory.name
  const phaseLabel = resolving ? 'ВЫПОЛНЕНИЕ' : confirmed ? 'ПРИКАЗЫ ГОТОВЫ' : battle.phase === 'results' ? 'ИТОГИ РАУНДА' : battle.phase === 'finished' ? 'ОПЕРАЦИЯ ЗАВЕРШЕНА' : 'ПЛАНИРОВАНИЕ'

  return <main className="tactical-demo">
    <header className="tactical-header">
      <Link className="tactical-back" to={`/planets/${territory.planetId}/eras/${territory.eraId}?territory=${territory.id}${appendOperationContext(new URLSearchParams(), operationContext, returnPath)}`}>← Планетарная карта · {territory.name}</Link>
      <TacticalOperationHud mission={missionConfig} territory={territory} battle={battle} operationTitle={operationTitle} operationStep={operationStep} operationTotal={operationMissionIds.length} phaseLabel={phaseLabel} />
      <p className="tactical-briefing">{missionConfig.story}</p>
    </header>
    <div className="tactical-workspace">
      <section className="tactical-board-panel" aria-label="Тактическая карта">
        <div className="tactical-board-caption"><span>СЕКТОР · {territory.planetName.toUpperCase()}</span><span>12 × 12 · {battle.map.cells.length} КЛЕТОК</span></div>
        <TacticalMap map={battle.map} units={displayedUnits} strategicObjects={displayedObjects} selectedObjectId={selectedObjectId} onSelectObject={chooseObject} selectedCell={selectedCell} selectedUnitId={selectedAlly?.id} onSelectCell={selectCell} onSelectUnit={chooseUnit} reachableCells={resolving ? [] : reachable} targetableUnitIds={resolving ? [] : targetableUnitIds} targetableObjectIds={resolving ? [] : targetableObjectIds} missionObjective={objective} missionProgress={battle.missionProgress} orders={battle.roundOrders ? [...battle.roundOrders.player, ...battle.roundOrders.enemy] : [...battle.playerOrders, ...battle.enemyOrders]} activeEvent={activeEvent} />
        <div className="tactical-legend" aria-label="Легенда карты">{terrainLegend.map(([type, title]) => <span key={type}><i className={`legend-swatch terrain-${type}`} />{title}</span>)}<span><i className="legend-swatch legend-objective-target"/>Основная цель</span></div>
      </section>
      <aside className="tactical-side-panel">
        <MissionObjectivePanel mission={missionConfig} battle={battle} />
        {battle.phase === 'planning' && (selectedObject ? <section className="tactical-info-card"><p className="tactical-card-kicker">СТРАТЕГИЧЕСКИЙ ОБЪЕКТ · ПРОСМОТР</p><h2>{selectedObject.name}</h2><div className="tactical-hp"><span>СОСТОЯНИЕ ЦЕЛИ</span><b>{selectedObject.hp > 0 ? `${selectedObject.hp}/${selectedObject.maxHp} HP` : 'УНИЧТОЖЕН'}</b><i><em style={{ width: `${Math.max(0, 100 * selectedObject.hp / selectedObject.maxHp)}%` }} /></i></div><dl className="tactical-stats"><div><dt>Броня</dt><dd>{selectedObject.armor}</dd></div><div><dt>Позиция</dt><dd>{selectedObject.x}, {selectedObject.y}</dd></div></dl>{attackingUnit && <p className="tactical-hint">Цель приказа «{attackingUnit.name}» · расстояние {manhattanDistance(attackingUnit, selectedObject)}.</p>}</section> : selectedUnit?.side === 'enemy' ? <section className="tactical-info-card"><p className="tactical-card-kicker">ПРОТИВНИК · ПРОСМОТР</p><h2>{selectedUnit.name}</h2><div className="tactical-hp"><span>ИЗВЕСТНОЕ СОСТОЯНИЕ</span><b>{selectedUnit.hp} / {selectedUnit.maxHp} HP</b></div><dl className="tactical-stats"><div><dt>Атака</dt><dd>{selectedUnit.attack}</dd></div><div><dt>Броня</dt><dd>{selectedUnit.armor}</dd></div><div><dt>Дальность атаки</dt><dd>{selectedUnit.attackRange}</dd></div><div><dt>Позиция</dt><dd>{selectedUnit.x}, {selectedUnit.y}</dd></div></dl>{attackingUnit && <p className="tactical-hint">Цель приказа отряда «{attackingUnit.name}» · расстояние {manhattanDistance(attackingUnit, selectedUnit)}.</p>}</section> : <OrderPanel unit={selectedAlly} order={selectedOrder} mode={mode} setMode={(nextMode) => { setMode(nextMode); setNotice('') }} onDefend={() => setSimpleOrder('defend')} onHold={() => setSimpleOrder('hold')} onCancel={() => { setBattle(cancelOrder(battle, selectedAlly.id)); setMode(null); setNotice('Приказ отменён.') }} disabled={confirmed || resolving} target={orderTarget} rangePreview={rangePreview} />)}
        {battle.phase === 'planning' && <section className="tactical-info-card tactical-cell-info"><p className="tactical-card-kicker">ВЫБРАННАЯ КЛЕТКА</p>{selectedCell ? <><h2>{selectedCell.x}, {selectedCell.y}</h2><p className="tactical-panel-copy">{({ plain: 'Равнина', obstacle: 'Непроходимое препятствие', cover: 'Укрытие', objective: 'Стратегический объект' })[selectedCell.type]}</p></> : <p className="tactical-panel-copy">Выберите клетку, отряд или объект.</p>}</section>}
        {battle.phase === 'planning' && <OrderList units={units} orders={battle.playerOrders} selectedUnitId={selectedAlly?.id} onSelectUnit={chooseUnit} disabled={confirmed || resolving} />}
        {notice && <p className={`tactical-notice${notice.includes('заблок') || notice.includes('Конфликт') || notice.includes('нельзя') || notice.includes('не найден') ? ' is-error' : ''}`} role="status">{notice}</p>}
        {battle.phase === 'planning' && (confirmed ? <section className="tactical-confirmed"><b>Приказы подтверждены. Ожидание выполнения раунда.</b><button type="button" disabled={resolving} onClick={() => { setBattle(returnToPlanning(battle)); setNotice('Планирование возобновлено. Назначенные приказы сохранены.') }}>Вернуться к планированию</button><button type="button" disabled={resolving} onClick={executeRound}>Выполнить раунд</button></section> : <button type="button" className="tactical-confirm-button" onClick={confirmRound}>Подтвердить приказы <span>→</span></button>)}
        {resolving && <BattleAnimation activeEvent={activeEvent} onSkip={skipAnimation} />}
        {!resolving && battle.phase === 'results' && <BattleResults summary={battle.roundSummary} onNextRound={proceedToNextRound} />}
        {!resolving && battle.phase === 'finished' && <MissionResultScreen mission={missionConfig} battle={battle} territory={territory} nextMission={nextMission} territoryControl={territoryProgress.territoryControls?.[territory.id] || territoryProgress.territoryControl} completedCount={territoryStatuses.filter((item) => item.status === 'completed').length} firstCompletion={firstCompletion && !isReplay} isReplay={isReplay} onRetry={retryMission} operationContext={operationContext} returnPath={returnPath} pilotCampaignComplete={pilotCampaignComplete} campaignSync={campaignSync} onRetryCampaignSync={() => syncCompletedCampaign()} />}
      </aside>
    </div>
    <p className="tactical-readonly-note tactical-footer-note">ПЛАНИРОВАНИЕ · ПРИКАЗЫ ВЫПОЛНЯЮТСЯ ОДНОВРЕМЕННО</p>
  </main>
}
