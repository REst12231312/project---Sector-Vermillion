export const storyEvents = [{
  id: 'terra-siege-era-discovered',
  planetId: 'terra',
  trigger: { type: 'mission_completed', missionId: 'siege-terra-loyalist' },
  actions: [{ type: 'unlock_era', eraId: 'siege' }],
}]
