import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress, getFactionRank, IMPERIUM_RANKS, CHAOS_RANKS, ORKS_RANKS, TAU_RANKS, FACTION_DETAILS } from '../utils/gameProgress'
import { getCurrentUser } from '../utils/api'

const campaignAwards = [
  { id: 'campaign-imperium-origin', icon: 'I', name: 'Объединитель Терры', description: 'Заверши первую операцию кампании.' },
  { id: 'campaign-great-crusade', icon: 'II', name: 'Навигатор похода', description: 'Подготовь экспедицию за пределы Терры.' },
  { id: 'campaign-primarchs', icon: 'III', name: 'Встреча с Примархом', description: 'Открой третью главу архива.' },
  { id: 'campaign-istvaan-iii-warning', icon: 'IV', name: 'Вестник Исствана', description: 'Доставь Терре весть о мятеже Хоруса.' },
  { id: 'campaign-istvaan-v', icon: 'V', name: 'Выживший Исствана', description: 'Помоги лоялистам пережить предательство на Исстване V.' },
  { id: 'campaign-imperium-calth', icon: 'VI', name: 'Оборона Ультрамара', description: 'Удержи отряды после удара на Калте.' },
  { id: 'campaign-siege-terra-loyalist', icon: 'VII', name: 'Щит Терры', description: 'Помоги защитникам Императорского дворца.' },
  { id: 'campaign-scouring-aftermath', icon: 'VIII', name: 'Начало Очищения', description: 'Начни преследование сил Хоруса.' },
]
const chaosAwards = [
  { id: 'campaign-chaos-whispers', icon: 'I', name: 'Глас из варпа', description: 'Заверши операцию по вербовке тайного культа.' },
  { id: 'campaign-davin-fall', icon: 'II', name: 'Путь Воителя', description: 'Заверши операцию на Давине.' },
  { id: 'campaign-istvaan-betrayal', icon: 'III', name: 'Пепел Исствана', description: 'Заверши операцию предательства.' },
  { id: 'campaign-chaos-calth', icon: 'IV', name: 'Пепел Калта', description: 'Заверши атаку Несущих Слово на Ультрамар.' },
  { id: 'campaign-siege-terra', icon: 'V', name: 'Осада Терры', description: 'Доведи кампанию Хаоса до осады дворца.' },
  { id: 'campaign-battle-luna', icon: 'VI', name: 'Побег из Сола', description: 'Выведи часть сил из Солнечной системы.' },
  { id: 'campaign-eye-retreat', icon: 'VII', name: 'Путь в Око', description: 'Приведи уцелевших к убежищу в Варпе.' },
]
const orkAwards = [
  { id: 'campaign-orks-gathering', icon: 'I', name: 'Зов Waaagh!', description: 'Собери первую орду.' },
  { id: 'campaign-orks-ullanor-gates', icon: 'II', name: 'Врата Улланора', description: 'Проведи орду к крепости Урлакка Урга.' },
  { id: 'campaign-orks-ullanor-battle', icon: 'III', name: 'Последний бой Урлакка Урга', description: 'Пройди каноническую битву на Улланоре.' },
  { id: 'campaign-orks-scattered-warband', icon: 'IV', name: 'Орда снова собирается', description: 'Объедини банду в 41-м тысячелетии.' },
  { id: 'campaign-orks-armageddon', icon: 'V', name: 'Зелёный прилив', description: 'Заверши кампанию Армагеддона.' },
]
const tauAwards = [
  { id: 'campaign-tau-first-sphere', icon: 'I', name: 'Общее предназначение', description: 'Подготовь первые экспедиции Империи Тау.' },
  { id: 'campaign-tau-damocles', icon: 'II', name: 'Рубеж Дамокла', description: 'Переживи Крестовый поход Дамокла.' },
  { id: 'campaign-tau-arkunasha', icon: 'III', name: 'Щит Аркунаши', description: 'Удержи орочий натиск вместе с Фарсайтом.' },
  { id: 'campaign-tau-farsight-enclaves', icon: 'IV', name: 'Красный исход', description: 'Сопроводи Фарсайта в изгнание.' },
  { id: 'campaign-tau-fourth-sphere', icon: 'V', name: 'Возвращение Четвёртой', description: 'Собери экспедицию после варп-катастрофы.' },
  { id: 'campaign-tau-fifth-sphere', icon: 'VI', name: 'Новая сфера', description: 'Поддержи экспансию Шэдоусан.' },
]
const commonAwards = {
  imperium: [
    { id: 'first-enemy-signal', icon: '⌁', name: 'Первый перехваченный сигнал врага', description: 'Перехвати первую запись вражеской фракции.' },
    { id: 'all-lore-chaos', icon: '⛧', name: 'Данные Хаоса', description: 'Перехвати и прочитай все архивные досье сил Хаоса.', sourceFaction: 'chaos' },
    { id: 'all-lore-orks', icon: 'W', name: 'Данные Орков', description: 'Перехвати и прочитай все архивные досье орков.', sourceFaction: 'orks' },
    { id: 'all-lore-tau', icon: 'T', name: 'Архив Высшего блага', description: 'Перехвати все архивные досье Империи Тау.', sourceFaction: 'tau' },
  ],
  chaos: [
    { id: 'first-enemy-signal', icon: '⌁', name: 'Первый перехваченный сигнал врага', description: 'Перехвати первую запись вражеской фракции.' },
    { id: 'all-lore-imperium', icon: 'I', name: 'Данные Империума', description: 'Перехвати и прочитай все архивные досье Империума.', sourceFaction: 'imperium' },
    { id: 'all-lore-orks', icon: 'W', name: 'Данные Орков', description: 'Перехвати и прочитай все архивные досье орков.', sourceFaction: 'orks' },
    { id: 'all-lore-tau', icon: 'T', name: 'Архив Высшего блага', description: 'Перехвати все архивные досье Империи Тау.', sourceFaction: 'tau' },
  ],
  orks: [
    { id: 'first-enemy-signal', icon: '⌁', name: 'Первый перехваченный сигнал врага', description: 'Перехвати первую запись вражеской фракции.' },
    { id: 'all-lore-imperium', icon: 'I', name: 'Данные Империума', description: 'Перехвати и прочитай все архивные досье Империума.', sourceFaction: 'imperium' },
    { id: 'all-lore-chaos', icon: '⛧', name: 'Данные Хаоса', description: 'Перехвати и прочитай все архивные досье сил Хаоса.', sourceFaction: 'chaos' },
    { id: 'all-lore-tau', icon: 'T', name: 'Архив Высшего блага', description: 'Перехвати все архивные досье Империи Тау.', sourceFaction: 'tau' },
  ],
  tau: [
    { id: 'first-enemy-signal', icon: '⌁', name: 'Первый перехваченный сигнал врага', description: 'Перехвати первую запись вражеской фракции.' },
    { id: 'all-lore-imperium', icon: 'I', name: 'Данные Империума', description: 'Перехвати все досье Империума.', sourceFaction: 'imperium' },
    { id: 'all-lore-chaos', icon: '⛧', name: 'Данные Хаоса', description: 'Перехвати все досье сил Хаоса.', sourceFaction: 'chaos' },
    { id: 'all-lore-orks', icon: 'W', name: 'Данные Орков', description: 'Перехвати все досье орков.', sourceFaction: 'orks' },
  ],
}
const historyAwards = { imperium: campaignAwards, chaos: chaosAwards, orks: orkAwards, tau: tauAwards }
const historyTitles = { imperium: 'История Империума', chaos: 'История Хаоса', orks: 'История Орков', tau: 'История Империи Тау' }
const historyMarks = { imperium: 'I', chaos: '⛧', orks: 'W', tau: 'T' }
const archiveAwards = [
  { id: 'first-daily', icon: '✦', name: 'Первый приказ дня', description: 'Изучи досье и выполни первую архивную задачу дня.' },
  { id: 'first-dossier', icon: '▤', name: 'Первое досье', description: 'Изучи своё первое фракционное досье.' },
  { id: 'all-factions', icon: '✧', name: 'Знание всех сторон', description: 'Изучи досье всех фракций.' },
]

