import React from 'react'

const outcomeLabels = { active: 'Бой продолжается', victory: 'Победа', defeat: 'Поражение', draw: 'Ничья' }

export default function BattleResults({ summary, onNextRound }) {
  if (!summary) return null
  return <section className="tactical-info-card tactical-results" aria-labelledby="tactical-results-title">
    <p className="tactical-card-kicker">ИТОГИ РАУНДА {String(summary.round).padStart(2, '0')}</p>
    <h2 id="tactical-results-title">{outcomeLabels[summary.outcome]}</h2>
    <div className="tactical-result-counts"><span>Перемещений <b>{summary.moved.length}</b></span><span>Атак <b>{summary.attacks.length}</b></span><span>Уничтожено <b>{summary.destroyed.length}</b></span></div>
    <div className="tactical-result-log">
      {summary.moved.map((move, index) => <p key={`move-${move.unitId}-${index}`}><b>{move.name}</b> переместился: ({move.from.x}, {move.from.y}) → ({move.to.x}, {move.to.y})</p>)}
      {summary.attacks.map((attack, index) => <p key={`attack-${attack.attackerId}-${index}`}><b>{attack.attacker}</b> атакует {attack.target} · {attack.damage} урона · дистанция {attack.distance}</p>)}
      {summary.destroyed.map((unit) => <p className="result-destroyed" key={unit.unitId}>Уничтожен: <b>{unit.name}</b></p>)}
      {summary.blocked.map((event, index) => <p key={`blocked-${index}`}>{event.type === 'movement_collision' ? 'Столкновение маршрутов' : 'Действие остановлено'}: {event.reason}</p>)}
      {!summary.moved.length && !summary.attacks.length && !summary.destroyed.length && !summary.blocked.length && <p>Отряды удержали позиции; урона нет.</p>}
    </div>
    <div className="tactical-result-hp"><span>СОСТОЯНИЕ ОТРЯДОВ</span>{summary.units.map((unit) => <p key={unit.id}><b>{unit.name}</b><span>{unit.hp}/{unit.maxHp} HP · {unit.x}, {unit.y}</span></p>)}</div>
    {summary.outcome === 'active' && <button type="button" className="tactical-confirm-button" onClick={onNextRound}>Следующий раунд <span>→</span></button>}
  </section>
}
