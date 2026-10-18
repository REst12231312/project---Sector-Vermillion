import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress, FACTION_DETAILS } from '../utils/gameProgress'
import { getCurrentUser, isAuthenticated } from '../utils/api'

const factions = [
  { id: 'imperium', name: 'Империум человечества', type: 'Кампания · 8 операций', mark: 'I', color: 'gold', text: 'Пройди путь от объединения Терры до Исствана, битвы за Калт, обороны Терры и Очищения.' },
  { id: 'chaos', name: 'Силы Хаоса', type: 'Кампания · 7 операций', mark: '⛧', color: 'red', text: 'Отследи заговор, падение Хоруса, Исстван, Калт, осаду Терры и изгнание в Око Ужаса.' },
  { id: 'orks', name: 'Орки', type: 'Кампания · 5 операций', mark: 'WAAAGH!', color: 'green', text: 'Собери орду, пройди путь от Улланора до Армагеддона и узнай, почему орки воюют с Империумом и Хаосом.' },
  { id: 'tau', name: 'Империя Тау', type: 'Кампания · 6 операций', mark: 'Т’АУ', color: 'blue', text: 'Пройди путь от первых сфер и Аркунаши до раскола Фарсайта и экспансии Пятой сферы.' },
]

export default function HomePages() {
  const [progress, setProgress] = React.useState(() => isAuthenticated() ? getProgress() : { xp: 0, studiedFactions: [], dailyMission: null, achievements: [], answeredQuestions: [], discoveredEntries: [], readEntries: [], completedLevels: [] })
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])
  const user = getCurrentUser()
  const factionId = FACTION_DETAILS[user?.faction] ? user.faction : 'imperium'
  const faction = FACTION_DETAILS[factionId]
  const levelIds = faction.levelIds
  const completedIds = (progress.completedLevels || []).filter((id) => levelIds.includes(id))
  const completed = completedIds.length
  const nextLevel = levelIds.find((id) => !completedIds.includes(id))
  const nextLevelNumber = nextLevel ? levelIds.indexOf(nextLevel) + 1 : levelIds.length
  const campaignComplete = !nextLevel
  const chaos = factionId === 'chaos'
  const orks = factionId === 'orks'
  const tau = factionId === 'tau'

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="signal-dot" /> ДОБРО ПОЖАЛОВАТЬ, {user?.username || 'АРХИВАРИУС'}</p>
          <h1>{tau ? <>Империя Тау.<br /><em>Твой приказ служит Высшему благу.</em></> : orks ? <>Зелёный прилив.<br /><em>Твой Waaagh! ищет большую драку.</em></> : chaos ? <>Ересь Хоруса.<br /><em>Твой приказ меняет ход мятежа.</em></> : <>История Империума.<br /><em>Твой приказ меняет поход.</em></>}</h1>
          <p className="hero-lead">{tau ? 'Веди экспедиции каст через Аркунашу и Дамокл к событиям Пятой сферы. Координируй разведку и огневую поддержку, открывая досье о Фарсайте и Высшем благе.' : orks ? 'Собери орду, сразись за Улланор и продолжи путь в 41-е тысячелетие. Открывай досье об орочьей империи Урлакка Урга, Триумфе Улланора и войнах с Империумом и Хаосом.' : chaos ? 'Веди силы Хаоса от первых заговоров через Исстван, Калт и осаду Терры к Очищению. Принимай решения и открывай досье о Варпе, падении Хоруса и изгнании предателей.' : 'Пройди восемь сюжетных операций: от рождения Империума и поиска Примархов до предупреждения Гарро, Исствана, Калта, обороны Терры и Очищения. Принимай решения, береги снабжение и открывай архивные главы.'}</p>
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
        <div className="mission-copy"><span className="eyebrow">КАМПАНИЯ · {faction.shortName.toUpperCase()}</span><h2>{campaignComplete ? 'Все открытые операции завершены' : `Операция ${String(nextLevelNumber).padStart(2, '0')} ждёт приказа`}</h2><p>{campaignComplete ? `Все досье фракции ${faction.shortName} ждут в архиве.` : 'Каждая победа открывает новую главу лора и следующую операцию.'}</p></div>
        <div className="mission-reward"><span>ПРОЙДЕНО</span><b>{completed}/{levelIds.length}</b></div>
        <Link className={`button ${campaignComplete ? 'button-done' : 'button-outline'}`} to={user ? '/campaign' : '/register'}>{campaignComplete ? 'Открыть кампанию' : user ? 'Продолжить' : 'Вступить в ряды'} <span>→</span></Link>
      </section>

      <section className={`quiz-promo ${chaos ? 'chaos-theme' : orks ? 'orks-theme' : ''}`}><div className="quiz-promo-mark">{faction.mark}</div><div><p className="eyebrow">СЮЖЕТНАЯ КАМПАНИЯ · {levelIds.length} ОПЕРАЦИЙ</p><h2>{orks ? 'Собирай Waaagh!' : chaos ? 'Веди восстание' : 'Командуй экспедицией'}</h2><p>Выбирай тактику, следи за ресурсами и открывай архивные главы истории Warhammer 40,000.</p></div><Link className="button button-outline" to={user ? '/campaign' : '/register'}>{user ? 'К карте операций' : 'Вступить в ряды'} <span>→</span></Link></section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">ФРАКЦИИ КАМПАНИИ</p><h2>{faction.name}</h2></div><Link className="text-link" to="/factions">Открыть досье <span>→</span></Link></div>
        <div className="faction-grid">{factions.map((faction, index) => <Link className={`faction-card ${faction.color}`} to={`/factions/${faction.id}`} key={faction.id}><div className="card-top"><span>ДОСЬЕ 0{index + 1}</span><span>↗</span></div><div className="faction-mark">{faction.mark}</div><span className="faction-type">{faction.type}</span><h3>{faction.name}</h3><p>{faction.text}</p><span className="card-bottom">ОТКРЫТЬ ДОСЬЕ <span>→</span></span></Link>)}</div>
      </section>
      <footer className="page-footer"><span>SECTOR: VERMILLION</span><span>ЗНАНИЕ — ПЕРВАЯ ЛИНИЯ ОБОРОНЫ</span><span>{progress.xp} XP В АРХИВЕ</span></footer>
    </main>
  )
}
