import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress, FACTION_DETAILS } from '../utils/gameProgress'
import { getCurrentUser, isAuthenticated } from '../utils/api'

const factions = [
  { id: 'imperium', name: 'Империум человечества', color: 'gold', poster: '/images/main_svg/postersFaction/Золотой трон среди готических теней.png', quote: '«Они — защитники человечества. Они — мои космодесантники, и они не познают страха».', source: 'The Horus Heresy Book One: Betrayal · стр. 26', context: 'Из речи о создании Адептус Астартес.' },
  { id: 'chaos', name: 'Силы Хаоса', color: 'red', poster: '/images/main_svg/postersFaction/Хаосный Владыка над Багровым Полем.png', quote: '«Пусть галактика горит!»', source: 'Galaxy in Flames · глава 12', context: 'Слова Хоруса после предательства Императора.' },
  { id: 'orks', name: 'Орки', color: 'green', poster: '/images/main_svg/postersFaction/Триумф Вождя Орков над руинами.png', quote: '«Мы — орки! Мы созданы, чтобы сражаться и побеждать!»', source: 'Codex: Orks · 4-я редакция · стр. 106', context: 'Из заявления Газгкулла.' },
  { id: 'tau', name: 'Империя Тау', color: 'blue', poster: '/images/main_svg/postersFaction/Церемония над городом тау.png', quote: '«Под вашей властью не может быть истинного единства!»', source: 'Обращение к совету Эфирных', context: 'Сокращённая цитата, отражающая разрыв О’Шова с властью Эфирных.' },
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

  return (
    <main className="home-page" style={{ '--home-art': `url("${process.env.PUBLIC_URL}/images/main_svg/mainSite/home.svg")` }}>
      <section className="hero home-welcome">
        <div className="hero-copy">
          <p className="eyebrow"><span className="signal-dot" /> ДОБРО ПОЖАЛОВАТЬ, {user?.username || 'АРХИВАРИУС'}</p>
          <h1>Галактика на грани.<br /><em>Тысяча миров. Десять тысяч лет войны. Узнай, как рушилась и горела Галактика</em></h1>
          <p className="hero-lead">Исследуй историю Империума, Хаоса и других фракций, узнай о великих кампаниях и героях 41-го тысячелетия. Каждый архивный сигнал открывает новую часть вселенной Warhammer.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/campaign">Операции <span>↗</span></Link>
            <Link className="button button-outline" to={faction.archivePath}>Досье <span>→</span></Link>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">ФРАКЦИИ КАМПАНИИ</p></div><Link className="text-link" to="/factions">Открыть досье <span>→</span></Link></div>
        <div className="faction-grid home-faction-grid">{factions.map((item, index) => {
          const operationCount = FACTION_DETAILS[item.id].levelIds.length
          return <article className={`faction-card home-faction-card ${item.color}`} key={item.id}>
            <img className="home-faction-poster" src={`${process.env.PUBLIC_URL}${item.poster}`} alt={`Постер фракции «${item.name}»`} />
            <div className="home-faction-copy">
              <div className="card-top"><span>ДОСЬЕ 0{index + 1}</span><span>{String(operationCount).padStart(2, '0')} ОПЕРАЦИЙ</span></div>
              <h3>{item.name}</h3>
              <p className="home-faction-quote">{item.quote}</p>
              <details className="home-faction-source">
                <summary><span>ИСТОЧНИК</span><cite>{item.source}</cite></summary>
                <p>{item.context}</p>
              </details>
              <Link className="home-faction-link" to={`/factions/${item.id}`}>ОТКРЫТЬ ДОСЬЕ <span>→</span></Link>
            </div>
          </article>
        })}</div>
      </section>
      <footer className="page-footer"><span>SECTOR: VERMILLION</span><span>ЗНАНИЕ — ПЕРВАЯ ЛИНИЯ ОБОРОНЫ</span><span>{progress.xp} XP В АРХИВЕ</span></footer>
    </main>
  )
}
