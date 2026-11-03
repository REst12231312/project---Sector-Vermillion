const terrainByCoordinate = {
  '2,2': 'cover', '3,2': 'cover', '8,2': 'obstacle', '9,2': 'obstacle',
  '2,3': 'cover', '5,3': 'objective', '6,3': 'objective', '9,3': 'obstacle',
  '4,5': 'obstacle', '7,5': 'cover', '8,5': 'cover',
  '3,6': 'obstacle', '7,7': 'objective', '8,7': 'objective',
  '2,8': 'cover', '3,8': 'cover', '9,8': 'obstacle',
  '2,9': 'cover', '9,9': 'obstacle',
}

export const imperiumOriginMap = {
  width: 12,
  height: 12,
  cells: Array.from({ length: 144 }, (_, index) => {
    const x = index % 12
    const y = Math.floor(index / 12)
    return { x, y, type: terrainByCoordinate[`${x},${y}`] || 'plain' }
  }),
}

export const imperiumOriginUnits = [
  { id: 'terra-assault', name: 'Штурмовой отряд', side: 'player', unitType: 'assault', x: 1, y: 8, hp: 8, maxHp: 8, attack: 4, armor: 2, attackRange: 1, moveRange: 3, status: 'ready' },
  { id: 'terra-rifle', name: 'Стрелковый отряд', side: 'player', unitType: 'rifle', x: 1, y: 6, hp: 7, maxHp: 7, attack: 3, armor: 1, attackRange: 4, moveRange: 2, status: 'ready' },
  { id: 'terra-heavy', name: 'Тяжёлый отряд', side: 'player', unitType: 'heavy', x: 1, y: 4, hp: 10, maxHp: 10, attack: 5, armor: 3, attackRange: 3, moveRange: 1, status: 'ready' },
  { id: 'raider-alpha', name: 'Банда налётчиков', side: 'enemy', unitType: 'raider', x: 4, y: 4, hp: 6, maxHp: 6, attack: 3, armor: 1, attackRange: 2, moveRange: 2, status: 'visible' },
  { id: 'raider-beta', name: 'Охрана мятежников', side: 'enemy', unitType: 'raider', x: 4, y: 7, hp: 7, maxHp: 7, attack: 3, armor: 2, attackRange: 2, moveRange: 2, status: 'visible' },
  { id: 'raider-gamma', name: 'Засада у каравана', side: 'enemy', unitType: 'raider', x: 3, y: 8, hp: 5, maxHp: 5, attack: 4, armor: 1, attackRange: 1, moveRange: 3, status: 'visible' },
]

export const imperiumOriginObjectives = [
  { id: 'supply-caravan', name: 'Караван снабжения', x: 5, y: 3, status: 'contested' },
  { id: 'settlement-gate', name: 'Ворота поселения', x: 7, y: 7, status: 'neutral' },
]
