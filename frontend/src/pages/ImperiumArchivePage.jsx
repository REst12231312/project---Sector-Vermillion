import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProgress } from '../utils/gameProgress'
import { imperiumRecords } from '../data/imperiumCampaign'
import { chaosRecords } from '../data/chaosCampaign'
import { getCurrentUser } from '../utils/api'

export default function ImperiumArchivePage() {
  const { factionId: routeFaction, recordId } = useParams()
  const factionId = getCurrentUser()?.faction === 'chaos' ? 'chaos' : 'imperium'
  const requestedFaction = routeFaction || factionId
  const records = requestedFaction === 'chaos' ? chaosRecords : imperiumRecords
  const factionName = requestedFaction === 'chaos' ? 'Хаоса' : 'Империума'
  const archivePath = `/archive/${requestedFaction}`
  const [progress, setProgress] = React.useState(getProgress)
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  const record = records.find((entry) => entry.id === recordId)
  const unlockedIds = progress.completedLevels || []
  const recordIndex = records.findIndex((entry) => entry.id === recordId)
  const unlocked = recordIndex >= 0 && unlockedIds.includes(recordId)

  if (requestedFaction !== factionId) return <main className="content-page archive-library"><p className="eyebrow">ДОСТУП ОГРАНИЧЕН</p><h1>Архив другой стороны</h1><p className="hero-lead">Твой позывной связан с кампанией {factionId === 'chaos' ? 'Хаоса' : 'Империума'}.</p><Link className="button button-primary" to={`/archive/${factionId}`}>Открыть свой архив <span>→</span></Link></main>

  if (!recordId) return <main className={`content-page archive-library ${requestedFaction === 'chaos' ? 'chaos-theme' : ''}`}>
    <Link className="back-link" to="/campaign">← К кампании</Link>
    <p className="eyebrow">АРХИВ · {requestedFaction === 'chaos' ? 'СИЛЫ ХАОСА' : 'ИМПЕРИУМ ЧЕЛОВЕЧЕСТВА'}</p>
    <h1>Открытые досье</h1>
    <p className="hero-lead">Каждая запись становится доступна после успешной операции. Лор изложен кратко, своими словами, со ссылками на источники.</p>
    <div className="campaign-levels">{records.map((entry, index) => {
      const available = unlockedIds.includes(entry.id)
      return <article className={`campaign-level ${available ? 'level-complete' : 'level-locked'}`} key={entry.id}>
        <div className="campaign-level-index">{available ? '✓' : '🔒'}</div>
        <div className="campaign-level-copy"><span className="eyebrow">ГЛАВА {String(index + 1).padStart(2, '0')}</span><h2>{available ? entry.title : 'Зашифрованная запись'}</h2><p>{available ? entry.subtitle : 'Заверши операцию кампании, чтобы открыть эту главу.'}</p></div>
        <div className="campaign-level-cta">{available ? <Link className="button button-outline" to={`${archivePath}/${entry.id}`}>Читать досье <span>→</span></Link> : <span className="sealed-count">ЗАПЕРТО</span>}</div>
      </article>
    })}</div>
  </main>

  if (!record) return <main className="content-page"><p className="eyebrow">АРХИВ · ОШИБКА 404</p><h1>Досье не найдено</h1><Link className="text-link" to={archivePath}>К открытым досье →</Link></main>
  if (!unlocked) return <main className="content-page archive-record">
    <Link className="back-link" to={archivePath}>← К архиву {factionName}</Link>
    <p className="eyebrow">ЗАПИСЬ ЗАШИФРОВАНА · ГЛАВА {String(recordIndex + 1).padStart(2, '0')}</p>
    <h1>Материал пока закрыт</h1>
    <p className="hero-lead">Пройди операцию «{record.subtitle}», чтобы открыть эту архивную запись.</p>
    <Link className="button button-primary" to={`/campaign?level=${record.id}`}>К операции <span>→</span></Link>
  </main>

  return <main className={`content-page archive-record ${requestedFaction === 'chaos' ? 'chaos-theme' : ''}`}>
    <Link className="back-link" to={archivePath}>← Все досье</Link>
    <p className="eyebrow">{requestedFaction === 'chaos' ? 'АРХИВ ХАОСА' : 'ИМПЕРСКИЙ АРХИВ'} · ГЛАВА {String(recordIndex + 1).padStart(2, '0')}</p>
    <h1>{record.title}</h1>
    <p className="hero-lead">{record.subtitle}</p>
    <article className="imperium-record-body">{record.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>
    <section className="record-sources"><p className="eyebrow">ИСТОЧНИКИ ДЛЯ ИЗУЧЕНИЯ</p><ul>{record.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul></section>
    {records[recordIndex + 1] && <Link className="button button-primary" to={`/campaign?level=${records[recordIndex + 1].id}`}>Продолжить кампанию <span>→</span></Link>}
  </main>
}
