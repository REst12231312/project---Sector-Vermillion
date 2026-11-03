import { manhattanDistance } from './lineOfSight'

const living = (unit) => unit.hp > 0 && unit.status !== 'destroyed'

export function resolveMissionObjectives(battleState, units, emit) {
  if (battleState.missionType !== 'capture') return { ...battleState.missionProgress }
  const objective = battleState.objectives.find((item) => item.type === 'capture_point')
  if (!objective) return { ...battleState.missionProgress }
  const alliedAtPoint = units.some((unit) => unit.side === 'player' && living(unit) && unit.x === objective.x && unit.y === objective.y)
  const enemyAtPoint = units.some((unit) => unit.side === 'enemy' && living(unit) && unit.x === objective.x && unit.y === objective.y)
  const enemyNearby = units.some((unit) => unit.side === 'enemy' && living(unit) && manhattanDistance(unit, objective) <= objective.contestRadius)
  const progress = { ...battleState.missionProgress }

  if (enemyAtPoint) {
    progress.captureRounds = 0
    progress.control = 'enemy'
    progress.contested = Boolean(alliedAtPoint || enemyNearby)
    emit('objective_control_lost', [], { objectiveId: objective.id, control: 'enemy', captureRounds: 0 })
  } else if (alliedAtPoint && enemyNearby) {
    progress.control = 'contested'
    progress.contested = true
    emit('objective_contested', [], { objectiveId: objective.id, contestRadius: objective.contestRadius, captureRounds: progress.captureRounds })
  } else if (alliedAtPoint) {
    progress.captureRounds += 1
    progress.control = progress.captureRounds >= objective.requiredRounds ? 'player' : 'contested'
    progress.contested = false
    emit('objective_progress', [], { objectiveId: objective.id, captureRounds: progress.captureRounds, requiredRounds: objective.requiredRounds, control: progress.control })
  } else if (enemyNearby) {
    progress.control = 'contested'
    progress.contested = true
    emit('objective_contested', [], { objectiveId: objective.id, contestRadius: objective.contestRadius, captureRounds: progress.captureRounds })
  }
  return progress
}

export function evaluateMissionOutcome({ missionConfig, missionProgress, units, strategicObjects, round }) {
  if (!missionConfig) return 'active'
  const playerAlive = units.some((unit) => unit.side === 'player' && living(unit))
  const target = strategicObjects.find((object) => object.primary) || strategicObjects[0]
  const maxRounds = missionConfig.victoryConditions.maxRounds
  let goalComplete = false

  if (missionConfig.type === 'capture') goalComplete = missionProgress.captureRounds >= (missionConfig.victoryConditions.captureRounds || 2)
  if (missionConfig.type === 'destroy') goalComplete = Boolean(target && target.hp <= 0)
  if (missionConfig.type === 'defend') {
    if (target && target.hp <= 0) return 'defeat'
    goalComplete = missionProgress.defenseRounds >= (missionConfig.victoryConditions.defendRounds || 5) && Boolean(target && target.hp > 0)
  }

  if (goalComplete) return playerAlive ? 'victory' : 'draw'
  if (!playerAlive) return 'defeat'
  if (maxRounds && round >= maxRounds) return 'defeat'
  return 'active'
}
