import React from 'react'

export default function TacticalOperationHud({ mission, territory, battle, operationTitle, operationStep, operationTotal, phaseLabel }) {
  const target = battle.strategicObjects.find((item) => item.primary) || battle.strategicObjects[0]
  const allied = battle.units.filter((unit) => unit.side === 'player' && unit.hp > 0).length
  const enemy = battle.units.filter((unit) => unit.side === 'enemy' && unit.hp > 0).length
  let objectiveStatus = 'ЦЕЛЬ: ВЫПОЛНИТЕ УСЛОВИЕ МИССИИ'
  if (mission.type === 'capture') objectiveStatus = `${battle.missionProgress.contested ? 'ТОЧКА ОСПАРИВАЕТСЯ' : 'КОНТРОЛЬ ТОЧКИ'} · ${battle.missionProgress.captureRounds}/${mission.victoryConditions.captureRounds}`
  if (mission.type === 'defend') objectiveStatus = `УДЕРЖАНИЕ · ${battle.missionProgress.defenseRounds}/${mission.victoryConditions.defendRounds} РАУНДОВ`
  if (mission.type === 'destroy' && target) objectiveStatus = target.hp > 0 ? `${target.name.toUpperCase()} · ${target.hp}/${target.maxHp} HP` : `${target.name.toUpperCase()} · УНИЧТОЖЕНА`
  return <section className="tactical-operation-hud" aria-label="Сводка боевой операции">
    <div className="tactical-hud-operation-name">
      <span>ОПЕРАЦИЯ · {operationTitle.toUpperCase()}</span>
      <h1>{mission.name}</h1>
      <small>{territory.planetName} / {territory.name} · {mission.eraId === 'unification' ? 'ВОЙНЫ ОБЪЕДИНЕНИЯ' : mission.eraId.toUpperCase()}</small>
    </div>
    <div className="tactical-hud-round"><span>РАУНД</span><b>{String(battle.round).padStart(2, '0')}</b><small>{phaseLabel}</small></div>
    <div className="tactical-hud-status-row">
      <div className="tactical-hud-objective"><span>ПРИКАЗ</span><b>{objectiveStatus}</b></div>
      <div className="tactical-hud-stage"><span>ЭТАП КАМПАНИИ</span><b>{String(operationStep).padStart(2, '0')} <small>/ {String(operationTotal).padStart(2, '0')}</small></b><i><em style={{ width: `${operationTotal ? operationStep / operationTotal * 100 : 0}%` }} /></i></div>
      <div className="tactical-hud-forces"><span>СИЛЫ</span><b><i className="hud-force-player" />{allied}<small> / </small><i className="hud-force-enemy" />{enemy}</b></div>
    </div>
  </section>
}
