export const planetEraConfigs = [
  {
    id: 'unification', planetId: 'terra', title: 'Войны Объединения', chronologicalOrder: 1,
    description: 'Экспедиция Императора объединяет разрозненные земли Терры и прокладывает путь к новым поселениям.',
    unlock: { type: 'default' }, mapId: 'terra-unification',
    territoryIds: ['terra-northern-front', 'terra-western-basin', 'terra-eastern-reach', 'terra-central-plateau', 'terra-southern-expanse'],
    requiredMissionIds: ['terra-north-capture', 'terra-north-destroy', 'terra-north-defend', 'terra-west-basin-capture', 'terra-east-reach-capture', 'terra-central-plateau-capture', 'terra-southern-expanse-capture'],
  },
  {
    id: 'siege', planetId: 'terra', title: 'Осада Терры', chronologicalOrder: 2,
    description: 'Последняя оборона Императорского дворца: удержите внешние рубежи и остановите штурмовые машины предателей.',
    unlock: { type: 'all_completed', conditions: [{ type: 'mission_completed', missionId: 'siege-terra-loyalist' }] },
    hiddenUntilUnlocked: true, mapId: 'terra-siege',
    territoryIds: ['terra-siege-outer-palace', 'terra-siege-inner-defenses'],
    requiredMissionIds: ['terra-siege-wall-breach', 'terra-siege-palace-defense'],
  },
]

export const eraById = Object.fromEntries(planetEraConfigs.map((era) => [era.id, era]))
