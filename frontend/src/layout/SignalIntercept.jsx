import React from 'react'
import { chaosRecords } from '../data/chaosCampaign'
import { imperiumRecords } from '../data/imperiumCampaign'
import { orksRecords } from '../data/orksCampaign'
import { tauRecords } from '../data/tauCampaign'
import { applyServerProgress, FACTION_DETAILS, getProgress } from '../utils/gameProgress'
import { apiRequest, getCurrentUser, isAuthenticated } from '../utils/api'

const SIGNAL_INTERVAL = 3 * 60 * 1000
const STORAGE_PREFIX = 'sv-signal-intercept:'
const RECORDS = { imperium: imperiumRecords, chaos: chaosRecords, orks: orksRecords, tau: tauRecords }
const FIRST_SIGNAL_AWARD = {
  id: 'first-enemy-signal',
  icon: '⌁',
  name: 'Первый перехваченный сигнал врага',
  description: 'Перехвати первую запись вражеской фракции.',
}
const LORE_COLLECTION_AWARDS = {
  imperium: { id: 'all-lore-imperium', icon: 'I', name: 'Данные Империума', description: 'Перехвачены все архивные досье Империума.' },
  chaos: { id: 'all-lore-chaos', icon: '⛧', name: 'Данные Хаоса', description: 'Перехвачены все архивные досье сил Хаоса.' },
  orks: { id: 'all-lore-orks', icon: 'W', name: 'Данные Орков', description: 'Перехвачены все архивные досье орков.' },
  tau: { id: 'all-lore-tau', icon: 'T', name: 'Архив Высшего блага', description: 'Перехвачены все архивные досье Империи Тау.' },
}
const DECRYPT_GLYPHS = '01ABCDEFЖЗИЙКЛМНОПРСТУФХЦЧШЩΩ∆⌁⌖⟁#%'

function DecryptText({ text, delay = 0 }) {
  const [progress, setProgress] = React.useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0)
  const chars = Array.from(text)

  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1)
      return undefined
    }
    const duration = Math.min(2600, Math.max(1200, chars.length * 16))
    const startedAt = performance.now() + delay
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt
      if (elapsed < 0) return
      const value = Math.min(1, elapsed / duration)
      setProgress(value)
      if (value === 1) window.clearInterval(timer)
    }, 42)
    return () => window.clearInterval(timer)
  }, [delay, chars.length])

  const settledCount = Math.floor(progress * chars.length)
  const frame = Math.floor(progress * 1000)
  return <span className="decrypt-text" aria-label={text}>
    {chars.map((char, index) => {
      if (index < settledCount || !/[\p{L}\p{N}]/u.test(char)) return <span className="decrypt-settled" aria-hidden="true" key={index}>{char}</span>
      const glyphIndex = (index * 17 + frame * 13 + Math.floor(frame / 3) * 7) % DECRYPT_GLYPHS.length
      return <span className="decrypt-glyph" aria-hidden="true" key={index}>{DECRYPT_GLYPHS[glyphIndex]}</span>
    })}
  </span>
}

function storageKey(user) {
  return `${STORAGE_PREFIX}${user?.id || user?.username || 'anonymous'}`
}

function readState(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null')
    if (saved && Number.isFinite(saved.nextAt)) return {
      ...saved,
      seenRecordIds: Array.isArray(saved.seenRecordIds) ? saved.seenRecordIds : [],
    }
  } catch {}
  return { nextAt: Date.now() + SIGNAL_INTERVAL, count: 0, options: null, seenRecordIds: [] }
}

function makeOptions(factionId, count, seenRecordIds = []) {
  const enemyFactions = Object.keys(FACTION_DETAILS).filter((id) => id !== factionId)
  const offset = count % enemyFactions.length
  const ordered = [...enemyFactions.slice(offset), ...enemyFactions.slice(0, offset)]
  let availableByFaction = ordered.map((id) => ({
    id,
    records: RECORDS[id].filter((record) => !seenRecordIds.includes(`${id}:${record.id}`)),
  }))

  // Each signal offers one new record from both enemy factions. Start a fresh cycle
  // only after the available records for one of those factions have been shown.
  if (availableByFaction.some(({ records }) => records.length === 0)) {
    availableByFaction = ordered.map((id) => ({ id, records: RECORDS[id] }))
  }

  return availableByFaction.map(({ id, records }, index) => {
    const record = records[(count + index) % records.length]
    return { factionId: id, recordId: record.id }
  }).slice(0, 2)
}

