import { createEnemyOrders } from './enemyAI'
import { resolveRound as resolveRoundCore } from './roundResolver'
import { spawnDueReinforcements } from './missionEngine'

export function resolveRound({ battleState, playerOrders, enemyOrders } = {}) {
  if (!battleState) return { ok: false, nextState: battleState, events: [], summary: null, errors: ['BattleState не передан.'] }
  const confirmedPlayerOrders = playerOrders || battleState.confirmedOrders || battleState.playerOrders
  const reinforcementResult = spawnDueReinforcements(battleState)
  const roundState = reinforcementResult.battleState
  const generatedEnemyOrders = enemyOrders === undefined ? createEnemyOrders(roundState) : enemyOrders
  const preRoundEvents = reinforcementResult.spawned.map((entry) => ({ type: 'reinforcement_spawned', unitIds: [entry.unitId], data: entry }))
  return resolveRoundCore({ battleState: roundState, playerOrders: confirmedPlayerOrders, enemyOrders: generatedEnemyOrders, preRoundEvents })
}

export function startNextRound(battleState) {
  if (battleState?.phase === 'finished' || battleState?.battleStatus !== 'active') return { ok: false, nextState: battleState, errors: ['Завершённый бой нельзя продолжить.'] }
  if (battleState?.phase !== 'results') return { ok: false, nextState: battleState, errors: ['Следующий раунд доступен после просмотра результатов.'] }
  return {
    ok: true,
    errors: [],
    nextState: {
      ...battleState,
      round: battleState.round + 1,
      phase: 'planning',
      planningStatus: 'planning',
      playerOrders: [],
      enemyOrders: [],
      confirmedOrders: null,
      roundOrders: null,
      roundSnapshot: null,
      roundEvents: [],
      roundSummary: null,
    },
  }
}
