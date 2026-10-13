import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProgress } from '../utils/gameProgress'
import { imperiumRecords } from '../data/imperiumCampaign'

export default function ImperiumArchivePage() {
  const { recordId } = useParams()
  const [progress, setProgress] = React.useState(getProgress)
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  const record = imperiumRecords.find((entry) => entry.id === recordId)
  const unlockedIds = progress.completedLevels || []
  const recordIndex = imperiumRecords.findIndex((entry) => entry.id === recordId)
  const unlocked = recordIndex >= 0 && unlockedIds.includes(recordId)

  if (!recordId) return <main className="content-page archive-library">
    <Link className="back-link" to="/campaign">← К кампании</Link>
    <p className="eyebrow">АРХИВ · ИМПЕРИУМ ЧЕЛОВЕЧЕСТВА</p>
    <h1>Открытые досье</h1>
    <p className="hero-lead">Каждая запись становится доступна после успешной операции. Лор изложен кратко, своими словами, со ссылками на источники.</p>
    <div className="campaign-levels">{imperiumRecords.map((entry, index) => {
      const available = unlockedIds.includes(entry.id)
      return <article className={`campaign-level ${available ? 'level-complete' : 'level-locked'}`} key={entry.id}>
        <div className="campaign-level-index">{available ? '✓' : '🔒'}</div>
        <div className="campaign-level-copy"><span className="eyebrow">ГЛАВА {String(index + 1).padStart(2, '0')}</span><h2>{available ? entry.title : 'Зашифрованная запись'}</h2><p>{available ? entry.subtitle : 'Заверши операцию кампании, чтобы открыть эту главу.'}</p></div>
        <div className="campaign-level-cta">{available ? <Link className="button button-outline" to={`/archive/imperium/${entry.id}`}>Читать досье <span>→</span></Link> : <span className="sealed-count">ЗАПЕРТО</span>}</div>
      </article>
    })}</div>
  </main>

  if (!record) return <main className="content-page"><p className="eyebrow">АРХИВ · ОШИБКА 404</p><h1>Досье не найдено</h1><Link className="text-link" to="/archive/imperium">К открытым досье →</Link></main>
  if (!unlocked) return <main className="content-page archive-record">
    <Link className="back-link" to="/archive/imperium">← К архиву Империума</Link>
    <p className="eyebrow">ЗАПИСЬ ЗАШИФРОВАНА · ГЛАВА {String(recordIndex + 1).padStart(2, '0')}</p>
    <h1>Материал пока закрыт</h1>
    <p className="hero-lead">Пройди операцию «{record.subtitle}», чтобы открыть эту архивную запись.</p>
    <Link className="button button-primary" to={`/campaign?level=${record.id}`}>К операции <span>→</span></Link>
  </main>

  return <main className="content-page archive-record">
    <Link className="back-link" to="/archive/imperium">← Все досье</Link>
    <p className="eyebrow">ИМПЕРСКИЙ АРХИВ · ГЛАВА {String(recordIndex + 1).padStart(2, '0')}</p>
    <h1>{record.title}</h1>
    <p className="hero-lead">{record.subtitle}</p>
    <article className="imperium-record-body">{record.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>
    <section className="record-sources"><p className="eyebrow">ИСТОЧНИКИ ДЛЯ ИЗУЧЕНИЯ</p><ul>{record.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul></section>
    {imperiumRecords[recordIndex + 1] && <Link className="button button-primary" to={`/campaign?level=${imperiumRecords[recordIndex + 1].id}`}>Продолжить кампанию <span>→</span></Link>}
    {record.id === 'primarchs' && <p className="campaign-next-hint">Следующая глава будет посвящена Ереси Хоруса. Её добавим в продолжение кампании.</p>}
  </main>
}