export default function SignalIntercept() {
  const user = getCurrentUser()
  const factionId = FACTION_DETAILS[user?.faction] ? user.faction : 'imperium'
  const key = storageKey(user)
  const [state, setState] = React.useState(() => readState(key))
  const [now, setNow] = React.useState(Date.now())
  const [open, setOpen] = React.useState(false)
  const [achievementPopup, setAchievementPopup] = React.useState(null)
  const [readingBusy, setReadingBusy] = React.useState(false)
  const [readingError, setReadingError] = React.useState('')
  const [readThrough, setReadThrough] = React.useState(false)
  const [decryptFinished, setDecryptFinished] = React.useState(false)
  const dialogRef = React.useRef(null)

  React.useEffect(() => {
    if (!isAuthenticated()) return undefined
    const tick = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(tick)
  }, [])

  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  React.useEffect(() => {
    if (!isAuthenticated() || now < state.nextAt || open || state.options) return
    const localSeenRecordIds = Array.isArray(state.seenRecordIds) ? state.seenRecordIds : []
    const syncedLore = getProgress().interceptedLore || {}
    const serverSeenRecordIds = Object.entries(syncedLore).flatMap(([id, records]) =>
      (Array.isArray(records) ? records : []).map((recordId) => `${id}:${recordId}`),
    )
    const seenRecordIds = [...new Set([...localSeenRecordIds, ...serverSeenRecordIds])]
    const options = makeOptions(factionId, state.count, seenRecordIds)
    setState((current) => ({
      ...current,
      count: current.count + 1,
      options,
      selectedSignal: null,
      nextAt: 0,
    }))
    setReadingError('')
    setReadThrough(false)
    setOpen(true)
    apiRequest('/signal-intercept', { method: 'POST' }).then(({ progress, awarded }) => {
      if (progress) applyServerProgress(progress)
      if (awarded) setAchievementPopup(FIRST_SIGNAL_AWARD)
    }).catch(() => {})
  }, [factionId, now, open, state.count, state.nextAt, state.options, state.seenRecordIds])

  React.useEffect(() => {
    if (!open || !state.selectedSignal) return undefined
    setReadThrough(false)
    setDecryptFinished(false)
    const record = RECORDS[state.selectedSignal.factionId]?.find((item) => item.id === state.selectedSignal.recordId)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDecryptFinished(true)
    }
    const decodeTime = record?.paragraphs.reduce((max, paragraph, index) =>
      Math.max(max, Math.min(2600, Math.max(1200, Array.from(paragraph).length * 16)) + index * 240), 0) || 0
    const decodeTimer = window.setTimeout(() => {
      setDecryptFinished(true)
      const dialog = dialogRef.current
      if (dialog) setReadThrough(dialog.scrollTop + dialog.clientHeight >= dialog.scrollHeight - 12)
    }, decodeTime + 120)
    const frame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current
      if (dialog && dialog.scrollHeight <= dialog.clientHeight + 2) setReadThrough(true)
    })
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(decodeTimer)
    }
  }, [open, state.selectedSignal])

  React.useEffect(() => {
    if (!achievementPopup) return undefined
    const timeout = window.setTimeout(() => setAchievementPopup(null), 7000)
    return () => window.clearTimeout(timeout)
  }, [achievementPopup])

  if (!isAuthenticated()) return null

  const remaining = state.options ? 0 : Math.max(0, state.nextAt - now)
  const minutes = String(Math.floor(remaining / 60000)).padStart(2, '0')
  const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')
  const optionRecords = (state.options || []).map(({ factionId: id, recordId }) => ({
    faction: { ...FACTION_DETAILS[id], id },
    record: RECORDS[id].find((entry) => entry.id === recordId),
  })).filter(({ record }) => record)
  const selectedFactionId = state.selectedSignal?.factionId
  const selected = selectedFactionId && RECORDS[selectedFactionId]?.find((record) => record.id === state.selectedSignal.recordId)
    ? { faction: { ...FACTION_DETAILS[selectedFactionId], id: selectedFactionId }, record: RECORDS[selectedFactionId].find((record) => record.id === state.selectedSignal.recordId) }
    : null
  const closeSignal = () => {
    setOpen(false)
    setReadingError('')
  }

  function trackDialogScroll(event) {
    const dialog = event.currentTarget
    if (dialog.scrollTop + dialog.clientHeight >= dialog.scrollHeight - 12) setReadThrough(true)
  }

  async function finishReading() {
    if (!selected || !readThrough || !decryptFinished || readingBusy) return
    setReadingBusy(true)
    setReadingError('')
    try {
      const result = await apiRequest('/signal-intercept/read', {
        method: 'POST',
        body: JSON.stringify({ factionId: selected.faction.id, recordId: selected.record.id }),
      })
      if (result.progress) applyServerProgress(result.progress)
      setState((current) => ({
        ...current,
        seenRecordIds: [...new Set([...current.seenRecordIds, `${selected.faction.id}:${selected.record.id}`])],
        selectedSignal: null,
        options: null,
        nextAt: Date.now() + SIGNAL_INTERVAL,
      }))
      if (result.awarded) {
        setAchievementPopup(LORE_COLLECTION_AWARDS[result.sourceFaction])
      } else if (result.awardedCampaignIds?.length) {
        const newestRecordId = result.awardedCampaignIds[result.awardedCampaignIds.length - 1].replace('campaign-', '')
        const record = RECORDS[result.sourceFaction].find((entry) => entry.id === newestRecordId)
        if (record) setAchievementPopup({ id: result.awardedCampaignIds.at(-1), icon: '✦', name: record.title, description: 'История этой операции внесена в боевые отличия.' })
      }
      closeSignal()
    } catch (error) {
      setReadingError(error.message || 'Не удалось передать запись в архив.')
    } finally {
      setReadingBusy(false)
    }
  }

  return <>
    {achievementPopup && <aside className="achievement-toast signal-achievement-toast" role="status" aria-live="polite"><span className="achievement-icon">{achievementPopup.icon}</span><div><span className="eyebrow">НОВОЕ БОЕВОЕ ОТЛИЧИЕ</span><b>{achievementPopup.name}</b><small>{achievementPopup.description}</small></div><button type="button" aria-label="Закрыть уведомление" onClick={() => setAchievementPopup(null)}>×</button></aside>}
    <aside className="signal-status" aria-live="polite">
      <span className={`signal-status-dot ${remaining === 0 ? 'signal-ready' : ''}`} />
      <span>{state.options ? 'ПЕРЕХВАТ ОЖИДАЕТ ПРОЧТЕНИЯ' : remaining === 0 ? 'ПЕРЕХВАТ СИГНАЛА' : `СЛЕДУЮЩИЙ СИГНАЛ · ${minutes}:${seconds}`}</span>
      {state.options && !open && <button type="button" onClick={() => setOpen(true)}>{selected ? 'ПРОДОЛЖИТЬ ДОСЬЕ' : 'ОТКРЫТЬ'}</button>}
      {!state.options && remaining === 0 && <button type="button" onClick={() => setNow(Date.now())}>ОТКРЫТЬ</button>}
    </aside>

    {open && <div className="signal-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeSignal()
    }}>
      <section className="signal-dialog" role="dialog" aria-modal="true" aria-labelledby="signal-title" ref={dialogRef} onScroll={trackDialogScroll}>
        <button className="signal-close" type="button" aria-label="Закрыть перехват" onClick={closeSignal}>×</button>
        <p className="eyebrow"><span className="signal-dot" /> ВХОДЯЩИЙ ПЕРЕХВАТ · СЕКТОР VER-IX</p>
        {!selected ? <>
          <h2 id="signal-title">Пойман чужой сигнал</h2>
          <p className="signal-intro">В эфире две записи с разных фронтов. Выбери досье для изучения. Следующий сигнал появится через три минуты после завершения чтения.</p>
          <div className="signal-options">{optionRecords.map(({ faction, record }) => <article className={`signal-option ${faction.mark === '⛧' ? 'signal-chaos' : faction.mark === 'WAAAGH!' ? 'signal-orks' : faction.id === 'tau' ? 'signal-tau' : ''}`} key={record.id}>
            <span className="signal-option-faction">{faction.mark} · {faction.shortName.toUpperCase()}</span>
            <h3>{record.title}</h3>
            <p>{record.subtitle}</p>
            <button className="button button-outline" type="button" onClick={() => { setState((current) => ({ ...current, selectedSignal: { factionId: faction.id, recordId: record.id } })); setReadThrough(false) }}>Открыть досье <span>→</span></button>
          </article>)}</div>
        </> : <>
          <p className="eyebrow">ДОСЬЕ · {selected.faction.shortName.toUpperCase()}</p>
          <h2 id="signal-title">{selected.record.title}</h2>
          <p className="signal-record-subtitle">{selected.record.subtitle}</p>
          <article className="signal-record-body signal-decrypting" key={selected.record.id} aria-label="Расшифрованное досье">{selected.record.paragraphs.map((paragraph, index) => <p key={paragraph}><DecryptText text={paragraph} delay={index * 240} /></p>)}</article>
          <div className="signal-dialog-actions">
            <button className="button button-primary" type="button" onClick={finishReading} disabled={readingBusy || !readThrough || !decryptFinished} title={!readThrough ? 'Прокрути досье до конца, чтобы завершить чтение.' : undefined}>{readingBusy ? 'СОХРАНЯЮ…' : !decryptFinished ? 'ИДЁТ РАСШИФРОВКА…' : !readThrough ? 'ПРОЧИТАЙ ДО КОНЦА' : 'Завершить чтение'} <span>✓</span></button>
          </div>
          {readingError && <p className="signal-read-error" role="alert">{readingError}</p>}
        </>}
      </section>
    </div>}
  </>
}
