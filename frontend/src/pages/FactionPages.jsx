import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress, FACTION_DETAILS, CHAOS_LEVEL_IDS, IMPERIUM_LEVEL_IDS } from '../utils/gameProgress'
import { getCurrentUser, isAuthenticated } from '../utils/api'

const factions = [
  { id: 'imperium', type: 'Человечество · Imperium', color: 'gold', summary: 'Галактическая держава людей. Кампания рассказывает об объединении Терры, Великом крестовом походе и Примархах.', home: 'Терра и тысячи подконтрольных миров', source: 'https://wh40k.lexicanum.com/wiki/Imperium_of_Man', ops: 3 },
  { id: 'chaos', type: 'Варп · Traitoris', color: 'red', summary: 'Мятежные легионы и силы, связанные с богами Хаоса. Пройди путь от тайного заговора и падения Хоруса до осады Терры.', home: 'Варп, Око Ужаса и миры-демониумы', source: 'https://wh40k.lexicanum.com/wiki/Chaos', ops: 4 },
]

export default function FactionPages() {
  const [progress, setProgress] = React.useState(getProgress)
  const selected = getCurrentUser()?.faction === 'chaos' ? 'chaos' : 'imperium'
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  return <main className="content-page">
    <p className="eyebrow">АРХИВ · СТОРОНЫ КОНФЛИКТА</p>
    <div className="section-heading"><div><h1>Фракции</h1><p className="hero-lead">При регистрации выбирается кампания, которую будешь проходить. Сейчас твоя сторона — {FACTION_DETAILS[selected].name}.</p></div></div>
    <div className="faction-grid faction-choice-grid">{factions.map((faction) => {
      const active = faction.id === selected
      const factionLevels = faction.id === 'chaos' ? CHAOS_LEVEL_IDS : IMPERIUM_LEVEL_IDS
      const count = active ? (progress.completedLevels || []).filter((id) => factionLevels.includes(id)).length : 0
      return <article className={`faction-card ${faction.color} ${active ? 'faction-selected' : 'faction-unavailable'}`} key={faction.id}>
        <div className="card-top"><span>{faction.type}</span><span>{active ? 'ВЫБРАНО' : 'ДРУГАЯ СТОРОНА'}</span></div>
        <div className="faction-mark">{FACTION_DETAILS[faction.id].mark}</div><span className="faction-type">{faction.ops} ОПЕРАЦИИ · {active ? `${count}/${faction.ops} ПРОЙДЕНО` : 'НЕДОСТУПНО ЭТОМУ ПОЗЫВНОМУ'}</span>
        <h3>{FACTION_DETAILS[faction.id].name}</h3><p>{faction.summary}</p>
        <div className="imperium-faction-facts"><span>ЦЕНТР СИЛЫ</span><b>{faction.home}</b></div>
        <div className="imperium-faction-actions">{active ? <><Link className="button button-primary" to="/campaign">Начать кампанию <span>→</span></Link><Link className="text-link" to={FACTION_DETAILS[faction.id].archivePath}>Открыть архив ↗</Link></> : <span className="sealed-count">Выбор стороны задаётся при регистрации</span>}</div>
        <a className="source-link" href={faction.source} target="_blank" rel="noreferrer">Источник: Lexicanum ↗</a>
      </article>
    })}</div>
    {!isAuthenticated() && <p className="archive-status">Зарегистрируйся, чтобы выбрать фракцию и сохранить прогресс её кампании.</p>}
  </main>
}
