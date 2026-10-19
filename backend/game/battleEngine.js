// Standalone, deterministic-if-seeded rules engine. It has no Express or storage dependencies.
export const MAP_SIZE = 12
export const FACTIONS = ['imperium', 'chaos', 'orks', 'tau']

export const UNIT_TYPES = {
  imperium: [
    { type: 'tactical', name: 'Тактический десантник', hp: 12, toughness: 4, save: 3, ranged: { name: 'Болтер', attacks: 2, skill: 3, strength: 4, ap: -1, damage: 2, range: 3 }, melee: { name: 'Цепной меч', attacks: 3, skill: 3, strength: 4, ap: -1, damage: 1, range: 1 } },
    { type: 'terminator', name: 'Терминатор', hp: 16, toughness: 5, save: 2, ranged: { name: 'Штурмболтер', attacks: 3, skill: 3, strength: 4, ap: 0, damage: 1, range: 3 }, melee: { name: 'Силовой кулак', attacks: 2, skill: 4, strength: 8, ap: -2, damage: 2, range: 1 } },
    { type: 'scout', name: 'Снайпер-разведчик', hp: 9, toughness: 3, save: 5, ranged: { name: 'Снайперская винтовка', attacks: 1, skill: 2, strength: 6, ap: -2, damage: 3, range: 5 }, melee: { name: 'Боевой нож', attacks: 2, skill: 4, strength: 3, ap: 0, damage: 1, range: 1 } },
  ],
  chaos: [
    { type: 'legionary', name: 'Легионер Хаоса', hp: 12, toughness: 4, save: 3, ranged: { name: 'Болтер', attacks: 2, skill: 3, strength: 4, ap: -1, damage: 2, range: 3 }, melee: { name: 'Цепной меч', attacks: 3, skill: 3, strength: 4, ap: -1, damage: 1, range: 1 } },
    { type: 'chaos-terminator', name: 'Терминатор Хаоса', hp: 16, toughness: 5, save: 2, ranged: { name: 'Штурмболтер', attacks: 3, skill: 3, strength: 4, ap: 0, damage: 1, range: 3 }, melee: { name: 'Силовой кулак', attacks: 2, skill: 4, strength: 8, ap: -2, damage: 2, range: 1 } },
    { type: 'havoc', name: 'Хавок', hp: 9, toughness: 3, save: 5, ranged: { name: 'Автопушка «Жнец»', attacks: 1, skill: 2, strength: 6, ap: -2, damage: 3, range: 5 }, melee: { name: 'Боевой нож', attacks: 2, skill: 4, strength: 3, ap: 0, damage: 1, range: 1 } },
  ],
  orks: [
    { type: 'boy', name: 'Орк Бой', hp: 14, toughness: 4, save: 5, ranged: { name: 'Шута', attacks: 3, skill: 5, strength: 4, ap: 0, damage: 1, range: 3 }, melee: { name: 'Чоппа', attacks: 4, skill: 3, strength: 5, ap: -1, damage: 1, range: 1 } },
    { type: 'nob', name: 'Ноб', hp: 17, toughness: 5, save: 4, ranged: { name: 'Слагга', attacks: 2, skill: 5, strength: 4, ap: 0, damage: 1, range: 2 }, melee: { name: 'Силовая клешня', attacks: 3, skill: 4, strength: 8, ap: -2, damage: 2, range: 1 } },
    { type: 'loota', name: 'Лута', hp: 10, toughness: 4, save: 6, ranged: { name: 'Деффган', attacks: 4, skill: 5, strength: 7, ap: -1, damage: 2, range: 4 }, melee: { name: 'Импровизированный тесак', attacks: 2, skill: 4, strength: 4, ap: 0, damage: 1, range: 1 } },
  ],
  tau: [
    { type: 'fire-warrior', name: 'Огневой воин', hp: 12, toughness: 3, save: 4, ranged: { name: 'Импульсная винтовка', attacks: 2, skill: 3, strength: 5, ap: 0, damage: 1, range: 5 }, melee: { name: 'Фукусная схватка', attacks: 2, skill: 5, strength: 3, ap: 0, damage: 1, range: 1 } },
    { type: 'crisis-suit', name: 'Кризис-костюм', hp: 15, toughness: 5, save: 3, ranged: { name: 'Импульсный бластер', attacks: 3, skill: 3, strength: 5, ap: -1, damage: 2, range: 4 }, melee: { name: 'Удар сервопривода', attacks: 3, skill: 4, strength: 5, ap: 0, damage: 1, range: 1 } },
    { type: 'pathfinder', name: 'Следопыт', hp: 9, toughness: 3, save: 5, ranged: { name: 'Рельсовая винтовка', attacks: 1, skill: 3, strength: 8, ap: -2, damage: 3, range: 6 }, melee: { name: 'Боевой нож', attacks: 2, skill: 5, strength: 3, ap: 0, damage: 1, range: 1 } },
  ],
}

