import { imperiumOriginMap, imperiumOriginUnits } from './imperiumOriginBattle'

const playerStart = imperiumOriginUnits.filter((unit) => unit.side === 'player')
const captureEnemies = imperiumOriginUnits.filter((unit) => unit.side === 'enemy')
const missionTerrain = imperiumOriginMap.cells.map(({ x, y, type }) => ({ x, y, type }))
const siegeTerrain = missionTerrain.map((cell) => ({
  ...cell,
  type: cell.type === 'cover' ? 'obstacle' : cell.type === 'obstacle' ? 'cover' : cell.type,
}))

const coreMissionConfigs = [
  {
    id: 'terra-north-capture', territoryId: 'terra-northern-front', name: 'Захват плацдарма', type: 'capture',
    description: 'Займите узел снабжения и удерживайте его, пока передовой отряд закрепляет позиции.', story: 'Караван открыл путь к северному узлу. Мятежники уже стягиваются к перекрёстку.',
    planetId: 'terra', eraId: 'unification', mapSize: { width: 12, height: 12 }, terrain: missionTerrain,
    initialUnits: [...playerStart, ...captureEnemies],
    objectives: [{ id: 'north-supply-point', type: 'capture_point', name: 'Узел снабжения', x: 5, y: 3, requiredRounds: 2, contestRadius: 1 }],
    strategicObjects: [], victoryConditions: { captureRounds: 2, maxRounds: 8 }, defeatConditions: { allAlliesDestroyed: true, maxRounds: 8 },
    reinforcements: [],
    onVictoryConsequences: [{ id: 'north-capture-supply', type: 'heal_lowest_hp_unit', amount: 10, requiresSurvivingUnits: 3, nextMissionId: 'terra-north-destroy', description: 'При трёх выживших отрядах: до +10 HP одному повреждённому подразделению следующей операции.' }],
    rewards: [],
  },
  {
    id: 'terra-north-destroy', territoryId: 'terra-northern-front', name: 'Уничтожение артиллерии', type: 'destroy',
    description: 'Выведите из строя артиллерийскую батарею мятежников.', story: 'Захваченный плацдарм позволил обнаружить батарею, обстреливающую колонны объединённых сил.',
    planetId: 'terra', eraId: 'unification', mapSize: { width: 12, height: 12 }, terrain: missionTerrain,
    initialUnits: [
      ...playerStart.map((unit, index) => ({ ...unit, x: [2, 2, 2][index], y: [8, 6, 4][index], hp: [6, 7, 8][index], maxHp: 10 })),
      ...captureEnemies.map((unit, index) => ({ ...unit, id: `battery-guard-${index + 1}`, name: ['Дозор батареи', 'Охрана орудий', 'Передовой расчёт'][index], x: [8, 8, 9][index], y: [3, 6, 8][index] })),
    ],
    objectives: [],
    strategicObjects: [{ id: 'north-artillery', type: 'artillery_battery', name: 'Северная артиллерийская батарея', side: 'enemy', x: 6, y: 3, hp: 20, maxHp: 20, armor: 2, blocksMovement: true, blocksLineOfSight: true, status: 'active', primary: true }],
    victoryConditions: { destroyPrimaryObject: true, maxRounds: 8 }, defeatConditions: { allAlliesDestroyed: true, maxRounds: 8 },
    reinforcements: [],
    onVictoryConsequences: [{ id: 'north-battery-reinforcement-reduction', type: 'reduce_reinforcements', amount: 1, nextMissionId: 'terra-north-defend', description: 'На одну вражескую волну подкрепления меньше в оборонительной операции.' }],
    rewards: [],
  },
  {
    id: 'terra-north-defend', territoryId: 'terra-northern-front', name: 'Оборона укреплений', type: 'defend',
    description: 'Защитите командный узел в течение пяти раундов.', story: 'После уничтожения батареи противник бросил резервы на последний штурм. Удержите укрепления.',
    planetId: 'terra', eraId: 'unification', mapSize: { width: 12, height: 12 }, terrain: missionTerrain,
    initialUnits: [
      ...playerStart.map((unit, index) => ({ ...unit, x: [3, 2, 2][index], y: [8, 6, 4][index], hp: [8, 7, 9][index], maxHp: 10 })),
      ...captureEnemies.map((unit, index) => ({ ...unit, id: `siege-raider-${index + 1}`, name: ['Штурмовой налётчик', 'Осадная банда', 'Резерв мятежников'][index], x: [8, 8, 10][index], y: [3, 7, 5][index] })),
    ],
    objectives: [],
    strategicObjects: [{ id: 'north-command-post', type: 'command_post', name: 'Командный узел укреплений', side: 'player', x: 5, y: 3, hp: 32, maxHp: 32, armor: 4, blocksMovement: true, blocksLineOfSight: true, status: 'active', primary: true }],
    victoryConditions: { defendRounds: 5, maxRounds: 7 }, defeatConditions: { allAlliesDestroyed: true, primaryObjectDestroyed: true, maxRounds: 7 },
    reinforcements: [
      { id: 'north-wave-3', round: 3, unit: { id: 'north-reserve-3', name: 'Подкрепление мятежников I', unitType: 'raider', hp: 6, maxHp: 6, attack: 3, armor: 1, attackRange: 2, moveRange: 2, status: 'visible' }, spawnCandidates: [{ x: 10, y: 1 }, { x: 11, y: 2 }, { x: 10, y: 2 }] },
      { id: 'north-wave-5', round: 5, unit: { id: 'north-reserve-5', name: 'Подкрепление мятежников II', unitType: 'raider', hp: 7, maxHp: 7, attack: 4, armor: 1, attackRange: 2, moveRange: 2, status: 'visible' }, spawnCandidates: [{ x: 10, y: 10 }, { x: 11, y: 9 }, { x: 10, y: 9 }] },
    ],
    onVictoryConsequences: [], rewards: [],
  },
  {
    id: 'terra-siege-wall-breach', territoryId: 'terra-siege-outer-palace', name: 'Пролом внешнего рубежа', type: 'destroy',
    description: 'Уничтожьте осадную батарею, обстреливающую внешние стены дворца.', story: 'Предательские легионы пробили внешнюю линию. Разведка обнаружила батарею, которая наводит огонь на ворота.',
    planetId: 'terra', eraId: 'siege', mapSize: { width: 12, height: 12 }, terrain: siegeTerrain,
    initialUnits: [
      ...playerStart.map((unit, index) => ({ ...unit, id: `palace-guard-${index + 1}`, name: ['Гвардия внешней стены', 'Стрелки дворца', 'Батарейный расчёт'][index], x: [2, 2, 3][index], y: [8, 6, 4][index], hp: [8, 7, 9][index], maxHp: 10 })),
      ...captureEnemies.map((unit, index) => ({ ...unit, id: `traitor-siege-${index + 1}`, name: ['Штурмовая группа', 'Предательские стрелки', 'Осадный эскорт'][index], x: [8, 8, 9][index], y: [3, 7, 5][index] })),
    ],
    objectives: [],
    strategicObjects: [{ id: 'terra-siege-gun', type: 'siege_battery', name: 'Осадная батарея предателей', side: 'enemy', x: 6, y: 3, hp: 24, maxHp: 24, armor: 3, blocksMovement: true, blocksLineOfSight: true, status: 'active', primary: true }],
    victoryConditions: { destroyPrimaryObject: true, maxRounds: 9 }, defeatConditions: { allAlliesDestroyed: true, maxRounds: 9 },
    reinforcements: [], onVictoryConsequences: [], rewards: [],
  },
  {
    id: 'terra-siege-palace-defense', territoryId: 'terra-siege-inner-defenses', name: 'Последний периметр', type: 'defend',
    description: 'Удержите командный узел внутренней цитадели пять раундов.', story: 'Батарея умолкла, но осадные отряды уже идут к внутреннему периметру. Защитники дворца готовят последний рубеж.',
    planetId: 'terra', eraId: 'siege', mapSize: { width: 12, height: 12 }, terrain: siegeTerrain,
    initialUnits: [
      ...playerStart.map((unit, index) => ({ ...unit, id: `palace-inner-${index + 1}`, name: ['Дворцовый страж', 'Защитники цитадели', 'Тяжёлая батарея'][index], x: [3, 2, 2][index], y: [8, 6, 4][index], hp: [8, 8, 10][index], maxHp: 10 })),
      ...captureEnemies.map((unit, index) => ({ ...unit, id: `traitor-inner-${index + 1}`, name: ['Штурмовой предатель', 'Осадный легионер', 'Резерв Хоруса'][index], x: [8, 8, 10][index], y: [3, 7, 5][index] })),
    ],
    objectives: [],
    strategicObjects: [{ id: 'terra-inner-command', type: 'command_post', name: 'Командный узел внутренней цитадели', side: 'player', x: 5, y: 3, hp: 38, maxHp: 38, armor: 4, blocksMovement: true, blocksLineOfSight: true, status: 'active', primary: true }],
    victoryConditions: { defendRounds: 5, maxRounds: 7 }, defeatConditions: { allAlliesDestroyed: true, primaryObjectDestroyed: true, maxRounds: 7 },
    reinforcements: [
      { id: 'palace-traitor-wave-3', round: 3, unit: { id: 'traitor-palace-reserve-3', name: 'Резерв осады I', unitType: 'raider', hp: 7, maxHp: 7, attack: 4, armor: 1, attackRange: 2, moveRange: 2, status: 'visible' }, spawnCandidates: [{ x: 10, y: 1 }, { x: 11, y: 2 }, { x: 10, y: 2 }] },
      { id: 'palace-traitor-wave-5', round: 5, unit: { id: 'traitor-palace-reserve-5', name: 'Резерв осады II', unitType: 'raider', hp: 8, maxHp: 8, attack: 4, armor: 2, attackRange: 2, moveRange: 2, status: 'visible' }, spawnCandidates: [{ x: 10, y: 10 }, { x: 11, y: 9 }, { x: 10, y: 9 }] },
    ],
    onVictoryConsequences: [], rewards: [],
  },
]

