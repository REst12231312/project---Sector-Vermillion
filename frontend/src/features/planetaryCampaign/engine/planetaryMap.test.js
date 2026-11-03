import { terraMap } from '../data/terraMap'
import { terraSiegeMap } from '../data/terraSiegeMap'
import { planetEraConfigs } from '../data/planetEras'
import { territoryConfigs } from '../data/territories'
import { missionById } from '../data/missions'
import { clampPlanetCamera, zoomPlanetCamera } from './planetCamera'
import { createEmptyTerritoryProgress } from './territoryProgress'
import { resolveTerritoryMapState } from './territoryMapState'
import { resolveFrontlines } from './territoryMapState'

test('Terra has five fixed regions whose neighbor borders are explicitly paired', () => {
  expect(terraMap.regions).toHaveLength(5)
  expect(terraMap.regions.every((region) => region.path.startsWith('M ') && region.center.x >= 0 && region.center.y >= 0)).toBe(true)
  for (const region of terraMap.regions) {
    for (const neighborId of region.neighbors) {
      const neighbor = terraMap.regions.find((item) => item.id === neighborId)
      expect(neighbor?.neighbors).toContain(region.id)
      expect(region.borders[neighborId] || neighbor.borders[region.id]).toBeTruthy()
    }
    expect(territoryConfigs.some((territory) => territory.id === region.territoryId)).toBe(true)
  }
})

test('each Terra era resolves to its own map and matching territory set', () => {
  const maps = { [terraMap.id]: terraMap, [terraSiegeMap.id]: terraSiegeMap }
  for (const era of planetEraConfigs) {
    const map = maps[era.mapId]
    expect(map).toBeTruthy()
    expect(map.regions.map((region) => region.territoryId).sort()).toEqual([...era.territoryIds].sort())
    expect(map.eraId).toBe(era.id)
  }
})

test('territory access and control are derived independently and frontlines follow control changes', () => {
  const progress = createEmptyTerritoryProgress()
  const initial = resolveTerritoryMapState(terraMap.regions, territoryConfigs, missionById, progress)
  expect(initial.find((region) => region.id === 'terra-northern-front')).toMatchObject({ control: 'enemy', availability: 'available' })
  expect(initial.every((region) => region.availability === 'available')).toBe(true)
  expect(resolveFrontlines(initial)).toHaveLength(0)

  const contested = resolveTerritoryMapState(terraMap.regions, territoryConfigs, missionById, { ...progress, territoryControl: 'contested', completedMissionIds: ['terra-north-capture'] })
  expect(contested.find((region) => region.id === 'terra-northern-front')).toMatchObject({ control: 'contested', availability: 'in_progress', completedCount: 1 })
  expect(resolveFrontlines(contested)).toHaveLength(3)

  const held = resolveTerritoryMapState(terraMap.regions, territoryConfigs, missionById, { ...progress, territoryControl: 'player', completedMissionIds: ['terra-north-capture', 'terra-north-destroy', 'terra-north-defend'] })
  expect(held.find((region) => region.id === 'terra-northern-front')).toMatchObject({ control: 'player', availability: 'completed', completedCount: 3 })
  expect(resolveFrontlines(held)).toHaveLength(3)
})

test('planet camera keeps the complete map centered while clamping zoom limits', () => {
  const zoomed = zoomPlanetCamera({ x: 0, y: 0, scale: 1 }, 2, { x: 250, y: 200 })
  expect(zoomed).toEqual({ x: -500, y: -350, scale: 2 })
  expect(clampPlanetCamera({ x: 9000, y: -9000, scale: 20 })).toEqual({ x: 0, y: -1400, scale: 3 })
  expect(clampPlanetCamera({ x: 50, y: -60, scale: 0.2 })).toEqual({ x: 0, y: 0, scale: 1 })
})
