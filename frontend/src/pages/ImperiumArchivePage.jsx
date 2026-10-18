import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProgress } from '../utils/gameProgress'
import { imperiumRecords } from '../data/imperiumCampaign'
import { chaosRecords } from '../data/chaosCampaign'
import { orksRecords } from '../data/orksCampaign'
import { tauRecords } from '../data/tauCampaign'
import { getCurrentUser } from '../utils/api'
import { FACTION_DETAILS } from '../utils/gameProgress'

export default function ImperiumArchivePage() {
  const { factionId: routeFaction, recordId } = useParams()
  const currentFaction = getCurrentUser()?.faction
  const factionId = FACTION_DETAILS[currentFaction] ? currentFaction : 'imperium'
  const requestedFaction = routeFaction || factionId
  const records = requestedFaction === 'chaos' ? chaosRecords : requestedFaction === 'orks' ? orksRecords : requestedFaction === 'tau' ? tauRecords : imperiumRecords
  const factionName = requestedFaction === 'chaos' ? 'Хаоса' : requestedFaction === 'orks' ? 'Орков' : requestedFaction === 'tau' ? 'Тау' : 'Империума'
  const factionLabel = requestedFaction === 'chaos' ? 'СИЛЫ ХАОСА' : requestedFaction === 'orks' ? 'ОРКИ' : requestedFaction === 'tau' ? 'ИМПЕРИЯ ТАУ' : 'ИМПЕРИУМ ЧЕЛОВЕЧЕСТВА'
  const theme = requestedFaction === 'chaos' ? 'chaos-theme' : requestedFaction === 'orks' ? 'orks-theme' : requestedFaction === 'tau' ? 'tau-theme' : ''
  const archivePath = `/archive/${requestedFaction}`
  const [progress, setProgress] = React.useState(getProgress)
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  const record = records.find((entry) => entry.id === recordId)
  const unlockedIds = progress.completedLevels || []
  const interceptedIds = progress.interceptedLore?.[requestedFaction] || []
  const recordIndex = records.findIndex((entry) => entry.id === recordId)
  const intercepted = interceptedIds.includes(recordId)
  const unlocked = recordIndex >= 0 && (unlockedIds.includes(recordId) || intercepted)

  if (requestedFaction !== factionId && interceptedIds.length === 0) return <main className="content-page archive-library"><p className="eyebrow">ДОСТУП ОГРАНИЧЕН</p><h1>Архив другой стороны</h1><p className="hero-lead">Пока в перехватах нет записей фракции {FACTION_DETAILS[requestedFaction]?.shortName || requestedFaction}.</p><Link className="button button-primary" to={`/archive/${factionId}`}>Открыть свой архив <span>→</span></Link></main>

  if (!recordId) return <main className={`content-page archive-library ${theme}`}>
    <Link className="back-link" to={requestedFaction === factionId ? '/campaign' : '/factions'}>{requestedFaction === factionId ? '← К кампании' : '← К фракциям'}</Link>
    <p className="eyebrow">АРХИВ · {factionLabel}</p>
    <h1>{requestedFaction === factionId ? 'Открытые досье' : 'Перехваченные досье'}</h1>
    <p className="hero-lead">{requestedFaction === factionId ? 'Записи кампании открываются после успешных операций. Лор изложен кратко, своими словами, со ссылками на источники.' : `Архив ${FACTION_DETAILS[requestedFaction].shortName} пополняется записями, прочитанными в перехваченных сигналах.`}</p>
    <div className="campaign-levels">{records.map((entry, index) => {
      const available = unlockedIds.includes(entry.id) || interceptedIds.includes(entry.id)
      const fromSignal = interceptedIds.includes(entry.id)
      return <article className={`campaign-level ${available ? 'level-complete' : 'level-locked'} ${fromSignal ? 'level-intercepted' : ''}`} key={entry.id}>
        <div className="campaign-level-index">{available ? fromSignal ? '⌁' : '✓' : '🔒'}</div>
        <div className="campaign-level-copy"><span className="eyebrow">{fromSignal ? 'ПЕРЕХВАЧЕННЫЙ СИГНАЛ' : `ГЛАВА ${String(index + 1).padStart(2, '0')}`}</span><h2>{available ? entry.title : 'Зашифрованная запись'}</h2><p>{available ? entry.subtitle : requestedFaction === factionId ? 'Заверши операцию кампании, чтобы открыть эту главу.' : 'Ожидает перехвата сигнала с этим досье.'}</p></div>
        <div className="campaign-level-cta">{available ? <Link className="button button-outline" to={`${archivePath}/${entry.id}`}>{fromSignal ? 'Читать перехват' : 'Читать досье'} <span>→</span></Link> : <span className="sealed-count">ЗАПЕРТО</span>}</div>
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

  return <main className={`archive-record-page ${theme}`} style={{ '--archive-art': `url("/images/campaign/${record.id}.svg")` }}>
    <div className="archive-record-content">
      <Link className="back-link" to={archivePath}>← Все досье</Link>
      <header className="archive-record-heading">
        <p className="eyebrow">{intercepted ? 'ПЕРЕХВАЧЕННЫЙ СИГНАЛ' : requestedFaction === 'chaos' ? 'АРХИВ ХАОСА' : requestedFaction === 'orks' ? 'ОРКСКИЙ ПОЛЕВОЙ АРХИВ' : requestedFaction === 'tau' ? 'ПОЛЕВОЙ АРХИВ ТАУ' : 'ИМПЕРСКИЙ АРХИВ'} · ГЛАВА {String(recordIndex + 1).padStart(2, '0')}</p>
        <h1>{record.title}</h1>
        <p className="hero-lead">{record.subtitle}</p>
      </header>
      <article className="imperium-record-body">{record.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>
      <section className="record-sources"><p className="eyebrow">ИСТОЧНИКИ ДЛЯ ИЗУЧЕНИЯ</p><ul>{record.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul></section>
      {records[recordIndex + 1] && <Link className="button button-primary" to={`/campaign?level=${records[recordIndex + 1].id}`}>Продолжить кампанию <span>→</span></Link>}
    </div>
  </main>
}
