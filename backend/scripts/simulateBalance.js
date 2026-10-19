import {
  availableAttacks, availableMoves, applyBattleAction, calculateWoundTarget,
  createBattle, COVER, CONTROL_POINT_CELLS, FACTIONS, MAP_SIZE, OBSTACLES,
} from '../game/battleEngine.js'

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 ? Number(args[index + 1]) : fallback
}
const matchCount = Math.max(100, Math.min(100000, option('--matches', 5000)))
const maxTurns = Math.max(10, Math.min(500, option('--max-turns', 100)))
const allFactionMode = args.includes('--all-factions')
const factionNames = { imperium: 'Империум', chaos: 'Хаос', orks: 'Орки', tau: 'Тау' }
const allMatchups = FACTIONS.flatMap((first, index) => FACTIONS.slice(index + 1).map((second) => [first, second]))
const matchups = allFactionMode ? allMatchups : [['imperium', 'orks']]

function makeRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function boardDistance(from, to, occupied = new Set()) {
  const queue = [{ ...from, distance: 0 }]
  const visited = new Set([`${from.x},${from.y}`])
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head]
    if (current.x === to.x && current.y === to.y) return current.distance
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
      if (!dx && !dy) continue
      const x = current.x + dx, y = current.y + dy, key = `${x},${y}`
      if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE || visited.has(key) || occupied.has(key) || OBSTACLES.some(([ox, oy]) => ox === x && oy === y)) continue
      if (dx && dy && OBSTACLES.some(([ox, oy]) => ox === current.x && oy === y) && OBSTACLES.some(([ox, oy]) => ox === x && oy === current.y)) continue
      visited.add(key)
      queue.push({ x, y, distance: current.distance + 1 })
    }
  }
  return Infinity
}

function attackValue(state, attack) {
  const attacker = state.units.find((candidate) => candidate.id === attack.attackerUnitId)
  const target = state.units.find((candidate) => candidate.id === attack.targetUnitId)
  if (!attacker || !target) return 0
  const weapon = attacker.weapons[attack.weaponType]
  const hitChance = Math.max(0, 7 - weapon.skill) / 6
  const woundChance = (7 - calculateWoundTarget(weapon.strength, target.toughness)) / 6
  const saveTarget = target.save - weapon.ap - (attack.weaponType === 'ranged' && COVER.some(([x, y]) => x === target.x && y === target.y) ? 1 : 0)
  const failSave = saveTarget > 6 ? 1 : Math.max(1 / 6, (saveTarget - 1) / 6)
  const damage = Math.min(weapon.damage, target.hp)
  return weapon.attacks * hitChance * woundChance * failSave * damage + (damage >= target.hp ? 0.35 : 0)
}

function chooseAttack(state, playerId, unitId) {
  const units = state.units.filter((unit) => unit.id === unitId && unit.playerIndex === state.activePlayer && unit.hp > 0 && !unit.hasAttacked)
  let best = null
  for (const unit of units) for (const option of availableAttacks(state, playerId, unit.id)) {
    const candidate = { ...option, unitId: unit.id, attackerUnitId: unit.id }
    const value = attackValue(state, candidate)
    if (!best || value > best.value) best = { ...candidate, value }
  }
  return best
}

function assignObjectives(state, playerIndex) {
  const units = state.units.filter((unit) => unit.playerIndex === playerIndex && unit.hp > 0)
  const points = state.controlPoints.filter((point) => point.ownerIndex !== playerIndex)
  const assignments = new Map()
  for (const point of points) {
    const capture = point.capture
    const assignedUnit = capture?.playerIndex === playerIndex ? units.find((unit) => unit.id === capture.unitId) : null
    if (assignedUnit) assignments.set(assignedUnit.id, point)
  }
  const freeUnits = units.filter((unit) => !assignments.has(unit.id))
  const reservedPointIds = new Set([...assignments.values()].map((point) => point.id))
  const freePoints = points.filter((point) => !reservedPointIds.has(point.id))
  const pairs = []
  for (const unit of freeUnits) for (const point of freePoints) pairs.push({ unit, point, distance: Math.max(Math.abs(unit.x - point.x), Math.abs(unit.y - point.y)) })
  pairs.sort((a, b) => a.distance - b.distance)
  const usedUnits = new Set(assignments.keys()), usedPoints = new Set()
  for (const pair of pairs) {
    if (usedUnits.has(pair.unit.id) || usedPoints.has(pair.point.id)) continue
    assignments.set(pair.unit.id, pair.point)
    usedUnits.add(pair.unit.id); usedPoints.add(pair.point.id)
  }
  return assignments
}