const DEFAULT_OBSTACLES = [[4, 2], [7, 2], [4, 3], [7, 3], [4, 8], [7, 8], [4, 9], [7, 9], [5, 4], [6, 7]]
const DEFAULT_COVER = [[2, 4], [3, 7], [8, 4], [9, 7], [5, 6], [6, 5]]
const DEFAULT_CONTROL_POINTS = [[2, 5], [6, 6], [9, 5]]
export const MAPS = [
  { id: 'sector-crossing', name: 'Перекрёсток Сектора', obstacles: DEFAULT_OBSTACLES, cover: DEFAULT_COVER, controlPoints: DEFAULT_CONTROL_POINTS },
  { id: 'rust-cathedral', name: 'Ржавая Кафедра', obstacles: [[2, 2], [9, 2], [2, 9], [9, 9], [4, 4], [7, 4], [4, 7], [7, 7], [6, 3], [5, 8], [3, 5], [8, 5], [3, 6], [8, 6]], cover: [[1, 4], [10, 7], [1, 7], [10, 4], [4, 2], [7, 9], [4, 9], [7, 2], [6, 5], [5, 6]], controlPoints: DEFAULT_CONTROL_POINTS },
  { id: 'ash-wastes', name: 'Пепельные Пустоши', obstacles: [[3, 2], [8, 2], [3, 9], [8, 9], [5, 3], [6, 3], [5, 8], [6, 8], [2, 7], [9, 4], [2, 4], [9, 7]], cover: [[2, 3], [9, 8], [2, 8], [9, 3], [4, 5], [7, 6], [4, 6], [7, 5], [5, 5], [6, 6]], controlPoints: DEFAULT_CONTROL_POINTS },
]
export const OBSTACLES = DEFAULT_OBSTACLES
export const COVER = DEFAULT_COVER
export const CONTROL_POINT_CELLS = DEFAULT_CONTROL_POINTS
export const FACTION_ABILITIES = {
  imperium: { name: 'Тактическая дисциплина', description: 'Один раз за матч перебрось один промах в атаке.', passive: 'На своей контрольной точке отряды получают укрытие от стрельбы.' },
  chaos: { name: 'Благословение варпа', description: 'Один раз за матч получи +1 к силе оружия в атаке.', passive: 'Раненые отряды Хаоса получают +1 к силе ближнего боя.' },
  orks: { name: 'Дави их!', description: 'Один раз за матч добавь 2 атаки в ближнем бою.', passive: 'Сражаясь рядом с союзником, орки получают +1 атаку в ближнем бою.' },
  tau: { name: 'Метка цели', description: 'Один раз за матч улучши стрельбу на 1 и игнорируй укрытие.', passive: 'Неподвижные стрелки Тау получают +1 к дальности оружия.' },
}
const clone = (value) => JSON.parse(JSON.stringify(value))
export const distance = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
const isObstacle = (match, x, y) => match.obstacles.some(({ x: ox, y: oy }) => ox === x && oy === y)
const isCover = (match, x, y) => match.cover.some(({ x: cx, y: cy }) => cx === x && cy === y)

function lineCells(from, to) {
  const cells = []
  let x = from.x, y = from.y
  const dx = Math.abs(to.x - from.x), dy = Math.abs(to.y - from.y)
  const sx = from.x < to.x ? 1 : -1, sy = from.y < to.y ? 1 : -1
  let error = dx - dy
  while (x !== to.x || y !== to.y) {
    const twiceError = 2 * error
    if (twiceError > -dy) { error -= dy; x += sx }
    if (twiceError < dx) { error += dx; y += sy }
    if (x !== to.x || y !== to.y) cells.push({ x, y })
  }
  return cells
}

