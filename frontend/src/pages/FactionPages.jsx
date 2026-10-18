import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress, FACTION_DETAILS } from '../utils/gameProgress'
import { getCurrentUser, isAuthenticated } from '../utils/api'

const factions = [
  { id: 'imperium', type: 'Человечество · Imperium', color: 'gold', summary: 'Галактическая держава людей. Кампания идёт от объединения Терры через Ересь Хоруса к Очищению и восстановлению.', home: 'Терра и тысячи подконтрольных миров', source: 'https://wh40k.lexicanum.com/wiki/Imperium_of_Man', ops: 8 },
  { id: 'chaos', type: 'Варп · Traitoris', color: 'red', summary: 'Мятежные легионы и силы, связанные с богами Хаоса. Пройди от заговора и падения Хоруса через Калт и осаду Терры к изгнанию в Око Ужаса.', home: 'Варп, Око Ужаса и миры-демониумы', source: 'https://wh40k.lexicanum.com/wiki/Chaos', ops: 7 },
  { id: 'orks', type: 'Ксеносы · Waaagh!', color: 'green', summary: 'Орды, живущие войной. Кампания рассказывает о державе Урлакка Урга на Улланоре, а затем переносится в 41-е тысячелетие и к войнам за Армагеддон.', home: 'Рассеяны по всей галактике', source: 'https://www.warhammer-community.com/en-gb/articles/lEuczqhi/starting-an-ork-army-in-warhammer-40000-everything-you-need-to-know-from-painting-to-lore/', ops: 5 },
  { id: 'tau', type: 'Ксеносы · Высшее благо', color: 'blue', summary: 'Молодая межзвёздная держава каст и союзников. Кампания охватывает экспансии, Крестовый поход Дамокла, Фарсайта и события Пятой сферы.', home: 'Восточная окраина галактики', source: 'https://www.warhammer-community.com/en-gb/articles/qx7ln8cU/starting-a-tau-empire-army-in-warhammer-40000-everything-you-need-to-know-from-painting-to-lore/', ops: 6 },
]

export default function FactionPages() {
  const [progress, setProgress] = React.useState(getProgress)
  const currentFaction = getCurrentUser()?.faction
  const selected = FACTION_DETAILS[currentFaction] ? currentFaction : 'imperium'
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
      const factionLevels = FACTION_DETAILS[faction.id].levelIds
      const count = active ? (progress.completedLevels || []).filter((id) => factionLevels.includes(id)).length : 0
      const interceptedCount = (progress.interceptedLore?.[faction.id] || []).length
      return <article className={`faction-card ${faction.color} ${active ? 'faction-selected' : 'faction-unavailable'}`} key={faction.id}>
        <div className="card-top"><span>{faction.type}</span><span>{active ? 'ВЫБРАНО' : 'ДРУГАЯ СТОРОНА'}</span></div>
        <div className="faction-mark">{FACTION_DETAILS[faction.id].mark}</div><span className="faction-type">{faction.ops} ОПЕРАЦИИ · {active ? `${count}/${faction.ops} ПРОЙДЕНО` : interceptedCount ? `${interceptedCount} ДОСЬЕ ПЕРЕХВАЧЕНО` : 'НЕДОСТУПНО ЭТОМУ ПОЗЫВНОМУ'}</span>
        <h3>{FACTION_DETAILS[faction.id].name}</h3><p>{faction.summary}</p>
        <div className="imperium-faction-facts"><span>ЦЕНТР СИЛЫ</span><b>{faction.home}</b></div>
        <div className="imperium-faction-actions">{active ? <><Link className="button button-primary" to="/campaign">Начать кампанию <span>→</span></Link><Link className="text-link" to={FACTION_DETAILS[faction.id].archivePath}>Открыть архив ↗</Link></> : interceptedCount ? <Link className="button button-outline" to={FACTION_DETAILS[faction.id].archivePath}>Открыть перехваченный архив <span>→</span></Link> : <span className="sealed-count">Выбор стороны задаётся при регистрации</span>}</div>
        <a className="source-link" href={faction.source} target="_blank" rel="noreferrer">Источник: {faction.id === 'orks' || faction.id === 'tau' ? 'Warhammer Community' : 'Lexicanum'} ↗</a>
      </article>
    })}</div>
    {!isAuthenticated() && <p className="archive-status">Зарегистрируйся, чтобы выбрать фракцию и сохранить прогресс её кампании.</p>}
  </main>
}
