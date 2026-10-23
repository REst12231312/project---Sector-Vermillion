import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProgress, FACTION_DETAILS } from '../utils/gameProgress'
import { getCurrentUser } from '../utils/api'
import { imperiumRecords } from '../data/imperiumCampaign'
import { chaosRecords } from '../data/chaosCampaign'
import { orksRecords } from '../data/orksCampaign'
import { tauRecords } from '../data/tauCampaign'
import './ArchiveTimeline.css'

const archiveArt = {
  imperium: {
    'imperium-origin': '01_Pepel_Terry.svg', 'great-crusade': '02_Za_predelami_Terry.svg',
    primarchs: '03_Poteryannye_synovya.svg', 'imperium-davin': '04_Myatezh_na_Davine.svg',
    'prospero-censure': '05_Padenie_Prospero.svg', 'mars-schism': '06_Raskol_Marsa.svg',
    'istvaan-iii-warning': '07_Signal_s_Isstvana_III.svg', 'istvaan-v': '08_Pepel_Isstvana_V.svg',
    'imperium-calth': '09_Bitva_za_Kalt.svg', 'beta-garmon': '10_Beta_Garmon_Titandet.svg',
    'siege-terra-loyalist': '11_Poslednyaya_oborona_Terry.svg', 'scouring-aftermath': '12_Imperium_posle_Eresi.svg',
  },
  chaos: {
    'chaos-whispers': '01_Shepot_za_granyu.svg', 'davin-fall': '02_Yad_na_Davine.svg',
    'signus-prime': '03_Ohota_na_Signuse.svg', 'istvaan-betrayal': '04_Pepel_Isstvana.svg',
    'chaos-calth': '05_Razrushit_Kalt.svg', 'shadow-crusade': '06_Tenevoy_krestovyy_pohod.svg',
    'molech-campaign': '07_Vrata_Moleha.svg', 'beta-garmon-chaos': '08_Prolom_u_Beta_Garmona.svg',
    'siege-terra': '09_Posledniy_put_k_Terre.svg', 'battle-luna': '10_Bitva_za_Lunu.svg',
    'eye-retreat': '11_Izgnanie_v_Oko_Uzhasa.svg',
  },
  orks: {
    'orks-gathering': '01_Sbor_Waaagh.svg', 'orks-ullanor-gates': '02_Vrata_Ullanora.svg',
    'orks-ullanor-battle': '03_Posledniy_boy_Urlakka_Urga.svg', 'orks-beast-arises': '04_Vosstanie_Zverya.svg',
    'orks-scattered-warband': '05_Orda_snova_sobiraetsya.svg', 'orks-armageddon': '06_Zelenyy_priliv.svg',
    'orks-octarius': '07_Boynya_Oktariusa.svg', 'orks-krongar': '08_Desyat_dney_na_Krongare.svg',
  },
  tau: {
    'tau-first-sphere': '01_Pervye_sfery.svg', 'tau-damocles': '02_Granitsa_Damokla.svg',
    'tau-arkunasha': '03_Arkunasha.svg', 'tau-farsight-enclaves': '04_Raskol_OShovaha.svg',
    'tau-agrellan': '05_Vtoraya_kampaniya_na_Aggrellane.svg',
    'tau-fourth-sphere': '06_Chetvertaya_sfera.svg', 'tau-fifth-sphere': '07_Pyataya_sfera.svg',
    'tau-chalnath': '08_Vozvrashchenie_na_Vedik.svg', 'tau-cao-quo': '09_Vosstanie_na_Tsao_Kuo.svg',
  },
}

const archiveRecords = { imperium: imperiumRecords, chaos: chaosRecords, orks: orksRecords, tau: tauRecords }

