import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress, getImperiumRank, IMPERIUM_RANKS, IMPERIUM_LEVEL_IDS } from '../utils/gameProgress'
import { getCurrentUser } from '../utils/api'

const campaignAwards = [
  { id: 'campaign-imperium-origin', icon: 'I', name: 'Объединитель Терры', description: 'Заверши первую операцию кампании.' },
  { id: 'campaign-great-crusade', icon: 'II', name: 'Навигатор похода', description: 'Подготовь экспедицию за пределы Терры.' },
  { id: 'campaign-primarchs', icon: 'III', name: 'Встреча с Примархом', description: 'Открой третью главу архива.' },
]

export default function PlayerPages() {
  const [progress, setProgress] = React.useState(getProgress)
  const user = getCurrentUser()
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  const rank = getImperiumRank(progress.xp)
  const completed = progress.completedLevels || []
  const nextCampaignLevel = IMPERIUM_LEVEL_IDS[completed.length]
  const rankProgress = rank.next ? Math.min(100, Math.max(0, ((progress.xp - rank.minXP) / (rank.next.minXP - rank.minXP)) * 100)) : 100

  return <main className="content-page profile-page">
    <p className="eyebrow">ЛИЧНЫЙ АРХИВ · ВОИНСКОЕ ЗВАНИЕ</p>
    <section className="profile-card"><div className="profile-avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</div><div><span className="eyebrow">{user?.username || 'КОМАНДИР'} · ИМПЕРИУМ ЧЕЛОВЕЧЕСТВА</span><h1>{rank.name}</h1><p>Твоё звание растёт вместе с опытом, полученным в операциях.</p></div><div className="profile-xp"><b>{progress.xp}</b><span>ОПЫТ</span></div></section>
    <div className="profile-stats"><article><span>ТЕКУЩЕЕ ЗВАНИЕ</span><b className="stat-rank">{rank.name}</b><small>{rank.next ? `До звания «${rank.next.name}»: ${rank.next.minXP - progress.xp} XP` : 'Высшее звание получено'}</small></article><article><span>ОПЕРАЦИИ</span><b>{completed.length}/{IMPERIUM_LEVEL_IDS.length}</b><small>Пройдено в кампании Империума</small></article><article><span>ДОСЬЕ</span><b>{completed.length}</b><small>Главы открыты в архиве</small></article><article><span>ФРАКЦИЯ</span><b>I</b><small>Империум человечества</small></article></div>
    <section className="rank-section"><div className="section-heading"><div><p className="eyebrow">ПОВЫШЕНИЕ · {progress.xp} XP</p><h2>Лестница званий</h2></div></div><div className="rank-progress-track"><span style={{ width: `${rankProgress}%` }} /></div><div className="rank-ladder">{IMPERIUM_RANKS.map((item) => { const achieved = progress.xp >= item.minXP; const current = item.id === rank.id; return <article className={`rank-step ${achieved ? 'rank-achieved' : ''} ${current ? 'rank-current' : ''}`} key={item.id}><span>{achieved ? '✓' : item.minXP}</span><b>{item.name}</b><small>{item.minXP} XP</small></article> })}</div></section>
    <section className="achievement-section"><div className="section-heading"><div><p className="eyebrow">НАГРАДЫ · {campaignAwards.filter((award) => progress.achievements.includes(award.id)).length}/{campaignAwards.length}</p><h2>Боевые отличия</h2></div></div><div className="achievement-grid">{campaignAwards.map((award) => { const earned = progress.achievements.includes(award.id); return <article className={`achievement-card ${earned ? 'earned' : ''}`} key={award.id}><span className="achievement-icon">{award.icon}</span><div><h3>{award.name}</h3><p>{award.description}</p></div><span className="achievement-state">{earned ? 'ПОЛУЧЕНО' : 'ЗАКРЫТО'}</span></article>})}</div></section>
    <section className="profile-mission"><div><p className="eyebrow">ТЕКУЩАЯ ОПЕРАЦИЯ</p><h2>{nextCampaignLevel ? 'Экспедиция ждёт приказа' : 'Кампания пройдена'}</h2><p>{nextCampaignLevel ? 'Продолжи кампанию, чтобы открыть следующую главу истории Империума.' : 'Все доступные досье открыты. Следующие главы появятся в продолжении кампании.'}</p></div><Link className="button button-primary" to="/campaign">{nextCampaignLevel ? 'Продолжить кампанию' : 'Пересмотреть операции'} <span>→</span></Link></section>
    <section className="profile-mission"><div><p className="eyebrow">АРХИВНЫЕ ЗАПИСИ</p><h2>История Империума</h2><p>Перечитай уже открытые главы или проверь, какие материалы ещё запечатаны.</p></div><Link className="button button-outline" to="/archive/imperium">Открыть архив <span>→</span></Link></section>
  </main>
}
