import { FACTIONS, UNIT_TYPES, calculateWoundTarget } from '../game/battleEngine.js'

function expectedDamage(target, weapon) {
  const hitChance = Math.max(0, 7 - weapon.skill) / 6
  const woundChance = (7 - calculateWoundTarget(weapon.strength, target.toughness)) / 6
  const saveTarget = target.save - weapon.ap
  const failedSaveChance = saveTarget > 6 ? 1 : Math.max(1 / 6, (saveTarget - 1) / 6)
  return weapon.attacks * hitChance * woundChance * failedSaveChance * Math.min(weapon.damage, target.hp)
}

for (const faction of FACTIONS) {
  const enemies = FACTIONS.filter((other) => other !== faction).flatMap((other) => UNIT_TYPES[other])
  const values = UNIT_TYPES[faction].map((unit) => {
    const ranged = enemies.reduce((sum, target) => sum + expectedDamage(target, unit.ranged), 0) / enemies.length
    const melee = enemies.reduce((sum, target) => sum + expectedDamage(target, unit.melee), 0) / enemies.length
    return { name: unit.name, ranged, melee, hp: unit.hp }
  })
  const average = (key) => values.reduce((sum, unit) => sum + unit[key], 0) / values.length
  const range = UNIT_TYPES[faction].reduce((sum, unit) => sum + unit.ranged.range, 0) / UNIT_TYPES[faction].length
  console.log(`${faction}: средний урон за действие стрельбы ${average('ranged').toFixed(2)}, ближнего боя ${average('melee').toFixed(2)}, дальность стрельбы ${range.toFixed(1)}; состав: ${values.map((unit) => `${unit.name} ${unit.ranged.toFixed(2)}/${unit.melee.toFixed(2)} урона, ${unit.hp} HP`).join(' · ')}`)
}
