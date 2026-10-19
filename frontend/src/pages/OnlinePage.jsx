import React from 'react'
import { Link } from 'react-router-dom'
import { ONLINE_IDENTITY_CHOICES } from '../data/onlineChoices'
import { FACTION_DETAILS } from '../utils/gameProgress'
import { apiRequest, getCurrentUser, updateCurrentUser } from '../utils/api'
import UnitSprite from './UnitSprite'
import './OnlinePage.css'
import './BattleExtras.css'

const MATCH_KEY = 'sv-online-match'
const ROOM_KEY = 'sv-online-room'
const ONLINE_FACTIONS = ['imperium', 'chaos', 'orks', 'tau']
const FACTION_NAMES = { imperium: 'Империум', chaos: 'Хаос', orks: 'Орки', tau: 'Тау' }
const factionMark = { imperium: 'I', chaos: '⛧', orks: 'W', tau: 'T' }
const cellLabel = (x, y) => `${String.fromCharCode(65 + x)}${12 - y}`
function hasClearShot(from, to, obstacles) {
  let x = from.x, y = from.y
  const dx = Math.abs(to.x - x), dy = Math.abs(to.y - y)
  const sx = x < to.x ? 1 : -1, sy = y < to.y ? 1 : -1
  let error = dx - dy
  while (x !== to.x || y !== to.y) {
    const twiceError = 2 * error
    if (twiceError > -dy) { error -= dy; x += sx }
    if (twiceError < dx) { error += dx; y += sy }
    if (x !== to.x || y !== to.y) for (const cell of obstacles) if (cell.x === x && cell.y === y) return false
  }
  return true
}

