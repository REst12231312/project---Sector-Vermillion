export const territoryConfigs = [{
  id: 'terra-northern-front',
  planetId: 'terra',
  planetName: 'Терра',
  eraId: 'unification',
  eraName: 'Объединительные войны',
  name: 'Северный фронт',
  description: 'Откройте дорогу к северным поселениям: захватите плацдарм, уничтожьте батарею и удержите укрепления.',
  strategicValue: 'Контроль над высотами прикрывает подступы к северным поселениям и связывает артиллерию с линией снабжения.',
  missions: ['terra-north-capture', 'terra-north-destroy', 'terra-north-defend'],
}, {
  id: 'terra-western-basin', planetId: 'terra', planetName: 'Терра', eraId: 'unification', eraName: 'Объединительные войны',
  name: 'Западный бассейн', description: 'Промышленные поселения и старые транспортные артерии западного полушария.', strategicValue: 'Промышленные узлы обеспечивают экспедицию припасами и открывают западный маршрут.', missions: ['terra-west-basin-capture'],
}, {
  id: 'terra-eastern-reach', planetId: 'terra', planetName: 'Терра', eraId: 'unification', eraName: 'Объединительные войны',
  name: 'Восточный предел', description: 'Разрозненные укрепления на пути к восточным перевалам.', strategicValue: 'Пограничные форты контролируют проходы через восточные перевалы.', missions: ['terra-east-reach-capture'],
}, {
  id: 'terra-central-plateau', planetId: 'terra', planetName: 'Терра', eraId: 'unification', eraName: 'Объединительные войны',
  name: 'Центральное плато', description: 'Перекрёсток снабжения, связывающий северные и южные провинции.', strategicValue: 'Командный узел плато соединяет основные маршруты между фронтами.', missions: ['terra-central-plateau-capture'],
}, {
  id: 'terra-southern-expanse', planetId: 'terra', planetName: 'Терра', eraId: 'unification', eraName: 'Объединительные войны',
  name: 'Южные пространства', description: 'Редко населённые земли за пределами укреплённой центральной зоны.', strategicValue: 'Южный рубеж защищает тыл и позволяет обходить укрепления центральной зоны.', missions: ['terra-southern-expanse-capture'],
}, {
  id: 'terra-siege-outer-palace', planetId: 'terra', planetName: 'Терра', eraId: 'siege', eraName: 'Осада Терры',
  name: 'Внешние рубежи дворца', description: 'Разрушенные стены и огневые позиции внешнего кольца обороны.', strategicValue: 'Внешнее кольцо принимает главный удар и прикрывает внутренние укрепления дворца.', missions: ['terra-siege-wall-breach'],
}, {
  id: 'terra-siege-inner-defenses', planetId: 'terra', planetName: 'Терра', eraId: 'siege', eraName: 'Осада Терры',
  name: 'Внутренний периметр', description: 'Последние укрепления между предательскими войсками и Императорским дворцом.', strategicValue: 'Командный сектор удерживает последний оборонительный пояс вокруг дворца.', missions: ['terra-siege-palace-defense'],
}]

export const territoryById = Object.fromEntries(territoryConfigs.map((territory) => [territory.id, territory]))