export function createBattle({ id, players, firstPlayerIndex = 0, topPlayerIndex = 0, reverseObjectives = false, mapId = 'sector-crossing', now = Date.now() }) {
  if (!Array.isArray(players) || players.length !== 2 || players.some((player) => !FACTIONS.includes(player.faction))) throw new Error('A battle requires two players with supported factions.')
  const map = MAPS.find((candidate) => candidate.id === mapId) || MAPS[0]
  const ordered = players.map((player, index) => ({ ...player, index, factionAbilityUsed: false }))
  return {
    id, status: 'active', players: ordered, activePlayer: firstPlayerIndex, roundStartPlayer: firstPlayerIndex, turn: 1,
    mapId: map.id, mapName: map.name, startedAt: now, finishedAt: null, winMethod: null,
    units: ordered.flatMap((player) => UNIT_TYPES[player.faction].map((template, index) => {
      const isTop = player.index === topPlayerIndex
      const x = (isTop ? [2, 5, 8] : [9, 6, 3])[index]
      const y = isTop ? 0 : MAP_SIZE - 1
      return { id: `${player.index}-${template.type}`, type: template.type, name: template.name, playerIndex: player.index, x, y, hp: template.hp, maxHp: template.hp, toughness: template.toughness, save: template.save, weapons: clone({ ranged: template.ranged, melee: template.melee }), hasMoved: false, hasAttacked: false }
    })),
    obstacles: map.obstacles.map(([x, y]) => ({ x, y })), cover: map.cover.map(([x, y]) => ({ x, y })),
    stats: { attackActions: 0, damage: 0, destroyedUnits: 0 },
    controlPoints: map.controlPoints.map(([x, y], index) => ({
      id: `point-${index + 1}`, x: reverseObjectives ? MAP_SIZE - 1 - x : x,
      y: reverseObjectives ? MAP_SIZE - 1 - y : y, ownerIndex: null, capture: null,
    })),
    log: [{ id: 'start', turn: 1, text: 'Связь установлена. Операция началась.' }],
    winnerIndex: null, winReason: null, updatedAt: now,
  }
}

function addLog(match, text, event = null) {
  const id = (match.log.at(-1)?.sequence || match.log.length) + 1
  match.log.push({ id: `${match.id}-${match.turn}-${id}`, sequence: id, turn: match.turn, text, ...(event ? { event } : {}) })
  if (match.log.length > 100) match.log.shift()
}

function getOwnedActiveUnit(match, player, unitId) {
  if (match.status !== 'active') return { error: 'Операция уже завершена.', status: 409 }
  if (match.activePlayer !== player.index) return { error: 'Сейчас ход противника.', status: 409 }
  const unit = match.units.find((item) => item.id === unitId && item.playerIndex === player.index && item.hp > 0)
  if (!unit) return { error: 'Отряд не найден или уничтожен.', status: 404 }
  return { unit }
}

function canMove(match, unit, x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return 'Клетка вне карты.'
  if (distance(unit, { x, y }) !== 1) return 'Перемещение доступно на одну клетку в любом направлении.'
  if (isObstacle(match, x, y) || match.units.some((other) => other.hp > 0 && other.x === x && other.y === y)) return 'Клетка занята или заблокирована.'
  if (Math.abs(unit.x - x) === 1 && Math.abs(unit.y - y) === 1 && isObstacle(match, unit.x, y) && isObstacle(match, x, unit.y)) return 'Нельзя пройти по диагонали между двумя препятствиями.'
  return null
}

function clearCapture(match, unitId) {
  for (const point of match.controlPoints) if (point.capture?.unitId === unitId) point.capture = null
}

export function calculateWoundTarget(strength, toughness) {
  if (strength >= toughness * 2) return 2
  if (strength > toughness) return 3
  if (strength === toughness) return 4
  if (strength * 2 <= toughness) return 6
  return 5
}

export function rollD6(random = Math.random) { return Math.floor(random() * 6) + 1 }