export default function OnlinePage() {
  const user = getCurrentUser()
  const profileFaction = FACTION_DETAILS[user?.faction] ? user.faction : 'imperium'
  const faction = FACTION_DETAILS[profileFaction]
  const identity = ONLINE_IDENTITY_CHOICES[profileFaction]
  const [identityChoice, setIdentityChoice] = React.useState(identity ? user?.[identity.field] || '' : '')
  const [identityBusy, setIdentityBusy] = React.useState(false)
  const [identityMessage, setIdentityMessage] = React.useState('')
  const [factionChoice, setFactionChoice] = React.useState(ONLINE_FACTIONS.includes(user?.faction) ? user.faction : 'imperium')
  const [queueing, setQueueing] = React.useState(false)
  const [lobbyNotice, setLobbyNotice] = React.useState('')
  const [matchId, setMatchId] = React.useState(() => localStorage.getItem(MATCH_KEY) || '')
  const [roomCode, setRoomCode] = React.useState(() => localStorage.getItem(ROOM_KEY) || '')
  const [room, setRoom] = React.useState(null)
  const [roomCodeInput, setRoomCodeInput] = React.useState('')
  const [roomBusy, setRoomBusy] = React.useState(false)
  const [roomError, setRoomError] = React.useState('')
  const [roomNotice, setRoomNotice] = React.useState('')
  const [match, setMatch] = React.useState(null)
  const [matchError, setMatchError] = React.useState('')
  const [selectedId, setSelectedId] = React.useState('')
  const [actionMode, setActionMode] = React.useState('move')
  const [weaponType, setWeaponType] = React.useState('ranged')
  const [busy, setBusy] = React.useState(false)
  const [toast, setToast] = React.useState('')
  const [lastAttack, setLastAttack] = React.useState(null)
  const [confirmSurrender, setConfirmSurrender] = React.useState(false)
  const [abilityArmed, setAbilityArmed] = React.useState(false)
  const [combatEvent, setCombatEvent] = React.useState(null)
  const [animationsEnabled, setAnimationsEnabled] = React.useState(() => localStorage.getItem('sv-animations') !== 'off')
  const [soundVolume, setSoundVolume] = React.useState(() => Number(localStorage.getItem('sv-sound-volume') ?? 0.35))
  const [visualQuality, setVisualQuality] = React.useState(() => localStorage.getItem('sv-visual-quality') || 'high')
  const [clockNow, setClockNow] = React.useState(Date.now())
  const audioContext = React.useRef(null)
  const lastEventSequence = React.useRef(null)
  const isMyTurn = match?.status === 'active' && match.activePlayer === match.viewerIndex
  const activeMatchId = match?.status === 'active' ? match.id : ''
  const didWin = match?.status === 'finished' && match.winnerIndex === match.viewerIndex
  const selectedUnit = match?.units.find((unit) => unit.id === selectedId) || null
  const savedChoice = identity ? user?.[identity.field] || '' : ''
  const viewerPlayer = match?.players[match.viewerIndex]
  const factionAbility = viewerPlayer?.factionAbility
  const abilityAvailable = Boolean(viewerPlayer && !viewerPlayer.factionAbilityUsed)
  const abilityCanApply = viewerPlayer?.faction === 'orks' ? weaponType === 'melee' : viewerPlayer?.faction === 'tau' ? weaponType === 'ranged' : true

  const playBattleSound = React.useCallback((type) => {
    if (soundVolume <= 0 || typeof window === 'undefined') return
    const Context = window.AudioContext || window.webkitAudioContext
    if (!Context) return
    const context = audioContext.current || (audioContext.current = new Context())
    if (context.state === 'suspended') context.resume()
    const oscillator = context.createOscillator(), gain = context.createGain()
    const sounds = { move: [270, 0.08], attack: [95, 0.2], destroy: [58, 0.3], capture: [520, 0.16] }
    const [frequency, duration] = sounds[type] || sounds.move
    oscillator.type = type === 'attack' || type === 'destroy' ? 'sawtooth' : 'triangle'
    oscillator.frequency.setValueAtTime(frequency, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(36, frequency * 0.58), context.currentTime + duration)
    gain.gain.setValueAtTime(Math.min(0.35, soundVolume * 0.25), context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + duration)
  }, [soundVolume])

  React.useEffect(() => {
    localStorage.setItem('sv-animations', animationsEnabled ? 'on' : 'off')
    localStorage.setItem('sv-sound-volume', String(soundVolume))
    localStorage.setItem('sv-visual-quality', visualQuality)
  }, [animationsEnabled, soundVolume, visualQuality])

  React.useEffect(() => { lastEventSequence.current = null; setCombatEvent(null) }, [matchId])

  React.useEffect(() => {
    if (!match?.log?.length) return
    const currentSequence = Number(match.log.at(-1).sequence || 0)
    if (lastEventSequence.current === null) { lastEventSequence.current = currentSequence; return }
    const events = match.log.filter((entry) => Number(entry.sequence || 0) > lastEventSequence.current)
    if (!events.length) return
    lastEventSequence.current = currentSequence
    for (const entry of events) {
      if (entry.event?.type === 'attack') {
        setLastAttack(entry.event.attack || null)
        setCombatEvent({ attackerId: entry.event.attackerUnitId, targetId: entry.event.targetUnitId, destroyed: entry.event.destroyed, key: entry.sequence })
        playBattleSound(entry.event.destroyed ? 'destroy' : 'attack')
      } else if (entry.event?.type === 'move') playBattleSound('move')
      else if (entry.event?.type === 'capture') playBattleSound('capture')
    }
    const timer = window.setTimeout(() => setCombatEvent(null), 650)
    return () => window.clearTimeout(timer)
  }, [match?.log, playBattleSound])

  async function saveIdentity() {
    if (!identity || identityBusy || identityChoice === savedChoice) return
    setIdentityBusy(true)
    setIdentityMessage('')
    try {
      const result = await apiRequest('/online-profile', { method: 'PUT', body: JSON.stringify({ value: identityChoice }) })
      updateCurrentUser(result.user)
      setIdentityMessage('Выбор сохранён.')
    } catch (error) {
      setIdentityMessage(error.message || 'Не удалось сохранить выбор.')
    } finally { setIdentityBusy(false) }
  }

  const refreshMatch = React.useCallback(async (id) => {
    if (!id) return
    try {
      const result = await apiRequest(`/online/matches/${id}/presence`, { method: 'POST', body: '{}' })
      setMatch(result.match)
      setMatchError('')
    } catch (error) {
      if (error.message.includes('Операция не найдена')) {
        localStorage.removeItem(MATCH_KEY)
        setMatchId('')
        setMatch(null)
      } else setMatchError(error.message)
    }
  }, [])

  React.useEffect(() => {
    if (matchId) refreshMatch(matchId)
  }, [matchId, refreshMatch])

  React.useEffect(() => {
    if (!matchId) return undefined
    const timer = window.setInterval(() => refreshMatch(matchId), 1800)
    return () => window.clearInterval(timer)
  }, [matchId, refreshMatch])

  const refreshRoom = React.useCallback(async (code) => {
    if (!code) return
    try {
      const result = await apiRequest(`/online/rooms/${encodeURIComponent(code)}`)
      setRoom(result.room)
      setRoomError('')
      if (result.room.status === 'active' && result.room.matchId && result.room.matchId !== matchId) {
        localStorage.setItem(MATCH_KEY, result.room.matchId)
        setMatchId(result.room.matchId)
      }
    } catch (error) {
      if (error.message.includes('Комната не найдена')) {
        localStorage.removeItem(ROOM_KEY)
        setRoomCode('')
        setRoom(null)
      } else setRoomError(error.message)
    }
  }, [matchId])

  React.useEffect(() => {
    if (roomCode) refreshRoom(roomCode)
  }, [roomCode, refreshRoom])

  React.useEffect(() => {
    if (!roomCode) return undefined
    const timer = window.setInterval(() => refreshRoom(roomCode), 1800)
    return () => window.clearInterval(timer)
  }, [roomCode, refreshRoom])

  React.useEffect(() => {
    if (!activeMatchId) return undefined
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [activeMatchId])

  React.useEffect(() => {
    if (!queueing) return undefined
    let cancelled = false
    const seek = async () => {
      try {
        const result = await apiRequest('/online/matchmaking', { method: 'POST', body: JSON.stringify({ faction: factionChoice }) })
        if (cancelled) return
        if (result.status === 'matched') {
          localStorage.setItem(MATCH_KEY, result.matchId)
          setMatchId(result.matchId)
          setQueueing(false)
          setMatchError('')
        }
      } catch (error) { if (!cancelled) { setMatchError(error.message); setQueueing(false) } }
    }
    seek()
    const timer = window.setInterval(seek, 2200)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [queueing, factionChoice])

  async function findOpponent() {
    setMatchError('')
    setLobbyNotice('')
    setMatch(null)
    setSelectedId('')
    setQueueing(true)
  }

  async function cancelSearch() {
    setQueueing(false)
    try { await apiRequest('/online/matchmaking', { method: 'DELETE' }) } catch (error) { setMatchError(error.message) }
  }

  async function createRoom() {
    if (roomBusy) return
    setRoomBusy(true); setRoomError(''); setRoomNotice('')
    try {
      const result = await apiRequest('/online/rooms', { method: 'POST', body: JSON.stringify({ faction: factionChoice }) })
      localStorage.setItem(ROOM_KEY, result.room.code)
      setRoomCode(result.room.code); setRoom(result.room); setLobbyNotice('')
    } catch (error) { setRoomError(error.message) }
    finally { setRoomBusy(false) }
  }

  async function joinRoom() {
    if (roomBusy || !roomCodeInput.trim()) return
    setRoomBusy(true); setRoomError(''); setRoomNotice('')
    try {
      const result = await apiRequest(`/online/rooms/${encodeURIComponent(roomCodeInput.trim())}/join`, { method: 'POST', body: JSON.stringify({ faction: factionChoice }) })
      localStorage.setItem(ROOM_KEY, result.room.code)
      setRoomCode(result.room.code); setRoom(result.room); setRoomCodeInput('')
    } catch (error) { setRoomError(error.message) }
    finally { setRoomBusy(false) }
  }

  async function toggleReady() {
    if (!room || roomBusy) return
    setRoomBusy(true); setRoomError('')
    try {
      const player = room.players.find((member) => member.userId === room.viewerId)
      const result = await apiRequest(`/online/rooms/${encodeURIComponent(room.code)}/ready`, { method: 'PUT', body: JSON.stringify({ ready: !player?.ready }) })
      setRoom(result.room)
      if (result.matchId) { localStorage.setItem(MATCH_KEY, result.matchId); setMatchId(result.matchId) }
    } catch (error) { setRoomError(error.message) }
    finally { setRoomBusy(false) }
  }

  async function leaveRoom() {
    if (!room || roomBusy) return
    setRoomBusy(true); setRoomError('')
    try {
      await apiRequest(`/online/rooms/${encodeURIComponent(room.code)}`, { method: 'DELETE' })
      localStorage.removeItem(ROOM_KEY); setRoomCode(''); setRoom(null); setRoomNotice('Ты покинул комнату.')
    } catch (error) { setRoomError(error.message) }
    finally { setRoomBusy(false) }
  }

  async function requestRematch() {
    if (!room || roomBusy) return
    setRoomBusy(true); setRoomError(''); setRoomNotice('')
    try {
      const result = await apiRequest(`/online/rooms/${encodeURIComponent(room.code)}/rematch`, { method: 'POST', body: '{}' })
      setRoom(result.room)
      if (result.matchId && result.room.status === 'active') {
        localStorage.setItem(MATCH_KEY, result.matchId); setMatchId(result.matchId); setMatch(null)
      } else setRoomNotice('Готовность к повторному бою отправлена. Ждём соперника.')
    } catch (error) { setRoomError(error.message) }
    finally { setRoomBusy(false) }
  }

  async function sendAction(type, payload = {}) {
    if (!match || busy) return
    setBusy(true)
    setToast('')
    setLastAttack(null)
    try {
      const actionId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const result = await apiRequest(`/online/matches/${match.id}/actions`, { method: 'POST', body: JSON.stringify({ type, payload, actionId }) })
      if (type === 'surrender') {
        if (match.roomCode) setMatch(result.match)
        else {
          localStorage.removeItem(MATCH_KEY)
          setMatchId('')
          setMatch(null)
          setSelectedId('')
          setLobbyNotice('Вы сдались. Операция завершена в пользу противника.')
        }
        setConfirmSurrender(false)
        return
      }
      setMatch(result.match)
      setMatchError('')
      if (result.attack) {
        setLastAttack(result.attack)
        setAbilityArmed(false)
        if (result.attack.abilityUsed) playBattleSound('capture')
        setToast(`${result.attack.weapon}: ${result.attack.totalDamage} урона · ${result.attack.targetHp} HP осталось`)
      }
      if (type === 'end-turn') setSelectedId('')
    } catch (error) { setMatchError(error.message) }
    finally { setBusy(false) }
  }

  function clickCell(x, y) {
    if (!match) return
    const unit = match.units.find((item) => item.hp > 0 && item.x === x && item.y === y)
    if (unit?.playerIndex === match.viewerIndex) { setSelectedId(unit.id); setAbilityArmed(false); return }
    if (!isMyTurn || !selectedUnit || selectedUnit.playerIndex !== match.viewerIndex || busy) return
    if (actionMode === 'move' && !unit) sendAction('move', { unitId: selectedUnit.id, x, y })
    else if (actionMode === 'attack' && unit) sendAction('attack', { unitId: selectedUnit.id, targetUnitId: unit.id, weaponType, useAbility: abilityArmed })
  }

  function canMoveTo(x, y) {
    if (!isMyTurn || actionMode !== 'move' || !selectedUnit || selectedUnit.playerIndex !== match?.viewerIndex || selectedUnit.hasMoved || Math.max(Math.abs(x - selectedUnit.x), Math.abs(y - selectedUnit.y)) !== 1) return false
    const blocked = match.obstacles.some((cell) => cell.x === x && cell.y === y) || match.units.some((unit) => unit.hp > 0 && unit.x === x && unit.y === y)
    const blockedCorner = Math.abs(selectedUnit.x - x) === 1 && Math.abs(selectedUnit.y - y) === 1 && match.obstacles.some((cell) => cell.x === selectedUnit.x && cell.y === y) && match.obstacles.some((cell) => cell.x === x && cell.y === selectedUnit.y)
    return !blocked && !blockedCorner
  }

  function canAttack(unit) {
    if (!isMyTurn || actionMode !== 'attack' || !selectedUnit || selectedUnit.hasAttacked || unit.playerIndex === match.viewerIndex) return false
    const weapon = selectedUnit.weapons[weaponType]
    const range = Math.max(Math.abs(selectedUnit.x - unit.x), Math.abs(selectedUnit.y - unit.y))
    if (weaponType === 'melee') return range === 1
    const engagedAtSource = match.units.some((other) => other.hp > 0 && other.playerIndex !== match.viewerIndex && Math.max(Math.abs(other.x - selectedUnit.x), Math.abs(other.y - selectedUnit.y)) === 1)
    const engagedTarget = match.units.some((other) => other.hp > 0 && other.playerIndex === unit.playerIndex && other.id !== unit.id && Math.max(Math.abs(other.x - unit.x), Math.abs(other.y - unit.y)) === 1)
    const tauRangeBonus = viewerPlayer?.faction === 'tau' && !selectedUnit.hasMoved ? 1 : 0
    return range <= weapon.range + tauRangeBonus && !engagedAtSource && !engagedTarget && hasClearShot(selectedUnit, unit, match.obstacles)
  }

  const activeFaction = match?.players[match.viewerIndex]?.faction || factionChoice
  const theme = activeFaction === 'chaos' ? 'chaos-theme' : activeFaction === 'orks' ? 'orks-theme' : activeFaction === 'tau' ? 'tau-theme' : ''

  return <main className={`content-page online-page ${theme}`}>
    <Link className="back-link" to="/campaign">← Карта кампании</Link>
    <p className="eyebrow">СЕТЕВОЙ РЕЖИМ · ТАКТИЧЕСКАЯ ОПЕРАЦИЯ</p>
    <h1>Sector: Vermillion</h1>

    {!match && <>
      <section className="online-connection" aria-label="Сетевая операция">
        <div className="online-connection-heading"><div><p className="eyebrow">УЗЕЛ СВЯЗИ · VER-IX</p><h2>{queueing ? 'Поиск противника' : 'Выйти на поле боя'}</h2></div><span className={`online-connection-state ${queueing ? 'is-searching' : ''}`}><i />{queueing ? 'ПОИСК' : 'ГОТОВ К СВЯЗИ'}</span></div>
        <p>Два командира, шесть отрядов и три контрольные точки. Сервер проверяет каждый ход и бросает кубики за бойцов.</p>
        <div className="online-connection-grid"><div><span>ПОЗЫВНОЙ</span><b>{user?.username || 'НЕИЗВЕСТЕН'}</b></div><div><span>АРМИЯ ОПЕРАЦИИ</span><label className="online-select-wrap"><select aria-label="Армия операции" value={factionChoice} onChange={(event) => setFactionChoice(event.target.value)} disabled={queueing}><option value="imperium">Империум</option><option value="chaos">Хаос</option><option value="orks">Орки</option><option value="tau">Тау</option></select></label></div><div><span>СОСТАВ</span><b>3 ОТРЯДА · 3 ТОЧКИ · 1×1</b></div></div>
        {lobbyNotice && <p className="online-notice" role="status">{lobbyNotice}</p>}{matchError && <p className="online-error" role="alert">{matchError}</p>}
        <div className="online-connection-actions"><Link className="text-link" to="/profile">Профиль игрока <span>→</span></Link>{queueing ? <button className="button button-outline" type="button" onClick={cancelSearch}>Отменить поиск</button> : <button className="button button-primary" type="button" disabled={Boolean(roomCode)} onClick={findOpponent}>Найти противника <span>↗</span></button>}</div>
      </section>
      <section className="online-private-lobby" aria-label="Частная комната">
        <div className="online-private-heading"><div><p className="eyebrow">КОМНАТА ПО ПРИГЛАШЕНИЮ</p><h2>{room ? `КОД ${room.code}` : 'Сыграть с другом'}</h2></div>{room && <span className="online-connection-state"><i />{room.status === 'waiting' ? 'ОЖИДАНИЕ' : room.status === 'finished' ? 'БОЙ ЗАВЕРШЁН' : 'МАТЧ'}</span>}</div>
        {room ? <>
          <p className="online-private-description">Отправь код другу. В комнату могут войти только два игрока; после готовности обоих начнётся матч.</p>
          <div className="online-room-code" aria-label="Код приглашения">{room.code}</div>
          <div className="online-room-players">{room.players.map((member) => <div className="online-room-player" key={member.userId}><span className="online-room-presence"><i className={member.connected ? 'is-connected' : ''} />{member.connected ? 'НА СВЯЗИ' : 'НЕТ СВЯЗИ'}</span><b>{member.username}{member.userId === room.viewerId ? ' · ВЫ' : ''}</b><span>{FACTION_NAMES[member.faction]} · {member.ready ? 'ГОТОВ' : 'НЕ ГОТОВ'}</span></div>)}{room.players.length < 2 && <div className="online-room-player is-empty"><b>Ожидание второго игрока…</b><span>Ещё никто не вошёл по коду</span></div>}</div>
          {roomError && <p className="online-error" role="alert">{roomError}</p>}{roomNotice && <p className="online-notice" role="status">{roomNotice}</p>}
          <div className="online-private-actions">{room.status === 'waiting' && <button className="button button-primary" type="button" disabled={roomBusy || room.players.length !== 2} onClick={toggleReady}>{roomBusy ? 'СОХРАНЯЮ…' : room.players.find((member) => member.userId === room.viewerId)?.ready ? 'Снять готовность' : 'Готов'}</button>}{room.status !== 'active' && <button className="button button-outline" type="button" disabled={roomBusy} onClick={leaveRoom}>Покинуть комнату</button>}</div>
        </> : <>
          <p className="online-private-description">Создай комнату и пришли код приглашения или введи код друга, чтобы присоединиться.</p>
          <div className="online-private-actions"><button className="button button-primary" type="button" disabled={roomBusy || queueing} onClick={createRoom}>{roomBusy ? 'СОЗДАЮ…' : 'Создать комнату'}</button><label className="online-room-join"><span className="online-select-wrap"><input aria-label="Код комнаты" value={roomCodeInput} onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())} placeholder="КОД КОМНАТЫ" maxLength={8} /></span><button className="button button-outline" type="button" disabled={roomBusy || queueing || !roomCodeInput.trim()} onClick={joinRoom}>Войти по коду</button></label></div>
          {roomError && <p className="online-error" role="alert">{roomError}</p>}{roomNotice && <p className="online-notice" role="status">{roomNotice}</p>}
        </>}
      </section>
      {identity && <section className="online-readiness"><div><p className="eyebrow">ИДЕНТИЧНОСТЬ КОМАНДИРА</p><h2>{faction.name}</h2></div><div className="online-identity-row"><label htmlFor="online-subfaction">{identity.label}</label><span className="online-select-wrap"><select id="online-subfaction" value={identityChoice} onChange={(event) => { setIdentityChoice(event.target.value); setIdentityMessage('') }}><option value="">Не выбран</option>{identity.options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></span><button className="button button-outline" type="button" onClick={saveIdentity} disabled={identityBusy || identityChoice === savedChoice}>{identityBusy ? 'СОХРАНЯЮ…' : 'Сохранить'}</button>{identityMessage && <p role="status">{identityMessage}</p>}</div></section>}
      <section className="online-rules"><p className="eyebrow">ПОЛЕВОЙ УСТАВ · v0.2</p><div className="online-rule-grid"><article><b>12 × 12</b><span>Клеток на поле · восемь направлений хода</span></article><article><b>1 + 1</b><span>Перемещение и одна атака на каждый отряд за ход</span></article><article><b>D6</b><span>Попадание → ранение → спасбросок → урон</span></article><article><b>2 хода</b><span>Удерживай точку двумя своими ходами подряд</span></article></div></section>
    </>}

    {match && <section className="battle-interface" aria-label="Поле боя">
      <div className="battle-topline"><div><p className="eyebrow">ОПЕРАЦИЯ · {match.id.toUpperCase()}</p><h2>{match.status === 'finished' ? 'Операция завершена' : `Ход ${match.turn} · ${isMyTurn ? 'ваш ход' : 'ход противника'}`}</h2><p className="battle-map-name">КАРТА · {match.mapName || 'Перекрёсток Сектора'}</p>{match.status === 'active' && <p className={`battle-turn-countdown ${isMyTurn ? 'is-running' : ''}`}>До конца хода: <b>{Math.max(0, Math.ceil(((match.turnDeadlineAt || clockNow) - clockNow) / 1000))} сек.</b></p>}</div><span className={`online-connection-state ${isMyTurn ? 'is-my-turn' : ''}`}><i />{match.status === 'finished' ? 'ЗАВЕРШЕНО' : isMyTurn ? 'ВАШ ХОД' : `ХОД ${match.players[match.activePlayer]?.username?.toUpperCase()}`}</span></div>
      {match.status === 'finished' && <div className={`battle-finished-banner ${didWin ? 'is-victory' : 'is-defeat'}`} role="status" aria-live="polite"><span className="eyebrow">{didWin ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</span><h2>{match.winReason}</h2><p>Победитель: <b>{match.players[match.winnerIndex]?.username}</b></p></div>}
      <div className="battle-scoreboard">{match.players.map((player) => { const presence = match.playerPresence?.[player.index]; const reconnectLeft = presence?.reconnectDeadlineAt ? Math.max(0, Math.ceil((presence.reconnectDeadlineAt - clockNow) / 1000)) : null; return <div key={player.index} className={`battle-player ${player.index === match.activePlayer && match.status === 'active' ? 'is-active' : ''}`}><span className="battle-player-mark">{factionMark[player.faction]}</span><div><small>{FACTION_NAMES[player.faction]}{match.status === 'active' && <i className={`battle-presence ${presence?.connected === false ? 'is-offline' : ''}`}>{presence?.connected === false ? ` · НЕТ СВЯЗИ${reconnectLeft !== null ? ` · ${reconnectLeft} сек.` : ''}` : ' · НА СВЯЗИ'}</i>}</small><b>{player.username}{player.index === match.viewerIndex ? ' · ВЫ' : ''}</b></div><strong>{match.units.filter((unit) => unit.playerIndex === player.index && unit.hp > 0).length} <small>/ 3</small></strong></div> })}</div>
      <section className="battle-settings" aria-label="Настройки боя"><label><input type="checkbox" checked={animationsEnabled} onChange={(event) => setAnimationsEnabled(event.target.checked)} /> Анимации</label><label className="battle-volume-control">Звук <input type="range" min="0" max="1" step="0.05" value={soundVolume} onChange={(event) => setSoundVolume(Number(event.target.value))} /><span>{Math.round(soundVolume * 100)}%</span></label><label>Графика <select value={visualQuality} onChange={(event) => setVisualQuality(event.target.value)}><option value="high">Высокая</option><option value="low">Низкая</option></select></label></section>
      <div className="battle-layout">
        <div className="battle-board-wrap"><div className={`battle-board ${animationsEnabled ? '' : 'animations-off'} battle-quality-${visualQuality}`} role="grid" aria-label={`Тактическая карта ${match.mapName || ''}, 12 на 12 клеток`} onClick={(event) => { const cell = event.target.closest('[data-x]'); if (cell) clickCell(Number(cell.dataset.x), Number(cell.dataset.y)) }}>{Array.from({ length: 144 }, (_, index) => {
          const x = index % 12, y = Math.floor(index / 12)
          const unit = match.units.find((item) => item.hp > 0 && item.x === x && item.y === y)
          const obstacle = match.obstacles.some((cell) => cell.x === x && cell.y === y)
          const inCover = match.cover.some((cell) => cell.x === x && cell.y === y)
          const point = match.controlPoints.find((cell) => cell.x === x && cell.y === y)
          const selected = unit?.id === selectedId
          const reachable = canMoveTo(x, y)
          const targetable = unit && canAttack(unit)
          const cellClass = ['battle-cell', (x + y) % 2 ? 'cell-dark' : '', obstacle ? 'cell-obstacle' : '', inCover ? 'cell-cover' : '', point ? 'cell-objective' : '', unit ? `cell-unit faction-${match.players[unit.playerIndex].faction}` : '', selected ? 'is-selected' : '', reachable ? 'is-reachable' : '', targetable ? 'is-targetable' : ''].filter(Boolean).join(' ')
          return <button key={cellLabel(x, y)} type="button" role="gridcell" data-x={x} data-y={y} aria-label={`${cellLabel(x, y)}${unit ? ` · ${unit.name} · ${unit.hp} HP` : obstacle ? ' · препятствие' : point ? ' · контрольная точка' : ''}`} className={cellClass} disabled={busy || match.status !== 'active'}>
            {point && <span className={`objective-marker ${point.ownerIndex !== null ? `owned-${match.players[point.ownerIndex].faction}` : ''}`}>{point.capture ? `${point.capture.turns}/2` : '◆'}</span>}
            {obstacle && <span className="obstacle-mark">▧</span>}{inCover && !obstacle && <span className="cover-mark">⌂</span>}
            {unit && <><span className="unit-hp">{unit.hp}<i>/ {unit.maxHp}</i></span>{unit.id === selectedId && <span className="unit-cell-name">{unit.name}</span>}</>}
          </button>
        })}<svg className="battle-shot-lines" viewBox="0 0 1200 1200" preserveAspectRatio="none" aria-hidden="true">{selectedUnit && match.units.filter((unit) => unit.hp > 0 && canAttack(unit)).map((unit) => <line key={unit.id} x1={(selectedUnit.x + 0.5) * 100} y1={(selectedUnit.y + 0.5) * 100} x2={(unit.x + 0.5) * 100} y2={(unit.y + 0.5) * 100} />)}</svg><div className="battle-unit-layer" aria-hidden="true">{match.units.map((unit) => { const unitFaction = match.players[unit.playerIndex].faction; return <div key={unit.id} className={`battle-unit-actor faction-${unitFaction} ${unit.id === selectedId ? 'is-selected' : ''} ${combatEvent?.attackerId === unit.id ? 'is-attacking' : ''} ${combatEvent?.targetId === unit.id ? combatEvent.destroyed ? 'is-destroying' : 'is-hit' : ''} ${unit.hp <= 0 ? 'is-destroyed' : ''}`} style={{ '--unit-x': unit.x, '--unit-y': unit.y }}><UnitSprite unitId={unit.id} faction={unitFaction} type={unit.type} selected={unit.id === selectedId} attacking={combatEvent?.attackerId === unit.id} hit={combatEvent?.targetId === unit.id && !combatEvent.destroyed} destroyed={unit.hp <= 0 || (combatEvent?.targetId === unit.id && combatEvent.destroyed)} /></div> })}</div></div><div className="battle-board-legend"><span><i className="legend-imperium" />Империум</span><span><i className="legend-orks" />Орки</span><span><i className="legend-objective" />Контрольная точка</span><span><i className="legend-cover" />Укрытие</span><span><i className="legend-blocked" />Руины</span></div></div>
        <aside className="battle-sidebar">
          <section className="battle-panel objective-panel"><p className="eyebrow">ЦЕЛИ ОПЕРАЦИИ</p>{match.controlPoints.map((point) => <div className="objective-row" key={point.id}><span className={`objective-status ${point.ownerIndex !== null ? `owned-${match.players[point.ownerIndex].faction}` : ''}`} /> <b>ТОЧКА {point.id.slice(-1)}</b><span>{point.ownerIndex === null ? point.capture ? `${FACTION_NAMES[match.players[point.capture.playerIndex].faction]} · ${point.capture.turns}/2` : 'НЕЙТРАЛЬНАЯ' : FACTION_NAMES[match.players[point.ownerIndex].faction].toUpperCase()}</span></div>)}</section>
          {lastAttack && <section className="battle-panel battle-roll-panel" role="status" aria-live="polite"><p className="eyebrow">БРОСКИ · {lastAttack.weapon}</p><div className="battle-rolls">{lastAttack.attacks.map((roll, index) => <div className="battle-roll" key={`${index}-${roll.hit}-${roll.wound}-${roll.save}`}><b>Атака {index + 1}</b><span className="battle-dice-sequence"><i className="battle-die">{roll.hit}</i>{roll.wound !== null && <><span>→</span><i className="battle-die">{roll.wound}</i></>}{roll.save !== null && <><span>→</span><i className={`battle-die ${roll.damage ? 'die-failed' : 'die-saved'}`}>{roll.save}</i></>}</span><small>{roll.damage ? `${roll.damage} урона` : roll.save !== null ? 'сохранено' : roll.wound !== null ? 'не пробито' : 'мимо'}</small></div>)}</div></section>}
          <section className="battle-panel"><p className="eyebrow">АКТИВНЫЙ ОТРЯД</p>{selectedUnit ? <><h3>{selectedUnit.name}</h3><div className="unit-stats"><span><b>{selectedUnit.hp}/{selectedUnit.maxHp}</b> HP</span><span><b>{selectedUnit.toughness}</b> T</span><span><b>{selectedUnit.save}+</b> SV</span></div><div className="unit-armory">{Object.entries(selectedUnit.weapons).map(([type, weapon]) => <div key={type}><b>{weapon.name}</b><span>{weapon.attacks} атаки · {type === 'ranged' ? 'BS' : 'WS'} {weapon.skill}+ · S {weapon.strength} · AP {weapon.ap} · D {weapon.damage} · {type === 'ranged' ? `дальн. ${weapon.range}` : 'ближний бой'}</span></div>)}</div>{factionAbility && <div className={`faction-ability-card ${abilityArmed ? 'is-armed' : ''}`}><span className="eyebrow">СПОСОБНОСТЬ ФРАКЦИИ</span><b>{factionAbility.name}</b><small>{viewerPlayer.factionAbilityUsed ? 'Уже использована в этом матче.' : factionAbility.description}</small><small className="faction-passive">Пассивно: {factionAbility.passive}</small><button type="button" onClick={() => setAbilityArmed((value) => !value)} disabled={!isMyTurn || busy || !abilityAvailable || !abilityCanApply || selectedUnit.hasAttacked}>{viewerPlayer.factionAbilityUsed ? 'Способность потрачена' : abilityArmed ? 'Применится к атаке · отменить' : 'Подготовить способность'}</button>{!abilityCanApply && <small>Выбери {viewerPlayer.faction === 'orks' ? 'ближний бой' : 'стрельбу'}, чтобы применить её.</small>}</div>}<div className="unit-actions"><button type="button" className={actionMode === 'move' ? 'is-active' : ''} onClick={() => setActionMode('move')} disabled={!isMyTurn}>Перемещение</button><button type="button" className={actionMode === 'attack' ? 'is-active' : ''} onClick={() => setActionMode('attack')} disabled={!isMyTurn}>Атака</button></div>{actionMode === 'attack' && <div className="weapon-picker">{['ranged', 'melee'].map((type) => <button type="button" key={type} className={weaponType === type ? 'is-active' : ''} onClick={() => { setWeaponType(type); setAbilityArmed(false) }}>{type === 'ranged' ? 'Стрельба' : 'Ближний бой'}</button>)}</div>}<p className="battle-hint">{!isMyTurn ? 'Ожидай хода противника.' : actionMode === 'move' ? selectedUnit.hasMoved ? 'Отряд уже переместился в этом ходу.' : 'Выбери соседнюю подсвеченную клетку.' : selectedUnit.hasAttacked ? 'Отряд уже атаковал в этом ходу.' : 'Выбери подсвеченный вражеский отряд.'}</p></> : <p className="battle-hint">Выбери свой отряд на поле, чтобы увидеть приказы.</p>}</section>
          {match.status === 'active' && <button className="button button-primary battle-end-turn" type="button" disabled={!isMyTurn || busy} onClick={() => sendAction('end-turn')}>Завершить ход <span>→</span></button>}
          {match.status === 'active' && !confirmSurrender && <button className="button button-surrender" type="button" disabled={busy} onClick={() => setConfirmSurrender(true)}>Сдаться и выйти</button>}
          {match.status === 'active' && confirmSurrender && <section className="battle-surrender-confirm" role="alertdialog" aria-labelledby="surrender-title"><b id="surrender-title">Сдаться и завершить бой?</b><p>Противнику будет засчитана победа. Это действие нельзя отменить.</p><div><button className="button button-surrender-confirm" type="button" disabled={busy} onClick={() => sendAction('surrender')}>{busy ? 'ЗАВЕРШАЮ…' : 'Подтвердить сдачу'}</button><button className="button button-outline" type="button" disabled={busy} onClick={() => setConfirmSurrender(false)}>Продолжить бой</button></div></section>}
          {match.status === 'finished' && match.roomCode && room?.status === 'finished' && <button className="button button-primary battle-rematch" type="button" disabled={roomBusy} onClick={requestRematch}>{roomBusy ? 'СОХРАНЯЮ…' : room.rematchReady?.[room.viewerId] ? 'Ждём согласия соперника…' : 'Сыграть ещё раз'}</button>}
          {match.status === 'finished' && <div className={`battle-result ${didWin ? 'is-victory' : 'is-defeat'}`}><button type="button" className="button button-outline" onClick={() => { localStorage.removeItem(MATCH_KEY); setMatchId(''); setMatch(null); setMatchError('') }}>Вернуться в узел связи</button></div>}
          {toast && <p className="battle-toast" role="status">{toast}</p>}{matchError && <p className="online-error" role="alert">{matchError}</p>}
          <section className="battle-panel battle-log-panel"><p className="eyebrow">ЖУРНАЛ ОПЕРАЦИИ</p><div className="battle-log" aria-live="polite">{[...match.log].reverse().map((entry) => <p key={entry.id}><small>ХОД {entry.turn}</small>{entry.text}</p>)}</div></section>
        </aside>
      </div>
    </section>}
  </main>
}
