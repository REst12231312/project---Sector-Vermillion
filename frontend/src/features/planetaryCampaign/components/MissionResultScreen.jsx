import React from 'react'
import { Link } from 'react-router-dom'
import CampaignCompletion from './CampaignCompletion'
import { appendOperationContext } from '../integration/campaignNavigation'

const outcomeLabels = { victory: 'Операция завершена', defeat: 'Операция провалена', draw: 'Ничья' }

export default function MissionResultScreen({ mission, battle, territory, territoryControl, completedCount, firstCompletion, nextMission, onRetry, isReplay = false, operationContext = null, returnPath = '/campaign', pilotCampaignComplete = false, campaignSync, onRetryCampaignSync }) {
  const outcome = battle.missionOutcome
  const result = battle.roundSummary
  const target = battle.strategicObjects.find((object) => object.primary) || battle.strategicObjects[0]
  const survivingCount = result?.units.filter((unit) => unit.side === 'player' && unit.hp > 0).length || 0
  const earnedConsequences = firstCompletion ? (mission.onVictoryConsequences || []).filter((item) => !item.requiresSurvivingUnits || survivingCount >= item.requiresSurvivingUnits) : []
  const territoryControlLabels = { enemy: 'под контролем противника', contested: 'оспаривается', player: 'под контролем Империума' }
  const objectiveControlLabels = { enemy: 'противник', contested: 'оспаривается', player: 'Империум' }
  return <section className={`tactical-info-card tactical-mission-result result-${outcome}`}>
    <p className="tactical-card-kicker">{isReplay ? 'ПОВТОРНОЕ ПРОХОЖДЕНИЕ · БЕЗ НАГРАД' : `ОТЧЁТ · ${mission.name}`}</p><h2>{outcomeLabels[outcome] || 'Операция завершена'}</h2>
    <p className="tactical-panel-copy">{mission.story}</p>
    <div className="tactical-result-counts"><span>Раундов <b>{battle.round}</b></span><span>Выжило <b>{survivingCount}</b></span><span>Цель <b>{target ? target.hp > 0 ? `${target.hp}/${target.maxHp} HP` : 'уничтожена' : `контроль ${objectiveControlLabels[battle.missionProgress.control] || 'противник'} · ${battle.missionProgress.captureRounds}/${mission.victoryConditions.captureRounds}`}</b></span></div>
    <p className="territory-result-change">Территория: <b>{territoryControlLabels[territoryControl] || territoryControlLabels.enemy}</b> · завершено операций {completedCount}/{territory.missions.length}</p>
    <div className="tactical-result-hp"><span>ВЫЖИВШИЕ ОТРЯДЫ</span>{(result?.units || []).filter((unit) => unit.side === 'player').map((unit) => <p key={unit.id}><b>{unit.name}</b><span>{unit.hp}/{unit.maxHp} HP</span></p>)}</div>
    {battle.appliedConsequences?.length > 0 && <div className="mission-consequence-note"><span>ПОЛУЧЕНЫ ПОСЛЕДСТВИЯ ПРЕДЫДУЩЕЙ ОПЕРАЦИИ</span>{battle.appliedConsequences.map((item) => <small key={item.id}>{item.description}</small>)}</div>}
    {!isReplay && outcome === 'victory' && earnedConsequences.length > 0 && <div className="mission-consequence-note"><span>БОНУС СЛЕДУЮЩЕЙ ОПЕРАЦИИ</span>{earnedConsequences.map((item) => <small key={item.id}>{item.description}</small>)}</div>}
    {pilotCampaignComplete && operationContext && <CampaignCompletion operationId={operationContext.operationId} returnPath={returnPath} sync={campaignSync} onRetry={onRetryCampaignSync} />}
    <div className="mission-result-actions"><button type="button" onClick={onRetry}>Повторить</button><Link to={`/planets/${territory.planetId}/eras/${territory.eraId}?territory=${territory.id}${appendOperationContext(new URLSearchParams(), operationContext, returnPath)}`}>К планетарной карте</Link>{outcome === 'victory' && nextMission && <Link className="mission-next-link" to={`/tactical-demo?mission=${nextMission.id}&planet=${territory.planetId}&era=${territory.eraId}&territory=${territory.id}${appendOperationContext(new URLSearchParams(), operationContext, returnPath)}`}>Следующая операция <span>→</span></Link>}</div>
  </section>
}