function attackValidation(match, player, unit, target, weaponType, payload = {}) {
  if (!target || target.hp <= 0 || target.playerIndex === player.index) return 'Цель не найдена.'
  if (unit.hasAttacked) return 'Этот отряд уже атаковал в текущем ходу.'
  if (!['ranged', 'melee'].includes(weaponType)) return 'Выбери оружие для атаки.'
  if (payload.useAbility) {
    if (player.factionAbilityUsed) return 'Способность фракции уже использована в этом матче.'
    if (player.faction === 'orks' && weaponType !== 'melee') return 'Способность орков действует только в ближнем бою.'
    if (player.faction === 'tau' && weaponType !== 'ranged') return 'Метка цели применяется только при стрельбе.'
  }
  const weapon = unit.weapons[weaponType]
  const range = distance(unit, target)
  if (weaponType === 'melee' && range !== 1) return 'Для ближней атаки цель должна стоять на соседней клетке.'
  const tauStationaryRange = player.faction === 'tau' && weaponType === 'ranged' && !unit.hasMoved ? 1 : 0
  if (weaponType === 'ranged' && range > weapon.range + tauStationaryRange) return `Цель вне дальности оружия (${weapon.range + tauStationaryRange}).`
  if (weaponType === 'ranged' && match.units.some((other) => other.hp > 0 && other.playerIndex !== player.index && distance(unit, other) === 1)) return 'Нельзя стрелять, пока рядом находится противник.'
  if (weaponType === 'ranged' && match.units.some((other) => other.hp > 0 && other.playerIndex !== player.index && other.id !== target.id && distance(target, other) === 1)) return 'Нельзя стрелять по цели, вступившей в ближний бой.'
  if (lineCells(unit, target).some(({ x, y }) => isObstacle(match, x, y))) return 'Препятствие перекрывает линию огня.'
  return null
}

function finishBattle(match, winnerIndex, reason, winMethod = 'battle') {
  match.status = 'finished'; match.winnerIndex = winnerIndex; match.winReason = reason; match.winMethod = winMethod
  addLog(match, `${match.players[winnerIndex].username} одержал победу. ${reason}`)
}

function alliedUnitNearby(match, unit, playerIndex) {
  return match.units.some((other) => other.id !== unit.id && other.hp > 0 && other.playerIndex === playerIndex && distance(other, unit) === 1)
}

function resolveAttack(match, player, { unitId, targetUnitId, weaponType, useAbility = false }, random) {
  const access = getOwnedActiveUnit(match, player, unitId)
  if (access.error) return access
  const { unit } = access
  const target = match.units.find((item) => item.id === targetUnitId && item.hp > 0 && item.playerIndex !== player.index)
  const payload = { useAbility }
  const validationError = attackValidation(match, player, unit, target, weaponType, payload)
  if (validationError) return { error: validationError, status: unit.hasAttacked ? 409 : 400 }
  const weapon = unit.weapons[weaponType]

  unit.hasAttacked = true
  if (useAbility) player.factionAbilityUsed = true
  const attacks = []
  let totalDamage = 0
  const orkMobBonus = player.faction === 'orks' && weaponType === 'melee' && alliedUnitNearby(match, unit, player.index) ? 1 : 0
  const attackCount = weapon.attacks + orkMobBonus + (useAbility && player.faction === 'orks' ? 2 : 0)
  const chaosWoundedBonus = player.faction === 'chaos' && weaponType === 'melee' && unit.hp <= unit.maxHp / 2 ? 1 : 0
  const strengthBonus = (useAbility && player.faction === 'chaos' ? 1 : 0) + chaosWoundedBonus
  const tauMark = useAbility && player.faction === 'tau' && weaponType === 'ranged'
  let imperiumRerollAvailable = useAbility && player.faction === 'imperium'
  for (let index = 0; index < attackCount; index += 1) {
    let hit = rollD6(random)
    const result = { hit, wound: null, save: null, damage: 0 }
    if (imperiumRerollAvailable && (hit < weapon.skill || hit === 1)) {
      result.hitReroll = rollD6(random)
      result.originalHit = hit
      hit = result.hitReroll
      result.hit = hit
      imperiumRerollAvailable = false
    }
    const requiredHit = Math.max(2, weapon.skill - (tauMark ? 1 : 0))
    if (hit >= requiredHit && hit !== 1) {
      const wound = rollD6(random); result.wound = wound
      if (wound >= calculateWoundTarget(weapon.strength + strengthBonus, target.toughness) && wound !== 1) {
        const standingOnOwnPoint = match.controlPoints.some((point) => point.x === target.x && point.y === target.y && point.ownerIndex === target.playerIndex)
        const hasCover = isCover(match, target.x, target.y) || (target.playerIndex !== undefined && match.players[target.playerIndex].faction === 'imperium' && standingOnOwnPoint)
        const coverBonus = weaponType === 'ranged' && hasCover && !tauMark ? 1 : 0
        const saveTarget = target.save - weapon.ap - coverBonus
        const save = rollD6(random); result.save = save
        if (save < saveTarget || save === 1) {
          result.damage = Math.min(weapon.damage, Math.max(0, target.hp))
          target.hp = Math.max(0, target.hp - weapon.damage)
          totalDamage += result.damage
        }
      }
    }
    attacks.push(result)
  }
  match.stats ||= { attackActions: 0, damage: 0, destroyedUnits: 0 }
  match.stats.attackActions += 1
  match.stats.damage += totalDamage
  if (target.hp === 0) match.stats.destroyedUnits += 1
  if (target.hp === 0) clearCapture(match, target.id)
  const summary = attacks.map(({ hit, hitReroll, originalHit, wound, save, damage }) => `попадание ${originalHit ? `${originalHit}→${hitReroll}` : hit}${wound === null ? '' : ` · ранение ${wound}`}${save === null ? '' : ` · спасбросок ${save}`}${damage ? ` · ${damage} урона` : ''}`).join(' / ')
  const abilityLabel = useAbility ? ` Способность: ${FACTION_ABILITIES[player.faction].name}.` : ''
  const attack = { weapon: weapon.name, totalDamage, attacks, targetHp: target.hp, ability: useAbility ? FACTION_ABILITIES[player.faction].name : null, abilityUsed: useAbility }
  addLog(match, `${unit.name}: ${weapon.name} → ${target.name} (${totalDamage} урона).${abilityLabel} ${summary}`, {
    type: 'attack', attackerUnitId: unit.id, targetUnitId: target.id, destroyed: target.hp === 0, attack,
  })
  const survivors = match.units.filter((item) => item.playerIndex !== player.index && item.hp > 0).length
  if (survivors === 0) finishBattle(match, player.index, 'Все отряды противника уничтожены.', 'annihilation')
  return { attack }
}

