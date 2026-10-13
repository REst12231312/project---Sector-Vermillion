import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { campaignLevels as imperiumLevels, resourceLabels } from '../data/imperiumCampaign'
import { chaosLevels } from '../data/chaosCampaign'
import { applyServerProgress, getProgress } from '../utils/gameProgress'
import { getCurrentUser, postJson } from '../utils/api'
import './QuizPage.css'

const freshMeters = () => ({ supplies: 2, unity: 1, intel: 1 })
const meterNames = { supplies: 'Снабжение', unity: 'Поддержка', intel: 'Разведданные' }
const effectsFor = (effect) => Object.entries(effect).map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${meterNames[key].toLowerCase()}`).join(' · ')
const campaignAwards = {
  'imperium-origin': { id: 'campaign-imperium-origin', icon: 'I', name: 'Объединитель Терры', description: 'Операция «Объединение Терры» завершена.' },
  'great-crusade': { id: 'campaign-great-crusade', icon: 'II', name: 'Навигатор Великого похода', description: 'Операция Великого крестового похода завершена.' },
  primarchs: { id: 'campaign-primarchs', icon: 'III', name: 'Собиратель сыновей', description: 'Операция по поиску Примархов завершена.' },
  'chaos-whispers': { id: 'campaign-chaos-whispers', icon: 'I', name: 'Глас из варпа', description: 'Первая операция сил Хаоса завершена.' },
  'davin-fall': { id: 'campaign-davin-fall', icon: 'II', name: 'Путь Воителя', description: 'Операция на Давине завершена.' },
  'istvaan-betrayal': { id: 'campaign-istvaan-betrayal', icon: 'III', name: 'Пепел Исствана', description: 'Предательство на Исстване завершено.' },
  'siege-terra': { id: 'campaign-siege-terra', icon: 'IV', name: 'Осада Терры', description: 'Последняя операция кампании завершена.' },
}

export default function QuizPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [progress, setProgress] = React.useState(getProgress)
  const [sceneIndex, setSceneIndex] = React.useState(0)
  const [meters, setMeters] = React.useState(freshMeters)
  const [result, setResult] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [feedback, setFeedback] = React.useState('')
  const [achievementPopup, setAchievementPopup] = React.useState(null)
  const faction = getCurrentUser()?.faction === 'chaos' ? 'chaos' : 'imperium'
  const campaignLevels = faction === 'chaos' ? chaosLevels : imperiumLevels
  const factionTitle = faction === 'chaos' ? 'СИЛЫ ХАОСА' : 'ИМПЕРИУМ ЧЕЛОВЕЧЕСТВА'
  const selectedLevel = searchParams.get('level')
  const level = campaignLevels.find((item) => item.id === selectedLevel)
  const completedLevels = progress.completedLevels || []
  const levelIndex = campaignLevels.findIndex((item) => item.id === selectedLevel)
  const unlocked = levelIndex <= 0 || completedLevels.includes(campaignLevels[levelIndex - 1]?.id)

  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  React.useEffect(() => {
    setSceneIndex(0)
    setMeters(freshMeters())
    setResult(null)
    setFeedback('')
  }, [selectedLevel])

  React.useEffect(() => {
    if (!achievementPopup) return undefined
    const timeout = window.setTimeout(() => setAchievementPopup(null), 7000)
    return () => window.clearTimeout(timeout)
  }, [achievementPopup])

  function leaveLevel() {
    setSearchParams({})
  }

  function restartLevel() {
    setSceneIndex(0)
    setMeters(freshMeters())
    setResult(null)
    setFeedback('')
  }

  async function chooseAction(action) {
    const nextMeters = { ...meters }
    Object.entries(action.effect).forEach(([key, value]) => { nextMeters[key] += value })
    setMeters(nextMeters)

    if (sceneIndex < level.scenes.length - 1) {
      setFeedback(action.detail)
      setSceneIndex(sceneIndex + 1)
      return
    }

    const succeeded = Object.entries(level.target).every(([key, target]) => nextMeters[key] >= target)
    if (!succeeded) {
      setResult('failed')
      setFeedback('Операция не достигла всех целей. Измени приказы и попробуй ещё раз — ресурсы восстановятся.')
      return
    }

    setBusy(true)
    setFeedback('Приказы выполнены. Передаю отчёт в архив…')
    try {
      const savedProgress = await postJson('/campaign/complete', { levelId: level.id })
      applyServerProgress(savedProgress)
      const award = campaignAwards[level.id]
      if (award && !progress.achievements.includes(award.id) && savedProgress.achievements?.includes(award.id)) setAchievementPopup(award)
      setResult('success')
      setFeedback('Операция успешна. Доступ к новому досье открыт.')
    } catch (error) {
      setFeedback(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (selectedLevel && level && unlocked) {
    const scene = level.scenes[sceneIndex]
    const alreadyComplete = completedLevels.includes(level.id)
    return <main className={`content-page campaign-page ${faction === 'chaos' ? 'chaos-theme' : ''}`}>
      {achievementPopup && <aside className="achievement-toast" role="status" aria-live="polite"><span className="achievement-icon">{achievementPopup.icon}</span><div><span className="eyebrow">НОВОЕ БОЕВОЕ ОТЛИЧИЕ</span><b>{achievementPopup.name}</b><small>{achievementPopup.description}</small></div><button type="button" aria-label="Закрыть уведомление" onClick={() => setAchievementPopup(null)}>×</button></aside>}
      <button className="back-link campaign-back" type="button" onClick={leaveLevel}>← Карта кампании</button>
      <p className="eyebrow">ОПЕРАЦИЯ {level.number} · {level.subtitle.toUpperCase()}</p>
      <h1>{level.title}</h1>
      <p className="hero-lead">{level.objective}</p>
      <p className="campaign-note">Игровая операция — авторский сценарий. Архивная глава после победы пересказывает канонический лор и приводит источники.</p>
      {alreadyComplete ? <section className="campaign-result"><p className="eyebrow">ОПЕРАЦИЯ УЖЕ ЗАВЕРШЕНА</p><h2>Досье ждёт в архиве</h2><Link className="button button-primary" to={`/archive/${faction}/${level.id}`}>Открыть запись · {level.number} <span>→</span></Link></section> : <>
        <div className="campaign-meters">{Object.entries(resourceLabels).map(([key, label]) => <div className="campaign-meter" key={key}><div><span>{label}</span><b>{meters[key]} <small>/ цель {level.target[key]}</small></b></div><div className="campaign-meter-track"><span className={meters[key] >= level.target[key] ? 'meter-ready' : ''} style={{ width: `${Math.min(100, Math.max(0, meters[key] / Math.max(level.target[key], 5) * 100))}%` }} /></div></div>)}</div>
        {result === 'success' ? <section className="campaign-result"><p className="eyebrow">ОПЕРАЦИЯ ВЫПОЛНЕНА · +100 XP</p><h2>Новый материал найден</h2><p>Отчёт принят. Теперь можно открыть архивную главу.</p><Link className="button button-primary" to={`/archive/${faction}/${level.id}`}>Открыть досье <span>→</span></Link></section> : <section className="campaign-scene">
          <div className="campaign-scene-top"><span className="eyebrow">ЭТАП {sceneIndex + 1} ИЗ {level.scenes.length}</span><span className="sealed-count">ПРИКАЗЫВАЕТЕ ВЫ</span></div>
          <h2>{scene.title}</h2>
          <p>{scene.text}</p>
          <div className="campaign-actions">{scene.choices.map((action) => <button className="campaign-action" key={action.title} type="button" onClick={() => chooseAction(action)} disabled={busy}><b>{action.title}</b><span>{action.detail}</span><small>{effectsFor(action.effect)}</small></button>)}</div>
          {feedback && <p className={`campaign-feedback ${result === 'failed' ? 'feedback-failed' : ''}`} role="status">{feedback}</p>}
          {result === 'failed' && <button className="button button-outline" type="button" onClick={restartLevel}>Повторить операцию <span>↻</span></button>}
        </section>}
      </>}
    </main>
  }

  return <main className={`content-page campaign-page ${faction === 'chaos' ? 'chaos-theme' : ''}`}>
    <Link className="back-link" to="/">← На главную</Link>
    <p className="eyebrow">КАМПАНИЯ · {factionTitle}</p>
    <h1>{faction === 'chaos' ? 'Путь к Терре' : 'Путь к звёздам'}</h1>
    <p className="hero-lead">{faction === 'chaos' ? 'Веди тайные культы и мятежные легионы от первых шёпотов Варпа до осады Терры. Выбирай тактику, удерживай союзников и готовь наступление.' : 'Отдай приказы в трёх операциях. Распределяй силы, поддержку и разведданные, чтобы открывать новые главы лора. Знание Warhammer не требуется.'}</p>
    <p className="campaign-note">Сюжетные операции — игровые сценарии проекта; архивные досье после них основаны на источниках по Warhammer 40,000.</p>
    <div className="campaign-levels">{campaignLevels.map((item, index) => {
      const done = completedLevels.includes(item.id)
      const canStart = index === 0 || completedLevels.includes(campaignLevels[index - 1].id)
      return <article className={`campaign-level ${done ? 'level-complete' : ''} ${canStart ? '' : 'level-locked'}`} key={item.id}>
        <div className="campaign-level-index">{done ? '✓' : item.number}</div>
        <div className="campaign-level-copy"><span className="eyebrow">{item.subtitle}</span><h2>{item.title}</h2><p>{item.objective}</p></div>
        <div className="campaign-level-cta">{done ? <Link className="button button-outline" to={`/archive/${faction}/${item.id}`}>Досье открыто <span>↗</span></Link> : canStart ? <button className="button button-primary" type="button" onClick={() => setSearchParams({ level: item.id })}>Начать операцию <span>→</span></button> : <span className="sealed-count">ЗАКРЫТО · ПРОЙДИ ПРЕДЫДУЩУЮ</span>}</div>
      </article>
    })}</div>
    <p className="campaign-next-hint">Завершение каждой операции открывает отдельную архивную главу и следующий этап кампании.</p>
  </main>
}
