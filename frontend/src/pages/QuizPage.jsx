import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { campaignLevels, resourceLabels } from '../data/imperiumCampaign'
import { applyServerProgress, getProgress } from '../utils/gameProgress'
import { postJson } from '../utils/api'
import './QuizPage.css'

const freshMeters = () => ({ supplies: 2, unity: 1, intel: 1 })
const meterNames = { supplies: 'Снабжение', unity: 'Поддержка', intel: 'Разведданные' }
const effectsFor = (effect) => Object.entries(effect).map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${meterNames[key].toLowerCase()}`).join(' · ')

export default function QuizPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [progress, setProgress] = React.useState(getProgress)
  const [sceneIndex, setSceneIndex] = React.useState(0)
  const [meters, setMeters] = React.useState(freshMeters)
  const [result, setResult] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [feedback, setFeedback] = React.useState('')
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
    return <main className="content-page campaign-page">
      <button className="back-link campaign-back" type="button" onClick={leaveLevel}>← Карта кампании</button>
      <p className="eyebrow">ОПЕРАЦИЯ {level.number} · {level.subtitle.toUpperCase()}</p>
      <h1>{level.title}</h1>
      <p className="hero-lead">{level.objective}</p>
      <p className="campaign-note">Игровая операция — авторский сценарий. Архивная глава после победы пересказывает канонический лор и приводит источники.</p>
      {alreadyComplete ? <section className="campaign-result"><p className="eyebrow">ОПЕРАЦИЯ УЖЕ ЗАВЕРШЕНА</p><h2>Досье ждёт в архиве</h2><Link className="button button-primary" to={`/archive/imperium/${level.id}`}>Открыть запись · {level.number} <span>→</span></Link></section> : <>
        <div className="campaign-meters">{Object.entries(resourceLabels).map(([key, label]) => <div className="campaign-meter" key={key}><div><span>{label}</span><b>{meters[key]} <small>/ цель {level.target[key]}</small></b></div><div className="campaign-meter-track"><span className={meters[key] >= level.target[key] ? 'meter-ready' : ''} style={{ width: `${Math.min(100, Math.max(0, meters[key] / Math.max(level.target[key], 5) * 100))}%` }} /></div></div>)}</div>
        {result === 'success' ? <section className="campaign-result"><p className="eyebrow">ОПЕРАЦИЯ ВЫПОЛНЕНА · +100 XP</p><h2>Новый материал найден</h2><p>Отчёт принят. Теперь можно открыть архивную главу об этом этапе истории Империума.</p><Link className="button button-primary" to={`/archive/imperium/${level.id}`}>Открыть досье <span>→</span></Link></section> : <section className="campaign-scene">
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

  return <main className="content-page campaign-page">
    <Link className="back-link" to="/">← На главную</Link>
    <p className="eyebrow">КАМПАНИЯ · ИМПЕРИУМ ЧЕЛОВЕЧЕСТВА</p>
    <h1>Путь к звёздам</h1>
    <p className="hero-lead">Отдай приказы в трёх коротких операциях. Распределяй силы, поддержку и разведданные, чтобы открывать новые главы лора. Знание Warhammer не требуется.</p>
    <p className="campaign-note">Сюжетные операции — игровые сценарии проекта; архивные досье после них основаны на источниках по Warhammer 40,000.</p>
    <div className="campaign-levels">{campaignLevels.map((item, index) => {
      const done = completedLevels.includes(item.id)
      const canStart = index === 0 || completedLevels.includes(campaignLevels[index - 1].id)
      return <article className={`campaign-level ${done ? 'level-complete' : ''} ${canStart ? '' : 'level-locked'}`} key={item.id}>
        <div className="campaign-level-index">{done ? '✓' : item.number}</div>
        <div className="campaign-level-copy"><span className="eyebrow">{item.subtitle}</span><h2>{item.title}</h2><p>{item.objective}</p></div>
        <div className="campaign-level-cta">{done ? <Link className="button button-outline" to={`/archive/imperium/${item.id}`}>Досье открыто <span>↗</span></Link> : canStart ? <button className="button button-primary" type="button" onClick={() => setSearchParams({ level: item.id })}>Начать операцию <span>→</span></button> : <span className="sealed-count">ЗАКРЫТО · ПРОЙДИ ПРЕДЫДУЩУЮ</span>}</div>
      </article>
    })}</div>
    <p className="campaign-next-hint">Завершение каждой операции открывает отдельную архивную главу и следующий этап кампании.</p>
  </main>
}