function updateCaptures(match, playerIndex) {
  for (const point of match.controlPoints) {
    const captureUnit = point.capture && match.units.find((unit) => unit.id === point.capture.unitId && unit.hp > 0 && unit.playerIndex === point.capture.playerIndex && unit.x === point.x && unit.y === point.y)
    if (point.capture && !captureUnit) point.capture = null
    const unit = match.units.find((item) => item.hp > 0 && item.playerIndex === playerIndex && item.x === point.x && item.y === point.y)
    if (!unit || point.ownerIndex === playerIndex) {
      if (point.capture?.playerIndex === playerIndex) point.capture = null
      continue
    }
    if (point.capture?.playerIndex === playerIndex && point.capture.unitId === unit.id) point.capture.turns += 1
    else point.capture = { playerIndex, unitId: unit.id, turns: 1 }
    if (point.capture.turns >= 2) {
      point.ownerIndex = playerIndex; point.capture = null
      addLog(match, `${match.players[playerIndex].username} захватил контрольную точку ${point.id.slice(-1)}.`, { type: 'capture', pointId: point.id })
    }
  }
  if (match.controlPoints.every((point) => point.ownerIndex === playerIndex)) finishBattle(match, playerIndex, 'Захвачены все три контрольные точки.', 'objectives')
}

function surrender(match, player) {
  if (match.status !== 'active') return { error: 'Операция уже завершена.', status: 409 }
  const winner = match.players.find((candidate) => candidate.index !== player.index)
  finishBattle(match, winner.index, `${player.username} сдался и покинул операцию.`, 'surrender')
}

function reduceAction(match, player, type, payload, random) {
  if (type === 'surrender') return surrender(match, player)
  const unitId = payload?.unitId
  const access = getOwnedActiveUnit(match, player, unitId)
  if (type !== 'end-turn' && access.error) return access
  if (type === 'move') {
    const { unit } = access
    if (unit.hasMoved) return { error: 'Этот отряд уже перемещался в текущем ходу.', status: 409 }
    const x = payload.x, y = payload.y
    const error = canMove(match, unit, x, y)
    if (error) return { error }
    clearCapture(match, unit.id)
    const oldX = unit.x, oldY = unit.y
    unit.x = x; unit.y = y; unit.hasMoved = true
    addLog(match, `${unit.name} переместился на ${String.fromCharCode(65 + x)}${MAP_SIZE - y} из ${String.fromCharCode(65 + oldX)}${MAP_SIZE - oldY}.`, { type: 'move', unitId: unit.id, x, y, fromX: oldX, fromY: oldY })
    return {}
  }
  if (type === 'attack') return resolveAttack(match, player, payload || {}, random)
  if (type === 'end-turn') {
    if (match.status !== 'active') return { error: 'Операция уже завершена.', status: 409 }
    if (match.activePlayer !== player.index) return { error: 'Сейчас ход противника.', status: 409 }
    updateCaptures(match, player.index)
    if (match.status !== 'finished') {
      match.activePlayer = (player.index + 1) % match.players.length
      if (match.activePlayer === (match.roundStartPlayer ?? 0)) match.turn += 1
      for (const unit of match.units) if (unit.playerIndex === match.activePlayer && unit.hp > 0) { unit.hasMoved = false; unit.hasAttacked = false }
      addLog(match, `Ход игрока ${match.players[match.activePlayer].username}.`)
    }
    return {}
  }
  return { error: 'Неизвестное действие.' }
}

