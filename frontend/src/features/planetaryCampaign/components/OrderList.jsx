import React from 'react'

const orderNames = { move: 'Move', attack: 'Attack', defend: 'Defend', hold: 'Hold' }

export default function OrderList({ units, orders, selectedUnitId, onSelectUnit, disabled }) {
  return <section className="tactical-info-card tactical-order-list">
    <p className="tactical-card-kicker">ПРИКАЗЫ · РАУНД 01</p>
    <div className="tactical-order-list-items">{units.filter((unit) => unit.side === 'player').map((unit) => {
      const order = orders.find((item) => item.unitId === unit.id)
      const target = order?.type === 'move' ? `→ (${order.targetPosition.x}, ${order.targetPosition.y})` : order?.type === 'attack' ? `→ ${units.find((item) => item.id === order.targetUnitId)?.name || 'цель недоступна'}` : ''
      return <button type="button" key={unit.id} className={`tactical-order-row${selectedUnitId === unit.id ? ' is-selected' : ''}`} onClick={() => onSelectUnit(unit)} disabled={disabled || unit.hp <= 0}>
        <span className="order-row-main"><b>{unit.name}</b><small>{unit.hp > 0 ? `${unit.hp}/${unit.maxHp} HP` : 'Уничтожен'}</small></span>
        <span className="order-row-status"><b>{order ? orderNames[order.type] : 'Ожидает'}</b><small>{target || (order ? 'Назначен' : 'Не назначен')}</small></span>
        <i className={order ? 'order-ready is-ready' : 'order-ready'} aria-label={order ? 'Приказ назначен' : 'Приказ не назначен'} />
      </button>
    })}</div>
  </section>
}
