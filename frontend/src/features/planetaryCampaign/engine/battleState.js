export const BATTLE_PHASES = ['planning', 'resolving', 'results', 'finished']

export function createBattleState({ battleId, missionId, map, units, objectives }) {
  return {
    battleId,
    missionId,
    round: 1,
    phase: 'planning',
    map,
    units,
    playerOrders: [],
    enemyOrders: [],
    objectives,
    battleStatus: 'active',
    planningStatus: 'planning',
    confirmedOrders: null,
  }
}