export function applyBattleAction(state, playerId, type, payload = {}, random = Math.random, now = Date.now()) {
  const player = state.players.find((candidate) => candidate.userId === playerId)
  if (!player) return { error: 'Операция недоступна.', status: 404, state }
  const next = clone(state)
  const nextPlayer = next.players.find((candidate) => candidate.userId === playerId)
  const result = reduceAction(next, nextPlayer, type, payload, random)
  if (result?.error) return { ...result, state }
  next.updatedAt = now
  if (next.status === 'finished') next.finishedAt = now
  return { state: next, attack: result?.attack }
}

export function availableMoves(state, playerId, unitId) {
  const player = state.players.find((candidate) => candidate.userId === playerId)
  const unit = state.units.find((candidate) => candidate.id === unitId && candidate.playerIndex === player?.index && candidate.hp > 0)
  if (!player || !unit || state.status !== 'active' || state.activePlayer !== player.index || unit.hasMoved) return []
  const cells = []
  for (let y = 0; y < MAP_SIZE; y += 1) for (let x = 0; x < MAP_SIZE; x += 1) if (!canMove(state, unit, x, y)) cells.push({ x, y })
  return cells
}

export function availableAttacks(state, playerId, unitId) {
  const player = state.players.find((candidate) => candidate.userId === playerId)
  const unit = state.units.find((candidate) => candidate.id === unitId && candidate.playerIndex === player?.index && candidate.hp > 0)
  if (!player || !unit || state.status !== 'active' || state.activePlayer !== player.index || unit.hasAttacked) return []
  const attacks = []
  for (const target of state.units) {
    if (target.hp <= 0 || target.playerIndex === player.index) continue
    for (const weaponType of ['ranged', 'melee']) if (!attackValidation(state, player, unit, target, weaponType)) attacks.push({ targetUnitId: target.id, weaponType })
  }
  return attacks
}

export function checkVictory(state) {
  if (state.status === 'finished') return { winnerIndex: state.winnerIndex, reason: state.winReason }
  for (const player of state.players) {
    if (state.units.every((unit) => unit.playerIndex === player.index || unit.hp <= 0)) return { winnerIndex: player.index, reason: 'Все отряды противника уничтожены.' }
    if (state.controlPoints.every((point) => point.ownerIndex === player.index)) return { winnerIndex: player.index, reason: 'Захвачены все три контрольные точки.' }
  }
  return null
}

export function battleSnapshot(state, viewerId) {
  const viewer = state.players.find((player) => player.userId === viewerId)
  return {
    id: state.id, status: state.status, players: state.players.map(({ userId, username, faction, index, factionAbilityUsed }) => ({ userId, username, faction, index, factionAbilityUsed: Boolean(factionAbilityUsed), factionAbility: FACTION_ABILITIES[faction] })),
    viewerIndex: viewer?.index ?? null, activePlayer: state.activePlayer, turn: state.turn,
    mapId: state.mapId || 'sector-crossing', mapName: state.mapName || MAPS[0].name,
    startedAt: state.startedAt || state.updatedAt, finishedAt: state.finishedAt || null, winMethod: state.winMethod || null,
    units: state.units, obstacles: state.obstacles, cover: state.cover, controlPoints: state.controlPoints,
    log: state.log.slice(-30), winnerIndex: state.winnerIndex, winReason: state.winReason,
    turnDeadlineAt: state.turnDeadlineAt || null,
    playerPresence: Object.fromEntries(state.players.map((player) => [player.index, {
      connected: state.playerPresence?.[player.userId]?.connected !== false,
      reconnectDeadlineAt: state.playerPresence?.[player.userId]?.reconnectDeadlineAt || null,
    }])),
    roomCode: state.roomCode || null,
  }
}
