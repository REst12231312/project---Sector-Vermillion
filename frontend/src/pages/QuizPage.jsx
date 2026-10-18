import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { campaignLevels as imperiumLevels, resourceLabels } from '../data/imperiumCampaign'
import { chaosLevels } from '../data/chaosCampaign'
import { orksLevels } from '../data/orksCampaign'
import { tauLevels } from '../data/tauCampaign'
import { applyServerProgress, getProgress } from '../utils/gameProgress'
import { getCurrentUser, postJson, saveAuth } from '../utils/api'
import './QuizPage.css'
import './TauTheme.css'

const freshMeters = () => ({ supplies: 2, unity: 1, intel: 1 })
const meterNames = { supplies: 'Снабжение', unity: 'Поддержка', intel: 'Разведданные' }
const effectsFor = (effect) => Object.entries(effect).map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${meterNames[key].toLowerCase()}`).join(' · ')
const campaignAwards = {
  'imperium-origin': { id: 'campaign-imperium-origin', icon: 'I', name: 'Объединитель Терры', description: 'Операция «Объединение Терры» завершена.' },
  'great-crusade': { id: 'campaign-great-crusade', icon: 'II', name: 'Навигатор Великого похода', description: 'Операция Великого крестового похода завершена.' },
  primarchs: { id: 'campaign-primarchs', icon: 'III', name: 'Собиратель сыновей', description: 'Операция по поиску Примархов завершена.' },
  'istvaan-iii-warning': { id: 'campaign-istvaan-iii-warning', icon: 'IV', name: 'Вестник Исствана', description: 'Ты помог доставить Терре весть о мятеже.' },
  'istvaan-v': { id: 'campaign-istvaan-v', icon: 'V', name: 'Выживший Исствана', description: 'Ты помог лоялистам пережить предательство на Исстване V.' },
  'imperium-calth': { id: 'campaign-imperium-calth', icon: 'VI', name: 'Оборона Ультрамара', description: 'Отряды Ультрамаринов удержались после удара на Калте.' },
  'siege-terra-loyalist': { id: 'campaign-siege-terra-loyalist', icon: 'VII', name: 'Щит Терры', description: 'Ты помог защитникам Императорского дворца.' },
  'scouring-aftermath': { id: 'campaign-scouring-aftermath', icon: 'VIII', name: 'Начало Очищения', description: 'Империум начал долгую кампанию против предателей.' },
  'chaos-whispers': { id: 'campaign-chaos-whispers', icon: 'I', name: 'Глас из варпа', description: 'Первая операция сил Хаоса завершена.' },
  'davin-fall': { id: 'campaign-davin-fall', icon: 'II', name: 'Путь Воителя', description: 'Операция на Давине завершена.' },
  'istvaan-betrayal': { id: 'campaign-istvaan-betrayal', icon: 'III', name: 'Пепел Исствана', description: 'Предательство на Исстване завершено.' },
  'chaos-calth': { id: 'campaign-chaos-calth', icon: 'IV', name: 'Пепел Калта', description: 'Несущие Слово нанесли удар по Ультрамаринам.' },
  'siege-terra': { id: 'campaign-siege-terra', icon: 'V', name: 'Осада Терры', description: 'Последняя битва Хоруса за власть завершена.' },
  'battle-luna': { id: 'campaign-battle-luna', icon: 'VI', name: 'Побег из Сола', description: 'Ты вывел часть сил из Солнечной системы.' },
  'eye-retreat': { id: 'campaign-eye-retreat', icon: 'VII', name: 'Путь в Око', description: 'Уцелевшие силы Хаоса добрались до убежища.' },
  'orks-gathering': { id: 'campaign-orks-gathering', icon: 'I', name: 'Зов Waaagh!', description: 'Первая орда собрана.' },
  'orks-ullanor-gates': { id: 'campaign-orks-ullanor-gates', icon: 'II', name: 'Врата Улланора', description: 'Орда добралась до крепости Урлакка Урга.' },
  'orks-ullanor-battle': { id: 'campaign-orks-ullanor-battle', icon: 'III', name: 'Последний бой Урлакка Урга', description: 'Досье о канонической битве на Улланоре открыто.' },
  'orks-scattered-warband': { id: 'campaign-orks-scattered-warband', icon: 'IV', name: 'Орда снова собирается', description: 'Банда возродилась в 41-м тысячелетии.' },
  'orks-armageddon': { id: 'campaign-orks-armageddon', icon: 'V', name: 'Зелёный прилив', description: 'Кампания Армагеддона завершена.' },
  'tau-first-sphere': { id: 'campaign-tau-first-sphere', icon: 'I', name: 'Общее предназначение', description: 'Подготовь первые экспедиции Империи Тау.' },
  'tau-damocles': { id: 'campaign-tau-damocles', icon: 'II', name: 'Рубеж Дамокла', description: 'Переживи Крестовый поход Дамокла.' },
  'tau-arkunasha': { id: 'campaign-tau-arkunasha', icon: 'III', name: 'Щит Аркунаши', description: 'Удержи орочий натиск вместе с Фарсайтом.' },
  'tau-farsight-enclaves': { id: 'campaign-tau-farsight-enclaves', icon: 'IV', name: 'Красный исход', description: 'Сопроводи Фарсайта в изгнание.' },
  'tau-fourth-sphere': { id: 'campaign-tau-fourth-sphere', icon: 'V', name: 'Возвращение Четвёртой', description: 'Собери экспедицию после варп-катастрофы.' },
  'tau-fifth-sphere': { id: 'campaign-tau-fifth-sphere', icon: 'VI', name: 'Новая сфера', description: 'Поддержи экспансию Шэдоусан.' },
}

export default function QuizPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [progress, setProgress] = React.useState(getProgress)
  const [sceneIndex, setSceneIndex] = React.useState(0)
  const [replaying, setReplaying] = React.useState(false)
  const [meters, setMeters] = React.useState(freshMeters)
  const [result, setResult] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [feedback, setFeedback] = React.useState('')
  const [campaignMessage] = React.useState(() => sessionStorage.getItem('sv-alignment-notice') || '')
  const [achievementPopup, setAchievementPopup] = React.useState(null)
  const completionLock = React.useRef(false)
  const userFaction = getCurrentUser()?.faction
  const faction = ['imperium', 'chaos', 'orks', 'tau'].includes(userFaction) ? userFaction : 'imperium'
  const campaignLevels = faction === 'chaos' ? chaosLevels : faction === 'orks' ? orksLevels : faction === 'tau' ? tauLevels : imperiumLevels
  const factionTitle = faction === 'chaos' ? 'СИЛЫ ХАОСА' : faction === 'orks' ? 'ОРКИ' : faction === 'tau' ? 'ИМПЕРИЯ ТАУ' : 'ИМПЕРИУМ ЧЕЛОВЕЧЕСТВА'
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
    if (campaignMessage) sessionStorage.removeItem('sv-alignment-notice')
  }, [campaignMessage])

  React.useEffect(() => {
    completionLock.current = false
    setReplaying(false)
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
    completionLock.current = false
    setSceneIndex(0)
    setMeters(freshMeters())
    setResult(null)
    setFeedback('')
  }

  function replayLevel() {
    completionLock.current = false
    setReplaying(true)
    setSceneIndex(0)
    setMeters(freshMeters())
    setResult(null)
    setFeedback('Повтор операции не начисляет опыт и достижения. Отмеченный жестокий приказ всё ещё может изменить твою сторону.')
  }

  async function chooseAction(action) {
    if (!level || busy || result !== null || completionLock.current) return
    if (action.defection) {
      setBusy(true)
      setFeedback('Приказ принят. Архив фиксирует раскол…')
      try {
        const auth = await postJson('/campaign/defect', { levelId: level.id, choiceTitle: action.title })
        saveAuth(auth)
        sessionStorage.setItem('sv-alignment-notice', 'Ты перешёл на сторону Хаоса. Кампания Империума и её архив закрыты; первая операция Хаоса уже доступна.')
        window.location.assign('/campaign')
      } catch (error) {
        setFeedback(error.message)
      } finally {
        setBusy(false)
      }
      return
    }
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

    completionLock.current = true
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
      completionLock.current = false
      setMeters(meters)
      setFeedback(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (selectedLevel && level && unlocked) {
    const scene = level.scenes[sceneIndex]
    const alreadyComplete = completedLevels.includes(level.id)
    return <main className={`content-page campaign-page ${faction === 'chaos' ? 'chaos-theme' : faction === 'orks' ? 'orks-theme' : faction === 'tau' ? 'tau-theme' : ''}`}>
      {achievementPopup && <aside className="achievement-toast" role="status" aria-live="polite"><span className="achievement-icon">{achievementPopup.icon}</span><div><span className="eyebrow">НОВОЕ БОЕВОЕ ОТЛИЧИЕ</span><b>{achievementPopup.name}</b><small>{achievementPopup.description}</small></div><button type="button" aria-label="Закрыть уведомление" onClick={() => setAchievementPopup(null)}>×</button></aside>}
      <button className="back-link campaign-back" type="button" onClick={leaveLevel}>← Карта кампании</button>
      <p className="eyebrow">ОПЕРАЦИЯ {level.number} · {level.subtitle.toUpperCase()}</p>
      <h1>{level.title}</h1>
      <p className="hero-lead">{level.objective}</p>
      <p className="campaign-note">Игровая операция — авторский сценарий. Архивная глава после победы пересказывает канонический лор и приводит источники.</p>
      {alreadyComplete && !replaying ? <section className="campaign-result"><p className="eyebrow">ОПЕРАЦИЯ УЖЕ ЗАВЕРШЕНА</p><h2>Досье ждёт в архиве</h2><Link className="button button-primary" to={`/archive/${faction}/${level.id}`}>Открыть запись · {level.number} <span>→</span></Link>{faction === 'imperium' && level.scenes.some((item) => item.choices.some((choice) => choice.defection)) && <button className="button button-outline replay-choice-button" type="button" onClick={replayLevel}>Переиграть и выбрать сторону <span>↻</span></button>}</section> : <>
        <div className="campaign-meters">{Object.entries(resourceLabels).map(([key, label]) => {
          const value = meters[key]
          const percentage = Math.min(100, Math.max(0, value / level.target[key] * 100))
          return <div className="campaign-meter" key={key}><div><span>{label}</span><b>{value} <small>/ цель {level.target[key]}</small></b></div><div className="campaign-meter-track"><span className={value >= level.target[key] ? 'meter-ready' : ''} style={{ width: `${percentage}%` }} /></div></div>
        })}</div>
        {result === 'success' ? <section className="campaign-result"><p className="eyebrow">{alreadyComplete ? 'ПОВТОР ОПЕРАЦИИ · БЕЗ НАГРАДЫ' : 'ОПЕРАЦИЯ ВЫПОЛНЕНА · +100 XP'}</p><h2>Новый материал найден</h2><p>{alreadyComplete ? 'Операция пройдена повторно. Опыт и достижения повторно не начисляются.' : 'Отчёт принят. Теперь можно открыть архивную главу.'}</p><Link className="button button-primary" to={`/archive/${faction}/${level.id}`}>Открыть досье <span>→</span></Link></section> : <section className="campaign-scene">
          <div className="campaign-scene-top"><span className="eyebrow">ЭТАП {sceneIndex + 1} ИЗ {level.scenes.length}</span><span className="sealed-count">ПРИКАЗЫВАЕТЕ ВЫ</span></div>
          <h2>{scene.title}</h2>
          <p>{scene.text}</p>
          {result !== 'failed' && <div className="campaign-actions">{scene.choices.map((action) => <button className={`campaign-action ${action.defection ? 'campaign-action-defection' : ''}`} key={action.title} type="button" onClick={() => chooseAction(action)} disabled={busy || result === 'success' || (alreadyComplete && !replaying)}><b>{action.title}</b>{action.defection && <strong className="defection-warning">РАСКОЛ · НЕОБРАТИМО</strong>}<span>{action.detail}</span><small>{effectsFor(action.effect)}</small></button>)}</div>}
          {feedback && <p className={`campaign-feedback ${result === 'failed' ? 'feedback-failed' : ''}`} role="status">{feedback}</p>}
          {result === 'failed' && <button className="button button-outline" type="button" onClick={restartLevel}>Повторить операцию <span>↻</span></button>}
        </section>}
      </>}
    </main>
  }

  return <main className={`content-page campaign-page ${faction === 'chaos' ? 'chaos-theme' : faction === 'orks' ? 'orks-theme' : faction === 'tau' ? 'tau-theme' : ''}`}>
    <Link className="back-link" to="/">← На главную</Link>
    {campaignMessage && <p className="campaign-alignment-notice" role="status">{campaignMessage}</p>}
    <p className="eyebrow">КАМПАНИЯ · {factionTitle}</p>
    <h1>{faction === 'chaos' ? 'Путь к Терре' : faction === 'orks' ? 'Путь Waaagh!' : faction === 'tau' ? 'Путь Высшего блага' : 'Путь к звёздам'}</h1>
    <p className="hero-lead">{faction === 'chaos' ? 'Веди тайные культы и мятежные легионы от первых шёпотов Варпа через Калт и осаду Терры к Очищению. Выбирай тактику, удерживай союзников и открывай новые главы.' : faction === 'orks' ? 'Собери орду, пройди каноническую битву на Улланоре и продолжи поход в 41-м тысячелетии. Распределяй снабжение, поддержку и разведданные. Знание Warhammer не требуется.' : faction === 'tau' ? 'Пройди шесть операций от первых сфер и Крестового похода Дамокла до Фарсайта, Четвёртой и Пятой сфер. Координируй касты, разведку и огневую поддержку во имя Высшего блага.' : 'Пройди восемь операций: от объединения Терры и поиска Примархов до Исствана, Калта, обороны Терры и послевоенного Очищения. Распределяй силы, поддержку и разведданные. Знание Warhammer не требуется.'}</p>
    <p className="campaign-note">Сюжетные операции — игровые сценарии проекта; архивные досье после них основаны на источниках по Warhammer 40,000.</p>
    <section className="campaign-map-shell" aria-label="Карта операций кампании">
      <header className="campaign-map-header">
        <div><p className="eyebrow">СТРАТЕГИЧЕСКАЯ КАРТА · {factionTitle}</p><h2>Траектория кампании</h2><p>Выбирай следующий узел маршрута и смотри, как меняется фронт.</p></div>
        <div className="campaign-map-progress"><span>УЗЛЫ ПРОЙДЕНЫ</span><b>{completedLevels.filter((id) => campaignLevels.some((item) => item.id === id)).length}<small> / {campaignLevels.length}</small></b><div><i style={{ width: `${completedLevels.filter((id) => campaignLevels.some((item) => item.id === id)).length / campaignLevels.length * 100}%` }} /></div></div>
      </header>
      <div className="campaign-map-legend"><span><i className="map-legend-ready" /> ДОСТУПНА</span><span><i className="map-legend-done">✓</i> ЗАВЕРШЕНА</span><span><i className="map-legend-locked">·</i> ЗАКРЫТА</span></div>
      <div className="campaign-map">{campaignLevels.map((item, index) => {
        const done = completedLevels.includes(item.id)
        const canStart = index === 0 || completedLevels.includes(campaignLevels[index - 1].id)
        const status = done ? 'complete' : canStart ? 'ready' : 'locked'
        return <article className={`campaign-map-stop map-side-${index % 2 ? 'right' : 'left'} map-stop-${status}`} key={item.id}>
          <span className="campaign-map-point" aria-hidden="true"><b>{done ? '✓' : item.number}</b></span>
          <div className="campaign-map-card">
            <div className="campaign-map-card-top"><span>ОПЕРАЦИЯ {item.number}</span><span>{done ? 'ВЫПОЛНЕНА' : canStart ? 'СИГНАЛ ОБНАРУЖЕН' : 'НЕТ ДОСТУПА'}</span></div>
            <span className="campaign-map-location">{item.subtitle}</span>
            <h2>{item.title}</h2>
            <p>{item.objective}</p>
            <div className="campaign-map-card-bottom"><span>УЗЕЛ {String(index + 1).padStart(2, '0')} · {faction === 'orks' ? 'ВОЕННЫЙ ФРОНТ' : faction === 'chaos' ? 'ЗОНА ВАРП-ИСКАЖЕНИЯ' : 'СЕКТОР ТЕРРА'}</span>
              {done ? <Link className="button button-outline" to={`/archive/${faction}/${item.id}`}>Открыть досье <span>↗</span></Link> : canStart ? <button className="button button-primary" type="button" onClick={() => setSearchParams({ level: item.id })}>Развернуть операцию <span>→</span></button> : <span className="campaign-map-locked-label">ПРОЙДИ ПРЕДЫДУЩИЙ УЗЕЛ</span>}
            </div>
          </div>
        </article>
      })}<article className={`campaign-map-stop map-side-${campaignLevels.length % 2 ? 'right' : 'left'} map-stop-ready campaign-online-stop`}>
        <span className="campaign-map-point" aria-hidden="true"><b>↗</b></span>
        <div className="campaign-map-card"><div className="campaign-map-card-top"><span>СЛЕДУЮЩАЯ ОПЕРАЦИЯ</span><span>СЕТЕВОЙ ФРОНТ</span></div><span className="campaign-map-location">НОВОЕ НАПРАВЛЕНИЕ · {factionTitle.toUpperCase()}</span><h2>Совместная операция</h2><p>Перейди к подготовке соединения для будущих сетевых миссий.</p><div className="campaign-map-card-bottom"><span>УЗЕЛ {String(campaignLevels.length + 1).padStart(2, '0')} · ОНЛАЙН-КАМПАНИЯ</span><Link className="button button-primary" to="/online">Развернуть операцию <span>→</span></Link></div></div>
      </article></div>
    </section>
    <p className="campaign-next-hint">Завершение каждой операции открывает отдельную архивную главу и следующий этап кампании.</p>
  </main>
}
