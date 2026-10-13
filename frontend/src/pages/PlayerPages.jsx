import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress, getFactionRank, IMPERIUM_RANKS, CHAOS_RANKS, IMPERIUM_LEVEL_IDS, CHAOS_LEVEL_IDS, FACTION_DETAILS } from '../utils/gameProgress'
import { getCurrentUser } from '../utils/api'

const campaignAwards = [
  { id: 'campaign-imperium-origin', icon: 'I', name: 'Объединитель Терры', description: 'Заверши первую операцию кампании.' },
  { id: 'campaign-great-crusade', icon: 'II', name: 'Навигатор похода', description: 'Подготовь экспедицию за пределы Терры.' },
  { id: 'campaign-primarchs', icon: 'III', name: 'Встреча с Примархом', description: 'Открой третью главу архива.' },
]
const chaosAwards = [
  { id: 'campaign-chaos-whispers', icon: 'I', name: 'Глас из варпа', description: 'Заверши операцию по вербовке тайного культа.' },
  { id: 'campaign-davin-fall', icon: 'II', name: 'Путь Воителя', description: 'Заверши операцию на Давине.' },
  { id: 'campaign-istvaan-betrayal', icon: 'III', name: 'Пепел Исствана', description: 'Заверши операцию предательства.' },
  { id: 'campaign-siege-terra', icon: 'IV', name: 'Осада Терры', description: 'Доведи кампанию Хаоса до финала.' },
]

export default function PlayerPages() {
  const [progress, setProgress] = React.useState(getProgress)
  const user = getCurrentUser()
  const factionId = user?.faction === 'chaos' ? 'chaos' : 'imperium'
  const faction = FACTION_DETAILS[factionId]
  const levelIds = factionId === 'chaos' ? CHAOS_LEVEL_IDS : IMPERIUM_LEVEL_IDS
  const awards = factionId === 'chaos' ? chaosAwards : campaignAwards
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  const ranks = factionId === 'chaos' ? CHAOS_RANKS : IMPERIUM_RANKS
  const rank = getFactionRank(progress.xp, factionId)
  const completed = progress.completedLevels || []
  const factionCompleted = completed.filter((id) => levelIds.includes(id))
  const nextCampaignLevel = levelIds[factionCompleted.length]
  const rankProgress = rank.next ? Math.min(100, Math.max(0, ((progress.xp - rank.minXP) / (rank.next.minXP - rank.minXP)) * 100)) : 100

  return <main className="content-page profile-page">
    <p className="eyebrow">ЛИЧНЫЙ АРХИВ · {factionId === 'chaos' ? 'РАНГ' : 'ВОИНСКОЕ ЗВАНИЕ'}</p>
    <section className={`profile-card ${factionId === 'chaos' ? 'chaos-theme' : ''}`}><div className="profile-avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</div><div><span className="eyebrow">{user?.username || 'КОМАНДИР'} · {faction.name.toUpperCase()}</span><h1>{rank.name}</h1><p>{factionId === 'chaos' ? 'Твой ранг растёт вместе с опытом, полученным в операциях.' : 'Твоё звание растёт вместе с опытом, полученным в операциях.'}</p></div><div className="profile-xp"><b>{progress.xp}</b><span>ОПЫТ</span></div></section>
    <div className="profile-stats"><article><span>{factionId === 'chaos' ? 'ТЕКУЩИЙ РАНГ' : 'ТЕКУЩЕЕ ЗВАНИЕ'}</span><b className="stat-rank">{rank.name}</b><small>{rank.next ? `До ${factionId === 'chaos' ? 'ранга' : 'звания'} «${rank.next.name}»: ${rank.next.minXP - progress.xp} XP` : factionId === 'chaos' ? 'Высший ранг получен' : 'Высшее звание получено'}</small></article><article><span>ОПЕРАЦИИ</span><b>{factionCompleted.length}/{levelIds.length}</b><small>Пройдено в кампании {faction.shortName}</small></article><article><span>ДОСЬЕ</span><b>{factionCompleted.length}</b><small>Главы открыты в архиве</small></article><article><span>ФРАКЦИЯ</span><b>{faction.mark}</b><small>{faction.name}</small></article></div>
    <section className="rank-section"><div className="section-heading"><div><p className="eyebrow">ПОВЫШЕНИЕ · {progress.xp} XP</p><h2>{factionId === 'chaos' ? 'Лестница рангов' : 'Лестница званий'}</h2></div></div><div className="rank-progress-track"><span style={{ width: `${rankProgress}%` }} /></div><div className="rank-ladder">{ranks.map((item) => { const achieved = progress.xp >= item.minXP; const current = item.id === rank.id; return <article className={`rank-step ${achieved ? 'rank-achieved' : ''} ${current ? 'rank-current' : ''}`} key={item.id}><span>{achieved ? '✓' : item.minXP}</span><b>{item.name}</b><small>{item.minXP} XP</small></article> })}</div></section>
    <section className="achievement-section"><div className="section-heading"><div><p className="eyebrow">НАГРАДЫ · {awards.filter((award) => progress.achievements.includes(award.id)).length}/{awards.length}</p><h2>Боевые отличия</h2></div></div><div className="achievement-grid">{awards.map((award) => { const earned = progress.achievements.includes(award.id); return <article className={`achievement-card ${earned ? 'earned' : ''}`} key={award.id}><span className="achievement-icon">{award.icon}</span><div><h3>{award.name}</h3><p>{award.description}</p></div><span className="achievement-state">{earned ? 'ПОЛУЧЕНО' : 'ЗАКРЫТО'}</span></article>})}</div></section>
    <section className="profile-mission"><div><p className="eyebrow">ТЕКУЩАЯ ОПЕРАЦИЯ</p><h2>{nextCampaignLevel ? 'Следующая операция ждёт приказа' : 'Кампания пройдена'}</h2><p>{nextCampaignLevel ? `Продолжи кампанию, чтобы открыть следующую главу истории ${faction.shortName}.` : `Все доступные досье фракции ${faction.shortName} открыты.`}</p></div><Link className="button button-primary" to="/campaign">{nextCampaignLevel ? 'Продолжить кампанию' : 'Пересмотреть операции'} <span>→</span></Link></section>
    <section className="profile-mission"><div><p className="eyebrow">АРХИВНЫЕ ЗАПИСИ</p><h2>{faction.name}</h2><p>Перечитай уже открытые главы или проверь, какие материалы ещё запечатаны.</p></div><Link className="button button-outline" to={faction.archivePath}>Открыть архив <span>→</span></Link></section>
  </main>
}
