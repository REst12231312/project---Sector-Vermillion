export const planetConfigs = [{
  id: 'terra',
  name: 'Терра',
  defaultEraId: 'unification',
  eraIds: ['unification', 'siege'],
}]

export const planetById = Object.fromEntries(planetConfigs.map((planet) => [planet.id, planet]))
