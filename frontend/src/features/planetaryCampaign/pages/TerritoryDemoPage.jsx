import React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { missionById } from '../data/missions'
import { territoryById } from '../data/territories'
import { beginTerritoryMission, getTerritoryMissionStatuses, loadTerritoryProgress, saveTerritoryProgress } from '../engine/territoryProgress'
import TerritoryMissionList from '../components/TerritoryMissionList'
import '../styles/tacticalMap.css'

const controlLabels = { enemy: 'ПОД КОНТРОЛЕМ ПРОТИВНИКА', contested: 'ОСПАРИВАЕМАЯ ТЕРРИТОРИЯ', player: 'КОНТРОЛЬ ИМПЕРИУМА' }

export default function TerritoryDemoPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const territory = territoryById[searchParams.get('territory')] || territoryById['terra-northern-front']
  const [progress, setProgress] = React.useState(() => loadTerritoryProgress())
  const statuses = getTerritoryMissionStatuses(territory, progress)
  const completedCount = progress.completedMissionIds.filter((id) => territory.missions.includes(id)).length

  function launchMission(mission) {
    const prepared = beginTerritoryMission(progress, mission)
    const saved = saveTerritoryProgress(prepared.progress)
    setProgress(saved)
    navigate(`/tactical-demo?mission=${mission.id}`)
  }

  return <main className="tactical-demo territory-demo">
    <header className="tactical-header">
      <Link className="tactical-back" to={`/planets/${territory.planetId}/eras/${territory.eraId}?territory=${territory.id}`}>← Планетарная карта</Link>
      <div className="tactical-title-row"><div><p className="tactical-eyebrow">{territory.planetName.toUpperCase()} · {territory.eraName.toUpperCase()}</p><h1>{territory.name}</h1><p className="tactical-subtitle">{controlLabels[progress.territoryControl] || controlLabels.enemy}</p></div><div className="tactical-round"><span>ОПЕРАЦИИ</span><b>{completedCount}/3</b><small>ТЕРРИТОРИЯ</small></div></div>
      <p className="tactical-briefing">{territory.description}</p>
    </header>
    <section className="territory-layout">
      <div className="territory-intro-card"><p className="tactical-card-kicker">ПЛАНЕТАРНАЯ ОПЕРАЦИЯ · {territory.planetName.toUpperCase()}</p><h2>{territory.name}</h2><p>{territory.description}</p><div className="territory-control-meter"><span>ТЕРРИТОРИАЛЬНЫЙ КОНТРОЛЬ</span><b>{controlLabels[progress.territoryControl] || controlLabels.enemy}</b><i><em style={{ width: `${progress.territoryControl === 'player' ? 100 : progress.territoryControl === 'contested' ? 50 : 8}%` }} /></i></div></div>
      <section className="territory-operations"><div className="territory-section-heading"><div><p className="tactical-card-kicker">ЦЕПОЧКА ЗАДАНИЙ</p><h2>Операции Северного фронта</h2></div><span>{statuses.filter((item) => item.status === 'completed').length} / {territory.missions.length} ЗАВЕРШЕНО</span></div><TerritoryMissionList territory={territory} missions={missionById} statuses={statuses} onLaunch={launchMission} /></section>
      <section className="territory-history"><p className="tactical-card-kicker">ЖУРНАЛ ТЕРРИТОРИИ</p>{progress.history.length ? progress.history.slice().reverse().slice(0, 5).map((entry) => <article key={entry.id}><b>{entry.missionName}</b><span>{entry.outcome === 'victory' ? 'Победа' : entry.outcome === 'draw' ? 'Ничья' : 'Поражение'} · {entry.rounds} раундов</span></article>) : <p className="tactical-panel-copy">Отчётов пока нет. Первая операция откроет цепочку.</p>}{progress.pendingConsequences.length > 0 && <div className="territory-pending-bonuses"><span>ПРЕДСТОЯЩИЕ БОНУСЫ</span>{progress.pendingConsequences.map((item) => <small key={item.id}>{item.description}</small>)}</div>}</section>
    </section>
  </main>
}