function AchievementGroup({ title, mark, awards, progress }) {
  const [expanded, setExpanded] = React.useState(false)
  const earnedCount = awards.filter((award) => progress.achievements.includes(award.id)).length
  return <section className={`achievement-group ${expanded ? 'is-expanded' : ''}`}>
    <button className="achievement-group-trigger" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}><span className="achievement-group-mark">{mark}</span><span className="achievement-group-title">{title}</span><span className="achievement-group-count">{earnedCount} / {awards.length} ПОЛУЧЕНО</span><span className="achievement-group-toggle" aria-hidden="true">+</span></button>
    <div className="achievement-reveal" aria-hidden={!expanded}><div className="achievement-grid">{awards.map((award, index) => {
      const earned = progress.achievements.includes(award.id)
      const collected = award.sourceFaction ? (progress.interceptedLore?.[award.sourceFaction] || []).length : 0
      const total = award.sourceFaction ? FACTION_DETAILS[award.sourceFaction].levelIds.length : 0
      return <article className={`achievement-card ${earned ? 'earned' : ''}`} key={award.id} style={{ '--card-order': index }}>
        <span className="achievement-icon">{award.icon}</span><div><h3>{award.name}</h3><p>{award.sourceFaction && !earned ? `${collected}/${total} досье перехвачено · ` : ''}{award.description}</p></div><span className="achievement-state">{earned ? 'ПОЛУЧЕНО' : 'ЗАКРЫТО'}</span>
      </article>
    })}</div></div>
  </section>
}

