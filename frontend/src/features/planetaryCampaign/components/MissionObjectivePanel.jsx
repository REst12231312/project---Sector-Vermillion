import React from 'react'

const controlNames = { enemy: 'Противник', contested: 'Оспаривается', player: 'Империум' }

export default function MissionObjectivePanel({ mission, battle }) {
  const object = battle.strategicObjects.find((item) => item.primary) || battle.strategicObjects[0]
  return <section className="tactical-info-card mission-objective-panel">
    <p className="tactical-card-kicker">ОСНОВНАЯ ЦЕЛЬ · {mission.type === 'capture' ? 'ЗАХВАТ' : mission.type === 'destroy' ? 'УНИЧТОЖЕНИЕ' : 'ОБОРОНА'}</p>
    <h2>{mission.name}</h2>
    <p className="tactical-panel-copy">{mission.description}</p>
    {mission.type === 'capture' && <div className="mission-objective-state"><b>Контроль: {controlNames[battle.missionProgress.control] || 'Противник'}</b><span>Удержание точки: {battle.missionProgress.captureRounds}/{mission.victoryConditions.captureRounds} раундов</span>{battle.missionProgress.contested && <em>Точка оспаривается — прогресс не растёт.</em>}</div>}
    {object && <div className={`mission-objective-state${object.hp <= 0 ? ' is-destroyed' : ''}`}><b>{object.name}</b><span>{object.hp > 0 ? `HP цели: ${object.hp}/${object.maxHp}` : 'Цель уничтожена'}</span><i className="mission-object-hp"><em style={{ width: `${Math.max(0, 100 * object.hp / object.maxHp)}%` }} /></i></div>}
    {mission.type === 'defend' && <div className="mission-objective-state"><b>Оборона: {battle.missionProgress.defenseRounds}/{mission.victoryConditions.defendRounds} раундов</b><span>Подкрепления могут прибыть в раундах {mission.reinforcements.map((entry) => entry.round).join(' и ')}.</span></div>}
    {battle.appliedConsequences?.length > 0 && <div className="mission-consequence-note"><span>ПРЕИМУЩЕСТВО ОПЕРАЦИИ</span>{battle.appliedConsequences.map((effect) => <small key={effect.id}>{effect.description}</small>)}</div>}
  </section>
}
