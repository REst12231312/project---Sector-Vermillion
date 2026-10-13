import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress, IMPERIUM_LEVEL_IDS, CHAOS_LEVEL_IDS, FACTION_DETAILS } from '../utils/gameProgress'
import { getCurrentUser, isAuthenticated } from '../utils/api'

const factions = [
  { id: 'imperium', name: 'Империум человечества', type: 'Кампания · 3 операции', mark: 'I', color: 'gold', text: 'Пройди путь от объединения Терры до встречи с потерянными Примархами.' },
  { id: 'chaos', name: 'Силы Хаоса', type: 'Кампания · 4 операции', mark: '⛧', color: 'red', text: 'Отследи заговор, падение Хоруса, предательство на Исстване и осаду Терры.' },
]

export default function HomePages() {
  const [progress, setProgress] = React.useState(() => isAuthenticated() ? getProgress() : { xp: 0, studiedFactions: [], dailyMission: null, achievements: [], answeredQuestions: [], discoveredEntries: [], readEntries: [], completedLevels: [] })
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])
  const user = getCurrentUser()
  const factionId = user?.faction === 'chaos' ? 'chaos' : 'imperium'
  const faction = FACTION_DETAILS[factionId]
  const levelIds = factionId === 'chaos' ? CHAOS_LEVEL_IDS : IMPERIUM_LEVEL_IDS
  const completed = (progress.completedLevels || []).filter((id) => levelIds.includes(id)).length
  const nextLevel = levelIds[completed]
  const campaignComplete = completed === levelIds.length
  const chaos = factionId === 'chaos'

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="signal-dot" /> ДОБРО ПОЖАЛОВАТЬ, {user?.username || 'АРХИВАРИУС'}</p>
          <h1>{chaos ? <>Ересь Хоруса.<br /><em>Твой приказ меняет ход мятежа.</em></> : <>История Империума.<br /><em>Твой приказ меняет поход.</em></>}</h1>
          <p className="hero-lead">{chaos ? 'Веди силы Хаоса от первых заговоров до осады Терры. Принимай решения в четырёх операциях и открывай досье о Варпе, падении Хоруса и примархах-предателях.' : 'Проведи экспедицию через три сюжетные операции. Принимай решения, береги снабжение и открывай архивные главы о рождении Империума, Великом крестовом походе и Примархах.'}</p>
          <div className="hero-actions">
            <Link className="button button-primary" to={user ? '/campaign' : '/register'}>{user ? 'Начать кампанию' : 'Вступить в ряды'} <span>↗</span></Link>
            <Link className="text-link" to={user ? faction.archivePath : '/factions'}>{user ? `Архив: ${faction.shortName}` : 'О фракции'} <span>→</span></Link>
          </div>
        </div>
        <div className="hero-art" aria-label="Схематичное изображение планеты сектора">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="planet"><span>V</span></div>
          <div className="art-label"><span>ОПЕРАЦИЯ 01 / ТЕРРА</span><b>ПРИКАЗ ОЖИДАЕТ</b></div>
          <span className="coordinate coord-top">41.009.M3</span><span className="coordinate coord-bottom">ГЛУБИНА СЕКТОРА // 08</span>
        </div>
      </section>

      <section className="mission-strip">
        <div className="mission-icon">✦</div>
        <div className="mission-copy"><span className="eyebrow">КАМПАНИЯ · {faction.shortName.toUpperCase()}</span><h2>{campaignComplete ? 'Все открытые операции завершены' : nextLevel ? `Операция ${String(completed + 1).padStart(2, '0')} ждёт приказа` : 'Архив кампании открыт'}</h2><p>{campaignComplete ? `Все досье фракции ${faction.shortName} ждут в архиве.` : 'Каждая победа открывает новую главу лора и следующую операцию.'}</p></div>
        <div className="mission-reward"><span>ПРОЙДЕНО</span><b>{completed}/{levelIds.length}</b></div>
        <Link className={`button ${campaignComplete ? 'button-done' : 'button-outline'}`} to={user ? '/campaign' : '/register'}>{campaignComplete ? 'Открыть кампанию' : user ? 'Продолжить' : 'Вступить в ряды'} <span>→</span></Link>
      </section>

      <section className={`quiz-promo ${chaos ? 'chaos-theme' : ''}`}><div className="quiz-promo-mark">{faction.mark}</div><div><p className="eyebrow">СЮЖЕТНАЯ КАМПАНИЯ · {levelIds.length} ОПЕРАЦИИ</p><h2>{chaos ? 'Веди восстание' : 'Командуй экспедицией'}</h2><p>Выбирай тактику, следи за ресурсами и открывай архивные главы истории Warhammer 40,000.</p></div><Link className="button button-outline" to={user ? '/campaign' : '/register'}>{user ? 'К карте операций' : 'Вступить в ряды'} <span>→</span></Link></section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">ФРАКЦИИ КАМПАНИИ</p><h2>{faction.name}</h2></div><Link className="text-link" to="/factions">Открыть досье <span>→</span></Link></div>
        <div className="faction-grid">{factions.map((faction, index) => <Link className={`faction-card ${faction.color}`} to={`/factions/${faction.id}`} key={faction.id}><div className="card-top"><span>ДОСЬЕ 0{index + 1}</span><span>↗</span></div><div className="faction-mark">{faction.mark}</div><span className="faction-type">{faction.type}</span><h3>{faction.name}</h3><p>{faction.text}</p><span className="card-bottom">ОТКРЫТЬ ДОСЬЕ <span>→</span></span></Link>)}</div>
      </section>
      <footer className="page-footer"><span>SECTOR: VERMILLION</span><span>ЗНАНИЕ — ПЕРВАЯ ЛИНИЯ ОБОРОНЫ</span><span>{progress.xp} XP В АРХИВЕ</span></footer>
    </main>
  )
}