export default function PlayerPages() {
  const [progress, setProgress] = React.useState(getProgress)
  const user = getCurrentUser()
  const factionId = FACTION_DETAILS[user?.faction] ? user.faction : 'imperium'
  const faction = FACTION_DETAILS[factionId]
  const levelIds = faction.levelIds
  const allAwards = [...Object.values(historyAwards).flat(), ...archiveAwards, ...commonAwards[factionId]]
  const allAwardsCount = allAwards.length
  const earnedAwardsCount = allAwards.filter((award) => progress.achievements.includes(award.id)).length
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  const ranks = factionId === 'chaos' ? CHAOS_RANKS : factionId === 'orks' ? ORKS_RANKS : factionId === 'tau' ? TAU_RANKS : IMPERIUM_RANKS
  const rank = getFactionRank(progress.xp, factionId)
  const completed = progress.completedLevels || []
  const factionCompleted = completed.filter((id) => levelIds.includes(id))
  const nextCampaignLevel = levelIds.find((id) => !factionCompleted.includes(id))
  const rankProgress = rank.next ? Math.min(100, Math.max(0, ((progress.xp - rank.minXP) / (rank.next.minXP - rank.minXP)) * 100)) : 100

  return <main className="content-page profile-page">
    <p className="eyebrow">ЛИЧНЫЙ АРХИВ · {factionId === 'imperium' ? 'ВОИНСКОЕ ЗВАНИЕ' : 'РАНГ'}</p>
    <section className={`profile-card ${factionId === 'chaos' ? 'chaos-theme' : factionId === 'orks' ? 'orks-theme' : factionId === 'tau' ? 'tau-theme' : ''}`}><div className="profile-avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</div><div><span className="eyebrow">{user?.username || 'КОМАНДИР'} · {faction.name.toUpperCase()}</span><h1>{rank.name}</h1><p>{factionId === 'imperium' ? 'Твоё звание растёт вместе с опытом, полученным в операциях.' : 'Твой ранг растёт вместе с опытом, полученным в операциях.'}</p></div><div className="profile-xp"><b>{progress.xp}</b><span>ОПЫТ</span></div></section>
    <div className="profile-stats"><article><span>{factionId === 'imperium' ? 'ТЕКУЩЕЕ ЗВАНИЕ' : 'ТЕКУЩИЙ РАНГ'}</span><b className="stat-rank">{rank.name}</b><small>{rank.next ? `До ${factionId === 'imperium' ? 'звания' : 'ранга'} «${rank.next.name}»: ${rank.next.minXP - progress.xp} XP` : factionId === 'imperium' ? 'Высшее звание получено' : 'Высший ранг получен'}</small></article><article><span>ОПЕРАЦИИ</span><b>{factionCompleted.length}/{levelIds.length}</b><small>Пройдено в кампании {faction.shortName}</small></article><article><span>ДОСЬЕ</span><b>{factionCompleted.length}</b><small>Главы открыты в архиве</small></article><article><span>ФРАКЦИЯ</span><b>{faction.mark}</b><small>{faction.name}</small></article></div>
    <section className="rank-section"><div className="section-heading"><div><p className="eyebrow">ПОВЫШЕНИЕ · {progress.xp} XP</p><h2>{factionId === 'imperium' ? 'Лестница званий' : 'Лестница рангов'}</h2></div></div><div className="rank-progress-track"><span style={{ width: `${rankProgress}%` }} /></div><div className="rank-ladder">{ranks.map((item) => { const achieved = progress.xp >= item.minXP; const current = item.id === rank.id; return <article className={`rank-step ${achieved ? 'rank-achieved' : ''} ${current ? 'rank-current' : ''}`} key={item.id}><span>{achieved ? '✓' : item.minXP}</span><b>{item.name}</b><small>{item.minXP} XP</small></article> })}</div></section>
    <section className="achievement-section"><div className="section-heading"><div><p className="eyebrow">НАГРАДЫ · {earnedAwardsCount}/{allAwardsCount}</p><h2>Боевые отличия</h2></div></div><div className="achievement-groups">
      {Object.entries(historyAwards).map(([id, factionAwards]) => <AchievementGroup key={id} title={historyTitles[id]} mark={historyMarks[id]} awards={factionAwards} progress={progress} />)}
      <AchievementGroup title="Архивные заслуги" mark="◆" awards={archiveAwards} progress={progress} />
      <AchievementGroup title="Перехваченные сигналы" mark="⌁" awards={commonAwards[factionId]} progress={progress} />
    </div></section>
    <section className="profile-mission"><div><p className="eyebrow">ТЕКУЩАЯ ОПЕРАЦИЯ</p><h2>{nextCampaignLevel ? 'Следующая операция ждёт приказа' : 'Кампания пройдена'}</h2><p>{nextCampaignLevel ? `Продолжи кампанию, чтобы открыть следующую главу истории ${faction.shortName}.` : `Все доступные досье фракции ${faction.shortName} открыты.`}</p></div><Link className="button button-primary" to="/campaign">{nextCampaignLevel ? 'Продолжить кампанию' : 'Пересмотреть операции'} <span>→</span></Link></section>
    <section className="profile-mission"><div><p className="eyebrow">АРХИВНЫЕ ЗАПИСИ</p><h2>{faction.name}</h2><p>Перечитай уже открытые главы или проверь, какие материалы ещё запечатаны.</p></div><Link className="button button-outline" to={faction.archivePath}>Открыть архив <span>→</span></Link></section>
  </main>
}
