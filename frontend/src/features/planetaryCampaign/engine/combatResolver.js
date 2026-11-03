import { BATTLE_CONFIG } from './battleConfig'
import { getCell } from './pathfinding'
import { manhattanDistance } from './lineOfSight'
import { validateOrder } from './orderValidation'

const living = (unit) => unit.hp > 0 && unit.status !== 'destroyed'
const aliveObject = (object) => object.hp > 0 && object.status !== 'destroyed'

export function resolveCombat({ battle, orders, emit }) {
  const units = battle.units
  const objects = battle.strategicObjects || []
  const unitById = new Map(units.map((unit) => [unit.id, unit]))
  const objectById = new Map(objects.map((object) => [object.id, object]))
  const defendIds = new Set(orders.filter((order) => order.type === 'defend').map((order) => order.unitId))
  const attacks = []

  for (const order of [...orders].filter((item) => item.type === 'attack').sort((a, b) => a.unitId.localeCompare(b.unitId))) {
    const attacker = unitById.get(order.unitId)
    const targetUnit = order.targetUnitId ? unitById.get(order.targetUnitId) : null
    const targetObject = order.targetObjectId ? objectById.get(order.targetObjectId) : null
    const target = targetUnit || targetObject
    const side = attacker?.side || 'player'
    const errors = validateOrder(order, battle, { side })
    if (errors.length) {
      emit('attack_blocked', [order.unitId, order.targetUnitId || order.targetObjectId].filter(Boolean), { reason: errors[0] })
      continue
    }
    const targetCell = targetUnit ? getCell(battle.map, target) : null
    const coverBonus = targetCell?.type === 'cover' ? BATTLE_CONFIG.coverArmorBonus : 0
    const defendBonus = targetUnit && defendIds.has(target.id) ? BATTLE_CONFIG.defendArmorBonus : 0
    const effectiveArmor = target.armor + coverBonus + defendBonus
    const damage = Math.max(1, attacker.attack - effectiveArmor)
    attacks.push({ attackerId: attacker.id, targetId: targetUnit?.id || null, targetObjectId: targetObject?.id || null, targetName: target.name, targetType: targetUnit ? 'unit' : 'object', damage, distance: manhattanDistance(attacker, target), effectiveArmor, coverBonus, defendBonus })
  }

  attacks.forEach((attack) => emit('attack_performed', [attack.attackerId, attack.targetId || attack.targetObjectId], { ...attack }))
  const totalDamage = new Map()
  const targetKey = (attack) => `${attack.targetType}:${attack.targetId || attack.targetObjectId}`
  attacks.forEach((attack) => totalDamage.set(targetKey(attack), (totalDamage.get(targetKey(attack)) || 0) + attack.damage))
  const damageEvents = attacks.map((attack) => {
    const target = attack.targetType === 'unit' ? unitById.get(attack.targetId) : objectById.get(attack.targetObjectId)
    return { ...attack, targetHpBefore: target.hp }
  }).sort((a, b) => String(a.targetId || a.targetObjectId).localeCompare(String(b.targetId || b.targetObjectId)) || a.attackerId.localeCompare(b.attackerId))

  const updatedUnits = units.map((unit) => {
    const damage = totalDamage.get(`unit:${unit.id}`) || 0
    if (!damage || !living(unit)) return { ...unit }
    return { ...unit, hp: Math.max(0, unit.hp - damage), status: unit.hp - damage <= 0 ? 'destroyed' : unit.status }
  })
  const updatedObjects = objects.map((object) => {
    const damage = totalDamage.get(`object:${object.id}`) || 0
    if (!damage || !aliveObject(object)) return { ...object }
    return { ...object, hp: Math.max(0, object.hp - damage), status: object.hp - damage <= 0 ? 'destroyed' : object.status }
  })

  for (const attack of damageEvents) {
    const key = targetKey(attack)
    emit('damage_dealt', [attack.attackerId, attack.targetId || attack.targetObjectId], {
      attackerId: attack.attackerId, targetId: attack.targetId, targetObjectId: attack.targetObjectId, targetType: attack.targetType,
      damage: attack.damage, targetHp: Math.max(0, attack.targetHpBefore - totalDamage.get(key)), totalDamage: totalDamage.get(key),
    })
  }
  for (const unit of updatedUnits.filter((candidate) => candidate.hp === 0 && living(unitById.get(candidate.id))).sort((a, b) => a.id.localeCompare(b.id))) {
    emit('unit_destroyed', [unit.id], { side: unit.side, name: unit.name })
  }
  for (const object of updatedObjects.filter((candidate) => candidate.hp === 0 && aliveObject(objectById.get(candidate.id))).sort((a, b) => a.id.localeCompare(b.id))) {
    emit('objective_destroyed', [object.id], { side: object.side, name: object.name, type: object.type })
  }
  return { units: updatedUnits, strategicObjects: updatedObjects }
}
