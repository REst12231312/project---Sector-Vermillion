import React from 'react'

const CELL_SIZE = 50
const terrainNames = { plain: 'Обычная местность', obstacle: 'Препятствие', cover: 'Укрытие', objective: 'Стратегический объект' }

export default function TacticalMap({ map, units, selectedCell, selectedUnitId, onSelectCell, onSelectUnit, reachableCells = [], targetableUnitIds = [], targetableObjectIds = [], orders = [], activeEvent = null, strategicObjects = [], selectedObjectId = null, onSelectObject, missionObjective = null, missionProgress = null }) {
  const reachableKeys = new Set(reachableCells.map((position) => `${position.x},${position.y}`))
  const targetableIds = new Set(targetableUnitIds)
  const targetableObjects = new Set(targetableObjectIds)
  const unitById = new Map(units.map((unit) => [unit.id, unit]))
  const objectById = new Map(strategicObjects.map((object) => [object.id, object]))
  const center = (position) => `${position.x * CELL_SIZE + CELL_SIZE / 2},${position.y * CELL_SIZE + CELL_SIZE / 2}`
  return <svg className="tactical-map-svg" viewBox={`0 0 ${map.width * CELL_SIZE} ${map.height * CELL_SIZE}`} role="grid" aria-label="Тактическое поле 12 на 12">
    <defs><marker id="tactical-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L6,3 z" fill="currentColor" /></marker></defs>
    {map.cells.map((cell) => {
      const selected = selectedCell?.x === cell.x && selectedCell?.y === cell.y
      const reachable = reachableKeys.has(`${cell.x},${cell.y}`)
      return <g key={`${cell.x}-${cell.y}`} role="gridcell" aria-label={`Клетка ${cell.x}, ${cell.y}: ${terrainNames[cell.type]}${selected ? ', выбрана' : ''}`} aria-selected={selected} tabIndex={0}
        className={`tactical-cell terrain-${cell.type}${selected ? ' is-selected' : ''}${reachable ? ' is-reachable' : ''}`}
        transform={`translate(${cell.x * CELL_SIZE} ${cell.y * CELL_SIZE})`}
        onClick={() => onSelectCell(cell)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectCell(cell) } }}>
        <rect width={CELL_SIZE} height={CELL_SIZE} />
        {cell.type === 'obstacle' && <path className="terrain-mark" d="M13 38 25 12l12 26z" />}
        {cell.type === 'cover' && <path className="terrain-mark" d="M11 34h28M15 34V18h20v16" />}
        {cell.type === 'objective' && <><circle className="objective-ring" cx="25" cy="25" r="11"/><path className="terrain-mark" d="M25 18v14M18 25h14" /></>}
      </g>
    })}
    {missionObjective && <g className={`mission-point-marker control-${missionProgress?.control || 'enemy'}${missionProgress?.contested ? ' is-contested' : ''}`} pointerEvents="none"><circle cx={missionObjective.x * CELL_SIZE + 25} cy={missionObjective.y * CELL_SIZE + 25} r="19"/><circle className="mission-point-progress" cx={missionObjective.x * CELL_SIZE + 25} cy={missionObjective.y * CELL_SIZE + 25} r="22" strokeDasharray={`${2 * Math.PI * 22 * Math.min(1, (missionProgress?.captureRounds || 0) / missionObjective.requiredRounds)} ${2 * Math.PI * 22}`} transform={`rotate(-90 ${missionObjective.x * CELL_SIZE + 25} ${missionObjective.y * CELL_SIZE + 25})`}/></g>}
    {strategicObjects.map((object) => <g key={object.id} className={`tactical-object object-${object.side}${object.hp <= 0 ? ' object-destroyed' : ''}${selectedObjectId === object.id ? ' object-selected' : ''}${targetableObjects.has(object.id) ? ' object-targetable' : ''}`} transform={`translate(${object.x * CELL_SIZE} ${object.y * CELL_SIZE})`} role="button" aria-label={`${object.name}, ${object.side === 'player' ? 'союзный объект' : 'вражеский объект'}, ${object.hp} из ${object.maxHp} HP`} tabIndex={0} onClick={(event) => { event.stopPropagation(); onSelectObject?.(object) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onSelectObject?.(object) } }}>
      <rect className="object-frame" x="9" y="9" width="32" height="32" rx="3"/><path className="object-glyph" d={object.type === 'artillery_battery' ? 'M17 33 25 16l8 17M19 29h12M21 24h8' : 'M15 34V21l10-8 10 8v13M21 34v-8h8v8'}/><text className="object-label" x="25" y="7" textAnchor="middle">{object.type === 'artillery_battery' ? 'AT' : 'CP'}</text><rect className="object-hp-track" x="10" y="44" width="30" height="3" rx="1.5"/><rect className="object-hp-fill" x="10" y="44" width={30 * Math.max(0, object.hp) / object.maxHp} height="3" rx="1.5"/>
    </g>)}
    {orders.map((order) => {
      const unit = unitById.get(order.unitId)
      if (!unit) return null
      const faint = selectedUnitId !== unit.id ? ' order-visual-faint' : ''
      if (order.type === 'move') return <g key={`path-${unit.id}`} className={`order-visual order-move${faint}`}><polyline points={order.path.map(center).join(' ')} markerEnd="url(#tactical-arrowhead)"/><circle className="move-destination" cx={center(order.targetPosition).split(',')[0]} cy={center(order.targetPosition).split(',')[1]} r="12" /></g>
      if (order.type === 'attack') {
        const target = unitById.get(order.targetUnitId) || objectById.get(order.targetObjectId)
        if (!target) return null
        return <g key={`attack-${unit.id}`} className={`order-visual order-attack${faint}`}><line x1={unit.x * CELL_SIZE + 25} y1={unit.y * CELL_SIZE + 25} x2={target.x * CELL_SIZE + 25} y2={target.y * CELL_SIZE + 25} markerEnd="url(#tactical-arrowhead)"/><circle cx={target.x * CELL_SIZE + 25} cy={target.y * CELL_SIZE + 25} r="19" /></g>
      }
      if (order.type === 'defend' || order.type === 'hold') return <g key={`mark-${unit.id}`} className={`order-unit-mark ${order.type}${faint}`} transform={`translate(${unit.x * CELL_SIZE + 35} ${unit.y * CELL_SIZE + 6})`}><circle r="9"/><text textAnchor="middle" y="3.5">{order.type === 'defend' ? '◇' : 'Ⅱ'}</text></g>
      return null
    })}
    {activeEvent?.type === 'attack_performed' && (() => {
      const attacker = unitById.get(activeEvent.data.attackerId)
      const target = unitById.get(activeEvent.data.targetId) || objectById.get(activeEvent.data.targetObjectId)
      return attacker && target ? <g className="battle-event-attack" key={activeEvent.id}><line x1={attacker.x * CELL_SIZE + 25} y1={attacker.y * CELL_SIZE + 25} x2={target.x * CELL_SIZE + 25} y2={target.y * CELL_SIZE + 25}/><circle cx={target.x * CELL_SIZE + 25} cy={target.y * CELL_SIZE + 25} r="22"/></g> : null
    })()}
    {activeEvent?.type === 'damage_dealt' && (() => {
      const target = unitById.get(activeEvent.data.targetId) || objectById.get(activeEvent.data.targetObjectId)
      return target ? <g className="battle-event-damage" transform={`translate(${target.x * CELL_SIZE + 25} ${target.y * CELL_SIZE + 9})`} key={activeEvent.id}><rect x="-16" y="-12" width="32" height="18" rx="3"/><text textAnchor="middle" y="1">−{activeEvent.data.damage}</text></g> : null
    })()}
    {units.map((unit) => <g key={unit.id} className={`tactical-unit unit-${unit.side}${selectedUnitId === unit.id ? ' unit-selected' : ''}${targetableIds.has(unit.id) ? ' unit-targetable' : ''}${unit.hp <= 0 ? ' unit-destroyed' : ''}`} transform={`translate(${unit.x * CELL_SIZE} ${unit.y * CELL_SIZE})`} role="button" aria-label={`${unit.name}, ${unit.side === 'player' ? 'союзник' : 'противник'}, ${unit.hp} из ${unit.maxHp} HP`} tabIndex={0} onClick={(event) => { event.stopPropagation(); onSelectUnit(unit) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onSelectUnit(unit) } }}>
      <circle className="unit-disc" cx="25" cy="25" r="15" />
      <text x="25" y="29" textAnchor="middle">{unit.side === 'player' ? ({ assault: 'Ш', rifle: 'С', heavy: 'Т' }[unit.unitType] || 'I') : '×'}</text>
      <rect className="unit-hp-track" x="12" y="43" width="26" height="3" rx="1.5" />
      <rect className="unit-hp-fill" x="12" y="43" width={26 * unit.hp / unit.maxHp} height="3" rx="1.5" />
    </g>)}
  </svg>
}