export default function ImperiumArchivePage() {
  const { factionId: routeFaction, recordId } = useParams()
  const currentFaction = getCurrentUser()?.faction
  const factionId = FACTION_DETAILS[currentFaction] ? currentFaction : 'imperium'
  const requestedFaction = routeFaction || factionId
  const records = archiveRecords[requestedFaction] || imperiumRecords
  const factionName = FACTION_DETAILS[requestedFaction]?.shortName || 'Империум'
  const factionLabel = requestedFaction === 'chaos' ? 'СИЛЫ ХАОСА' : requestedFaction === 'orks' ? 'ОРКИ' : requestedFaction === 'tau' ? 'ИМПЕРИЯ ТАУ' : 'ИМПЕРИУМ ЧЕЛОВЕЧЕСТВА'
  const [progress, setProgress] = React.useState(getProgress)

  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  React.useEffect(() => {
    if (!recordId) return
    document.getElementById(`archive-entry-${recordId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [recordId, requestedFaction])

  const unlockedIds = progress.completedLevels || []
  const interceptedIds = progress.interceptedLore?.[requestedFaction] || []
  const unlockedCount = records.filter((entry) => unlockedIds.includes(entry.id) || interceptedIds.includes(entry.id)).length
  const theme = requestedFaction === 'chaos' ? 'chaos-theme' : requestedFaction === 'orks' ? 'orks-theme' : requestedFaction === 'tau' ? 'tau-theme' : 'imperium-theme'

  if (requestedFaction !== factionId && interceptedIds.length === 0) return <main className={`content-page archive-timeline ${theme}`}>
    <p className="eyebrow">ДОСТУП ОГРАНИЧЕН</p>
    <h1>Архив другой стороны</h1>
    <p className="hero-lead">Пока в перехватах нет записей фракции {factionName}.</p>
    <Link className="button button-primary" to={`/archive/${factionId}`}>Открыть свой архив <span>→</span></Link>
  </main>

  return <main className={`content-page archive-timeline ${theme}`}>
    <Link className="back-link" to={requestedFaction === factionId ? '/campaign' : '/factions'}>{requestedFaction === factionId ? '← К кампании' : '← К фракциям'}</Link>
    <header className="archive-timeline-heading">
      <div className="archive-timeline-heading-copy">
        <p className="eyebrow">АРХИВ · {factionLabel}</p>
        <h1>{requestedFaction === factionId ? 'Открытые досье' : 'Перехваченные досье'}</h1>
        <p className="hero-lead">{requestedFaction === factionId ? 'Исторические записи раскрываются после прохождения операций и остаются доступными для повторного чтения.' : 'Перехваченные исторические записи можно раскрывать и читать повторно.'}</p>
      </div>
      <div className="archive-timeline-progress" aria-live="polite"><span>ИЗУЧЕНО</span><b>{unlockedCount}<small> / {records.length}</small></b></div>
    </header>

    <section className="archive-timeline-list" aria-label={`Хронология архива: ${factionName}`}>
      {records.map((entry, index) => {
        const fromSignal = interceptedIds.includes(entry.id)
        const unlocked = unlockedIds.includes(entry.id) || fromSignal
        const artDirectory = requestedFaction === 'tau' ? "ta'u" : requestedFaction
        const artFile = archiveArt[requestedFaction]?.[entry.id]
        const artPath = artFile ? `/images/campaign/${artDirectory}_svg/${artFile}` : null
        const chapterNumber = String(index + 1).padStart(2, '0')

        return <article id={`archive-entry-${entry.id}`} className={`archive-timeline-entry ${index % 2 ? 'entry-right' : 'entry-left'} ${unlocked ? 'entry-unlocked' : 'entry-locked'}`} key={entry.id}>
          <span className="archive-timeline-marker" aria-hidden="true">
            <span className="archive-timeline-marker-number">{chapterNumber}</span>
            {entry.date && <time className="archive-timeline-marker-date">{entry.date}</time>}
          </span>
          <div className="archive-entry-card" style={artPath ? { '--archive-entry-art': `url("${artPath}")` } : undefined}>
            <div className="archive-entry-heading">
              <span className="archive-entry-meta"><span>ЗАПИСЬ · {chapterNumber}{entry.date && <time className="archive-entry-date-inline"> · {entry.date}</time>}</span><span>{unlocked ? 'РАССЕКРЕЧЕНО' : 'ДОСТУП ЗАКРЫТ'}</span></span>
              <span className="archive-entry-summary">
                <span className="archive-entry-copy">
                  <span className="archive-entry-title">{unlocked ? entry.title : 'Зашифрованная запись'}</span>
                  <span className="archive-entry-description">{unlocked ? entry.subtitle : 'Заверши операцию, чтобы открыть эту главу.'}</span>
                </span>
              </span>
            </div>

            <div className="archive-entry-details">
              <div className="archive-entry-details-inner">
                {unlocked && <>
                  <div className="archive-entry-lore">{entry.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
                  {entry.facts?.length > 0 && <ul className="archive-entry-facts">{entry.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>}
                  <div className="archive-entry-sources"><span className="eyebrow">ИСТОЧНИКИ</span><ul>{entry.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul></div>
                </>}
              </div>
            </div>
          </div>
        </article>
      })}
    </section>
  </main>
}