function pursueObjective(state, playerId, unitId, objective) {
  const unit = state.units.find((candidate) => candidate.id === unitId)
  if (!unit || unit.hasMoved || !objective || (unit.x === objective.x && unit.y === objective.y)) return state
  const occupant = state.units.find((candidate) => candidate.hp > 0 && candidate.x === objective.x && candidate.y === objective.y)
  let goals = [{ x: objective.x, y: objective.y }]
  if (occupant && occupant.id !== unit.id) goals = []
  if (!goals.length) for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
    const x = objective.x + dx, y = objective.y + dy
    if ((!dx && !dy) || x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) continue
    goals.push({ x, y })
  }
  const moves = availableMoves(state, playerId, unitId)
  const occupied = new Set(state.units.filter((candidate) => candidate.hp > 0 && candidate.id !== unitId).map((candidate) => `${candidate.x},${candidate.y}`))
  let best = null
  for (const move of moves) {
    let path = Infinity
    for (const goal of goals) path = Math.min(path, boardDistance(move, goal, occupied))
    if (!best || path < best.path) best = { ...move, path }
  }
  if (!best || !Number.isFinite(best.path)) return state
  const oldDistance = Math.min(...goals.map((goal) => boardDistance(unit, goal, occupied)))
  if (best.path >= oldDistance) return state
  return applyBattleAction(state, playerId, 'move', { unitId, x: best.x, y: best.y }).state
}

function advanceAI(state, playerId, random) {
  const playerIndex = state.activePlayer
  const assignments = assignObjectives(state, playerIndex)
  const unitIds = state.units.filter((unit) => unit.playerIndex === playerIndex && unit.hp > 0).map((unit) => unit.id)
  for (const unitId of unitIds) {
    if (state.status !== 'active') break
    let unit = state.units.find((candidate) => candidate.id === unitId)
    if (!unit?.hasAttacked) {
      const attack = chooseAttack(state, playerId, unitId)
      if (attack) state = applyBattleAction(state, playerId, 'attack', attack, random).state
    }
    unit = state.units.find((candidate) => candidate.id === unitId)
    if (unit && !unit.hasMoved) state = pursueObjective(state, playerId, unitId, assignments.get(unitId))
    unit = state.units.find((candidate) => candidate.id === unitId)
    if (unit && !unit.hasAttacked && state.status === 'active') {
      const attack = chooseAttack(state, playerId, unitId)
      if (attack) state = applyBattleAction(state, playerId, 'attack', attack, random).state
    }
  }
  return applyBattleAction(state, playerId, 'end-turn', {}, random).state
}

