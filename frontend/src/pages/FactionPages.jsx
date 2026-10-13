import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress } from '../utils/gameProgress'
import { isAuthenticated } from '../utils/api'

const imperium = {
  name: 'Империум человечества',
  type: 'Человечество · Imperium',
  mark: 'I',
  color: 'gold',
  summary: 'Галактическая держава людей, объединённая под властью Императора. Её история начинается на опустошённой Терре и ведёт к Великому крестовому походу.',
  home: 'Терра и тысячи подконтрольных миров',
  source: 'https://wh40k.lexicanum.com/wiki/Imperium_of_Man',
}

export default function FactionPages() {
  const [progress, setProgress] = React.useState(getProgress)
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  return <main className="content-page">
    <p className="eyebrow">ДОСЬЕ · ИМПЕРИУМ ЧЕЛОВЕЧЕСТВА</p>
    <div className="section-heading"><div><h1>Фракции</h1><p className="hero-lead">Кампания начинается с истории человечества и рождения Империума.</p></div></div>
    <div className="faction-grid imperium-only-grid">
      <article className={`faction-card ${imperium.color}`}>
        <div className="card-top"><span>{imperium.type}</span><span>{progress.completedLevels?.length ? `${progress.completedLevels.length}/3` : '↗'}</span></div>
        <div className="faction-mark">{imperium.mark}</div>
        <h3>{imperium.name}</h3>
        <p>{imperium.summary}</p>
        <div className="imperium-faction-facts"><span>ЦЕНТР</span><b>{imperium.home}</b></div>
        <div className="imperium-faction-actions"><Link className="button button-primary" to="/campaign">Начать кампанию <span>→</span></Link><Link className="text-link" to="/archive/imperium">Архив Империума ↗</Link></div>
      </article>
    </div>
    {!isAuthenticated() && <p className="archive-status">Кампания доступна после входа: прогресс операций сохраняется в личном архиве.</p>}
    <a className="source-link" href={imperium.source} target="_blank" rel="noreferrer">Источник: Lexicanum · Imperium of Man ↗</a>
  </main>
}