const independentSectorStarts = [
  { id: 'terra-west-basin-capture', territoryId: 'terra-western-basin', name: 'Захват промышленного узла', target: 'Промышленный узел', description: 'Закрепитесь у западного склада и откройте безопасный маршрут снабжения.', story: 'На западе мятежники заняли складской перекрёсток. Экспедиция может начать с освобождения промышленного узла.' },
  { id: 'terra-east-reach-capture', territoryId: 'terra-eastern-reach', name: 'Бой у восточных перевалов', target: 'Восточный перевал', description: 'Займите перевал и обеспечьте проход через восточные укрепления.', story: 'Восточные отряды удерживают проход между укреплениями. Передовой группе приказано занять перевал.' },
  { id: 'terra-central-plateau-capture', territoryId: 'terra-central-plateau', name: 'Захват центрального перекрёстка', target: 'Центральный перекрёсток', description: 'Удержите перекрёсток, связывающий северные и южные маршруты.', story: 'Центральное плато остаётся спорной территорией. Заняв перекрёсток, войска смогут выбрать направление дальнейшего наступления.' },
  { id: 'terra-southern-expanse-capture', territoryId: 'terra-southern-expanse', name: 'Операция у южного рубежа', target: 'Южный рубеж', description: 'Займите рубежную точку и установите контроль над южным маршрутом.', story: 'На юге обнаружен малый гарнизон мятежников. Экспедиция может начать наступление с этого удалённого рубежа.' },
].map((sector) => {
  const template = coreMissionConfigs.find((mission) => mission.id === 'terra-north-capture')
  return {
    ...template,
    ...sector,
    objectives: template.objectives.map((objective) => ({ ...objective, id: `${sector.id}-objective`, name: sector.target })),
    initialUnits: template.initialUnits.map((unit) => ({ ...unit, id: `${sector.id}-${unit.id}` })),
    onVictoryConsequences: [],
    rewards: [],
  }
})

export const missionConfigs = [...coreMissionConfigs, ...independentSectorStarts]

export const missionById = Object.fromEntries(missionConfigs.map((mission) => [mission.id, mission]))
