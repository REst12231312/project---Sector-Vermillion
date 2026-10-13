import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress, getTodayKey } from '../utils/gameProgress'
import { getCurrentUser } from '../utils/api'

const factions = [
  { id: 'imperium', name: 'Империум', type: 'Человечество', mark: 'I', color: 'gold', text: 'Миллионы миров держатся под знаменем Человечества.' },
  { id: 'orks', name: 'Орки', type: 'Ксеносы', mark: 'W', color: 'green', text: 'Война для них — цель, праздник и образ жизни.' },
  { id: 'chaos', name: 'Хаос', type: 'Ересь', mark: '☼', color: 'red', text: 'За гранью реальности шевелятся силы Варпа.' },
  { id: 'tau', name: "Империя Т'ау", type: 'Ксеносы', mark: 'T', color: 'blue', text: 'Молодая цивилизация несёт галактике Высшее Благо.' },
]

export default function HomePages() {
  const [progress, setProgress] = React.useState(getProgress)
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])
  const missionComplete = progress.dailyMission === getTodayKey()
  const researched = progress.studiedFactions.length
  const user = getCurrentUser()

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="signal-dot" /> ДОБРО ПОЖАЛОВАТЬ, {user?.username || 'АРХИВАРИУС'}</p>
          <h1>Сектор ждёт.<br /><em>Начни исследование.</em></h1>
          <p className="hero-lead">Изучи лор фракций, находи ключевые слова в досье и раскрывай заметки о забытых битвах и новых зонах Sector: Vermillion.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/factions">Начать изучение лора <span>↗</span></Link>
            <Link className="text-link" to="/archive/sector-ix">Найденные слова <span>→</span></Link>
          </div>
        </div>
        <div className="hero-art" aria-label="Схематичное изображение планеты сектора">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="planet"><span>V</span></div>
          <div className="art-label"><span>ЗОНА 07 / VER-IX</span><b>СИГНАЛ ОБНАРУЖЕН</b></div>
          <span className="coordinate coord-top">41.009.M3</span><span className="coordinate coord-bottom">ГЛУБИНА СЕКТОРА // 08</span>
        </div>
      </section>

      <section className="mission-strip">
        <div className="mission-icon">✦</div>
        <div className="mission-copy"><span className="eyebrow">ПЕРВЫЙ ШАГ · ИССЛЕДОВАНИЕ ЛОРА</span><h2>{missionComplete ? 'Сегодняшнее досье изучено' : researched === 0 ? 'Выбери фракцию и начни с её досье' : 'Продолжи искать ключевые слова'}</h2><p>{missionComplete ? `Сегодня исследовано фракций: ${researched} из 4.` : 'Найденные термины открывают полевые заметки, записи о битвах и новые зоны.'}</p></div>
        <div className="mission-reward"><span>НАГРАДА</span><b>{missionComplete ? 'ВЫПОЛНЕНО' : '+50 XP'}</b></div>
        <Link className={`button ${missionComplete ? 'button-done' : 'button-outline'}`} to="/factions">{missionComplete ? 'Продолжить архив' : 'К досье'} <span>→</span></Link>
      </section>

      <section className="quiz-promo"><div className="quiz-promo-mark">IV</div><div><p className="eyebrow">ПОЛЕВОЕ ИСПЫТАНИЕ · 4 ВОПРОСА</p><h2>Проверь знания о фракциях</h2><p>Пополняй архив ответами и получи бонус за завершение.</p></div><Link className="button button-outline" to="/quiz">Начать испытание <span>→</span></Link></section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Досье сектора</p><h2>Силы, меняющие галактику</h2></div><Link className="text-link" to="/factions">Все фракции <span>→</span></Link></div>
        <div className="faction-grid">{factions.map((faction, index) => <Link className={`faction-card ${faction.color}`} to={`/factions/${faction.id}`} key={faction.id}><div className="card-top"><span>ДОСЬЕ 0{index + 1}</span><span>↗</span></div><div className="faction-mark">{faction.mark}</div><span className="faction-type">{faction.type}</span><h3>{faction.name}</h3><p>{faction.text}</p><span className="card-bottom">ОТКРЫТЬ ДОСЬЕ <span>→</span></span></Link>)}</div>
      </section>
      <footer className="page-footer"><span>SECTOR: VERMILLION</span><span>ЗНАНИЕ — ПЕРВАЯ ЛИНИЯ ОБОРОНЫ</span><span>{progress.xp} XP В АРХИВЕ</span></footer>
    </main>
  )
}