function simulate(index) {
  const random = makeRandom(index + 1)
  const scenario = index % 8
  const firstPlayerIndex = scenario % 2
  const topPlayerIndex = Math.floor(scenario / 2) % 2
  const reverseObjectives = Math.floor(scenario / 4) % 2 === 1
  const matchup = matchups[Math.floor(index / 8) % matchups.length]
  const players = [
    { userId: 'player-0', username: factionNames[matchup[0]], faction: matchup[0] },
    { userId: 'player-1', username: factionNames[matchup[1]], faction: matchup[1] },
  ]
  let state = createBattle({ id: `simulation-${index}`, players, firstPlayerIndex, topPlayerIndex, reverseObjectives })
  let turns = 0
  while (state.status === 'active' && state.turn <= maxTurns) {
    const current = state.players[state.activePlayer]
    state = advanceAI(state, current.userId, random)
    turns = state.turn
  }
  const alive = state.players.map((player) => state.units.filter((unit) => unit.playerIndex === player.index && unit.hp > 0).length)
  const controlled = state.players.map((player) => state.controlPoints.filter((point) => point.ownerIndex === player.index).length)
  let winnerIndex = state.status === 'finished' ? state.winnerIndex : null
  if (winnerIndex === null) {
    if (controlled[0] !== controlled[1]) winnerIndex = controlled[0] > controlled[1] ? 0 : 1
    else if (alive[0] !== alive[1]) winnerIndex = alive[0] > alive[1] ? 0 : 1
  }
  const winnerFaction = winnerIndex === null ? 'draw' : state.players[winnerIndex].faction
  return {
    winnerFaction, turns, reason: state.winReason || (winnerIndex === null ? 'draw' : 'timeout'),
    matchup,
    attackCount: state.stats?.attackActions || 0,
    damageDealt: state.stats?.damage || 0,
    destroyedUnits: state.stats?.destroyedUnits || 0,
    topFaction: state.players[topPlayerIndex].faction,
    firstFaction: state.players[firstPlayerIndex].faction,
    firstPlayerWon: winnerIndex === firstPlayerIndex,
    winnerSide: winnerIndex === null ? 'draw' : winnerIndex === topPlayerIndex ? 'top' : 'bottom',
  }
}

function shortestRouteAssignment(starts, points) {
  const distances = starts.map((start) => points.map((point) => boardDistance({ x: start[0], y: start[1] }, { x: point[0], y: point[1] })))
  const assignments = []
  const visit = (unitIndex, used, total) => {
    if (unitIndex === starts.length) { assignments.push(total); return }
    for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) if (!used.has(pointIndex)) {
      used.add(pointIndex); visit(unitIndex + 1, used, total + distances[unitIndex][pointIndex]); used.delete(pointIndex)
    }
  }
  visit(0, new Set(), 0)
  return { distances, bestTotal: Math.min(...assignments) }
}

function printMapAnalysis() {
  const starts = [[2, 0], [5, 0], [8, 0]]
  const points = CONTROL_POINT_CELLS
  const top = shortestRouteAssignment(starts, points)
  const bottom = shortestRouteAssignment([[9, MAP_SIZE - 1], [6, MAP_SIZE - 1], [3, MAP_SIZE - 1]], points)
  const mirroredPoints = points.map(([x, y]) => [MAP_SIZE - 1 - x, MAP_SIZE - 1 - y])
  const mirroredTop = shortestRouteAssignment(starts, mirroredPoints)
  const mirroredBottom = shortestRouteAssignment([[9, MAP_SIZE - 1], [6, MAP_SIZE - 1], [3, MAP_SIZE - 1]], mirroredPoints)
  const rotate = ([x, y]) => `${MAP_SIZE - 1 - x},${MAP_SIZE - 1 - y}`
  const obstacleSet = new Set(OBSTACLES.map(rotate))
  const coverSet = new Set(COVER.map(rotate))
  const symmetric = (cells) => cells.every(([x, y]) => new Set(cells.map(([cx, cy]) => `${cx},${cy}`)).has(rotate([x, y])))
  console.log('КАРТА: 12×12; случайно меняются стартовая сторона, инициатива и ориентация целей.')
  console.log(`Препятствия 180° симметричны: ${symmetric(OBSTACLES) ? 'да' : 'нет'}; укрытия: ${symmetric(COVER) ? 'да' : 'нет'}; цели меняются на зеркальные между матчами.`)
  console.log(`Прямое расположение: верх/низ ${top.bestTotal}/${bottom.bestTotal} шагов; зеркальное: ${mirroredTop.bestTotal}/${mirroredBottom.bestTotal}; средний путь каждой стороны: ${((top.bestTotal + bottom.bestTotal + mirroredTop.bestTotal + mirroredBottom.bestTotal) / 4).toFixed(1)}.`)
}

