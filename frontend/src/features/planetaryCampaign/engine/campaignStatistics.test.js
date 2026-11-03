import { getCampaignStatistics } from './campaignStatistics'

test('aggregates only the required successful mission records', () => {
  const result = getCampaignStatistics({ missionRecords: {
    a: { missionId: 'a', outcome: 'victory', territoryId: 'north', rounds: 4, survivingUnits: [{}, {}] },
    b: { missionId: 'b', outcome: 'defeat', territoryId: 'west', rounds: 9, survivingUnits: [] },
    c: { missionId: 'c', outcome: 'victory', territoryId: 'west', rounds: 3, survivingUnits: [{}, {}, {}] },
    unrelated: { missionId: 'other', outcome: 'victory', territoryId: 'south', rounds: 100, survivingUnits: [] },
  } }, ['a', 'b', 'c'])

  expect(result).toEqual({ totalRounds: 7, unitsLost: 1, survivingUnits: 3, territoriesCaptured: 2, completedMissions: ['a', 'c'] })
})

test('handles missing and damaged tactical saves safely', () => {
  expect(getCampaignStatistics(null, ['a'])).toEqual({ totalRounds: 0, unitsLost: 0, survivingUnits: 0, territoriesCaptured: 0, completedMissions: [] })
  expect(getCampaignStatistics({ missionRecords: [] }, ['a']).completedMissions).toEqual([])
})
