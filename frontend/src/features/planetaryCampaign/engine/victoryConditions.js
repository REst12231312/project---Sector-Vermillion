export function getBattleOutcome(units) {
  const alliedAlive = units.some((unit) => unit.side === 'player' && unit.hp > 0 && unit.status !== 'destroyed')
  const enemyAlive = units.some((unit) => unit.side === 'enemy' && unit.hp > 0 && unit.status !== 'destroyed')
  if (alliedAlive && enemyAlive) return 'active'
  if (alliedAlive) return 'victory'
  if (enemyAlive) return 'defeat'
  return 'draw'
}

export { evaluateMissionOutcome } from './objectiveResolver'
