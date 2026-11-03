import React from 'react'

const labels = { move: 'Move', attack: 'Attack', defend: 'Defend', hold: 'Hold' }
const icons = { move: '↗', attack: '◎', defend: '⬡', hold: 'Ⅱ' }

export default function OrderPanel({ unit, order, mode, setMode, onDefend, onHold, onCancel, disabled, target, rangePreview }) {
  if (!unit) return <section className="tactical-info-card"><p className="tactical-card-kicker">ПРИКАЗЫ ОТРЯДА</p><p className="tactical-panel-copy">Выберите живой союзный отряд, чтобы назначить приказ.</p></section>
  const selectedLabel = order ? labels[order.type] : 'Не назначен'
  return <section className="tactical-info-card tactical-order-panel">
    <p className="tactical-card-kicker">ПРИКАЗЫ ОТРЯДА</p>
    <h2>{unit.name}</h2>
    <p className="tactical-unit-kind">{unit.unitType === 'assault' ? 'Штурмовой' : unit.unitType === 'rifle' ? 'Стрелковый' : 'Тяжёлый'} · {unit.x}, {unit.y} · {unit.hp}/{unit.maxHp} HP</p>
    <dl className="tactical-stats tactical-order-unit-stats"><div><dt>Атака</dt><dd>{unit.attack}</dd></div><div><dt>Броня</dt><dd>{unit.armor}</dd></div><div><dt>Дальность атаки</dt><dd>{unit.attackRange}</dd></div><div><dt>Дальность перемещения</dt><dd>{unit.moveRange}</dd></div><div><dt>Позиция</dt><dd>{unit.x}, {unit.y}</dd></div></dl>
    <div className="tactical-order-buttons" aria-label="Доступные приказы">
      <button type="button" className={mode === 'move' || order?.type === 'move' ? 'order-choice is-active' : 'order-choice'} disabled={disabled} onClick={() => setMode(mode === 'move' ? null : 'move')}><b>{icons.move}</b>Move</button>
      <button type="button" className={mode === 'attack' || order?.type === 'attack' ? 'order-choice is-active' : 'order-choice'} disabled={disabled} onClick={() => setMode(mode === 'attack' ? null : 'attack')}><b>{icons.attack}</b>Attack</button>
      <button type="button" className={order?.type === 'defend' ? 'order-choice is-active' : 'order-choice'} disabled={disabled} onClick={onDefend}><b>{icons.defend}</b>Defend</button>
      <button type="button" className={order?.type === 'hold' ? 'order-choice is-active' : 'order-choice'} disabled={disabled} onClick={onHold}><b>{icons.hold}</b>Hold</button>
    </div>
    <div className="tactical-order-status" aria-live="polite"><span>ТЕКУЩИЙ ПРИКАЗ</span><b>{selectedLabel}{order?.type === 'move' ? ` → ${order.targetPosition.x}, ${order.targetPosition.y} · ${order.path.length - 1} шаг.` : ''}{order?.type === 'attack' && target ? ` → ${target.name}` : ''}</b></div>
    {mode === 'move' && <p className="tactical-hint">Выберите подсвеченную свободную клетку. Дальность: {unit.moveRange}; маршрут: {rangePreview?.distance ?? '—'} переходов.</p>}
    {mode === 'attack' && <p className="tactical-hint">Выберите подсвеченную вражескую цель. Дальность атаки: {unit.attackRange}; расстояние: {rangePreview?.distance ?? '—'}.</p>}
    {order?.type === 'attack' && target && <p className="tactical-hint">Цель: {target.name} · расстояние {rangePreview?.distance ?? '—'} · урон будет рассчитан при выполнении.</p>}
    {order?.type === 'defend' && <p className="tactical-hint">Оборона: будущий эффект уменьшения получаемого урона. Сейчас боевого эффекта нет.</p>}
    {order?.type === 'hold' && <p className="tactical-hint">Удержание: отряд остаётся на позиции и не совершает активного действия.</p>}
    {order && <button type="button" className="tactical-cancel-order" disabled={disabled} onClick={onCancel}>Отменить приказ</button>}
  </section>
}
