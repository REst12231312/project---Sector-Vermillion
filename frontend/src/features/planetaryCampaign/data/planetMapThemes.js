const factionAccents = {
  imperium: { playerFill: '#343c2a', playerStroke: '#929b68', playerLine: '#c5ca92', accent: '#c8ae6d' },
  chaos: { playerFill: '#392936', playerStroke: '#9b6a86', playerLine: '#c190a9', accent: '#b8899c' },
  orks: { playerFill: '#3d3524', playerStroke: '#a58a51', playerLine: '#c0a56a', accent: '#c99a52' },
  tau: { playerFill: '#293a3b', playerStroke: '#648e91', playerLine: '#9bc0bc', accent: '#85b6b0' },
}

// Active campaign surface profiles are distinct by planet and historical era.
const surfaceProfiles = {
  terra: {
    unification: {
      id: 'terra-wasteland', label: 'ПЕПЕЛЬНЫЕ ПУСТОШИ', biome: 'wasteland',
      surface: '#28231b', edge: '#a2834e', grid: '#c7ad75', relief: '#b39a69', road: '#c09a57', ruin: '#a27b5d',
      terrainLight: '#494334', terrainDark: '#211f19', waste: '#aa8054', terrainStroke: '#beaa7a',
      landmarks: [
        { x: 184, y: 246, text: 'ПЕПЕЛЬНЫЕ ПУСТОШИ' }, { x: 335, y: 386, text: 'РУИНЫ МЕРИКИ' },
        { x: 626, y: 152, text: 'КАРПАТСКИЙ РАЗЛОМ' }, { x: 817, y: 374, text: 'ВОСТОЧНЫЙ РУБЕЖ' },
        { x: 681, y: 514, text: 'ЮЖНЫЙ КРАТЕРНЫЙ ПОЯС' }, { x: 190, y: 251, text: 'СТАРЫЕ ФАБРИКИ', dy: 31 },
      ],
    },
    siege: {
      id: 'terra-siege', label: 'ОСАДНЫЙ ПОЯС · ДВОРЕЦ', biome: 'siege',
      surface: '#211716', edge: '#a34e3c', grid: '#c48368', relief: '#a96451', road: '#b96950', ruin: '#bd5f49',
      terrainLight: '#472921', terrainDark: '#1c1716', waste: '#8b392d', terrainStroke: '#c17c64',
      landmarks: [
        { x: 304, y: 229, text: 'ВНЕШНЯЯ ОБОРОНИТЕЛЬНАЯ ЛИНИЯ' }, { x: 500, y: 371, text: 'ПРОЛОМ ВОРОТ' },
        { x: 658, y: 490, text: 'ДВОРЦОВЫЙ КОМПЛЕКС' }, { x: 780, y: 221, text: 'ЗОНА БОМБАРДИРОВОК' },
        { x: 263, y: 452, text: 'КРАТЕРНЫЙ РУБЕЖ' }, { x: 642, y: 188, text: 'ПЕПЕЛЬНЫЕ КВАРТАЛЫ' },
      ],
    },
  },
}

export function getPlanetMapTheme(planetId, eraId, factionId = 'imperium') {
  // Preserve compatibility with the former (eraId, factionId) signature.
  if (planetId === 'unification' || planetId === 'siege') {
    factionId = eraId || 'imperium'
    eraId = planetId
    planetId = 'terra'
  }
  const planetProfiles = surfaceProfiles[planetId] || surfaceProfiles.terra
  const surface = planetProfiles[eraId] || planetProfiles.unification
  const faction = factionAccents[factionId] || factionAccents.imperium
  return {
    ...surface,
    style: {
      '--map-surface': surface.surface,
      '--map-edge': surface.edge,
      '--map-grid': surface.grid,
      '--map-relief': surface.relief,
      '--map-road': surface.road,
      '--map-ruin': surface.ruin,
      '--map-terrain-light': surface.terrainLight,
      '--map-terrain-dark': surface.terrainDark,
      '--map-waste': surface.waste,
      '--map-terrain-stroke': surface.terrainStroke,
      '--map-accent': faction.accent,
      '--control-player-fill': faction.playerFill,
      '--control-player-stroke': faction.playerStroke,
      '--control-player-pattern': faction.playerLine,
    },
  }
}