printMapAnalysis()
const factionStats = Object.fromEntries(FACTIONS.map((faction) => [faction, { wins: 0, matches: 0 }]))
const matchupStats = new Map(matchups.map(([first, second]) => [`${first}:${second}`, { first, second, firstWins: 0, secondWins: 0, draws: 0, matches: 0, attacks: 0, damage: 0, destroyedUnits: 0 }]))
const totals = { draw: 0, turns: 0, attacks: 0, damage: 0, destroyedUnits: 0, completed: 0, controlWins: 0, eliminationWins: 0, timeout: 0 }
const sideResults = { top: { wins: 0, losses: 0, draws: 0 }, bottom: { wins: 0, losses: 0, draws: 0 }, first: 0, second: 0 }
for (let index = 0; index < matchCount; index += 1) {
  const result = simulate(index)
  const [firstFaction, secondFaction] = result.matchup
  const pairing = matchupStats.get(`${firstFaction}:${secondFaction}`)
  pairing.matches += 1
  pairing.attacks += result.attackCount
  pairing.damage += result.damageDealt
  pairing.destroyedUnits += result.destroyedUnits
  totals.attacks += result.attackCount
  totals.damage += result.damageDealt
  totals.destroyedUnits += result.destroyedUnits
  factionStats[firstFaction].matches += 1
  factionStats[secondFaction].matches += 1
  if (result.winnerFaction === 'draw') { totals.draw += 1; pairing.draws += 1 }
  else {
    factionStats[result.winnerFaction].wins += 1
    if (result.winnerFaction === firstFaction) pairing.firstWins += 1
    else pairing.secondWins += 1
  }
  totals.turns += result.turns
  if (result.winnerFaction !== 'draw') {
    totals.completed += 1
    if (result.reason?.includes('точки')) totals.controlWins += 1
    else if (result.reason?.includes('уничтожены')) totals.eliminationWins += 1
    else totals.timeout += 1
  } else totals.timeout += 1
  if (result.winnerSide === 'draw') { sideResults.top.draws += 1; sideResults.bottom.draws += 1 }
  else {
    sideResults[result.winnerSide].wins += 1
    sideResults[result.winnerSide === 'top' ? 'bottom' : 'top'].losses += 1
    if (result.firstPlayerWon) sideResults.first += 1
    else sideResults.second += 1
  }
  if ((index + 1) % Math.max(1000, Math.floor(matchCount / 5)) === 0) console.log(`Симулировано: ${index + 1}/${matchCount}`)
}
const winRate = (faction) => `${(factionStats[faction].wins / factionStats[faction].matches * 100).toFixed(1)}%`
console.log(`\nРЕЗУЛЬТАТ: ${matchCount} матчей, предел ${maxTurns} раундов${allFactionMode ? ', все парные сочетания фракций' : ', Империум против Орков'}.`)
for (const faction of FACTIONS.filter((item) => factionStats[item].matches)) console.log(`${factionNames[faction]}: ${factionStats[faction].wins}/${factionStats[faction].matches} побед (${winRate(faction)}).`)
for (const result of matchupStats.values()) console.log(`Пара ${factionNames[result.first]} — ${factionNames[result.second]}: ${result.firstWins} / ${result.secondWins} побед, ${result.draws} ничьих (${result.matches} матчей); атак ${result.attacks}, урона ${result.damage}, уничтожено отрядов ${result.destroyedUnits}.`)
console.log(`Ничьи: ${totals.draw} (${(totals.draw / matchCount * 100).toFixed(1)}%).`)
console.log(`Завершено: ${totals.completed}; захват точек: ${totals.controlWins}; уничтожение армии: ${totals.eliminationWins}; тайм-аут/ничья: ${totals.timeout}.`)
console.log(`Средняя длительность: ${(totals.turns / matchCount).toFixed(1)} раунда.`)
console.log(`Всего атак: ${totals.attacks}; нанесено урона: ${totals.damage}; уничтожено отрядов: ${totals.destroyedUnits}.`)
console.log(`По стороне: верх ${sideResults.top.wins} побед / ${sideResults.top.losses} поражений; низ ${sideResults.bottom.wins} побед / ${sideResults.bottom.losses} поражений.`)
console.log(`По инициативе: первый ход выиграл ${sideResults.first}, второй — ${sideResults.second}.`)
