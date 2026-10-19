import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress, getFactionRank, IMPERIUM_RANKS, CHAOS_RANKS, ORKS_RANKS, TAU_RANKS, FACTION_DETAILS } from '../utils/gameProgress'
import { apiRequest, getCurrentUser, updateCurrentUser } from '../utils/api'
import './PlayerPages.css'

const FACTION_NAMES = { imperium: 'Империум', chaos: 'Хаос', orks: 'Орки', tau: 'Империя Тау' }
const AVATARS = [['default', 'Позывной', '◈'], ['imperium', 'Империум', 'I'], ['chaos', 'Хаос', '⛧'], ['orks', 'Орки', 'W'], ['tau', 'Тау', 'T'], ['skull', 'Череп', '☠'], ['eagle', 'Орёл', '✦'], ['star', 'Звезда', '✧']]
const WIN_METHODS = { annihilation: 'уничтожение отрядов', objectives: 'контроль точек', surrender: 'сдача', disconnect: 'потеря связи', battle: 'бой' }

function AccountSettings({ user, onUser }) {
  const [username, setUsername] = React.useState(user?.username || '')
  const [avatarId, setAvatarId] = React.useState(user?.avatarId || 'default')
  const [favoriteFaction, setFavoriteFaction] = React.useState(user?.favoriteFaction || user?.faction || 'imperium')
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  React.useEffect(() => {
    setUsername(user?.username || '')
    setAvatarId(user?.avatarId || 'default')
    setFavoriteFaction(user?.favoriteFaction || user?.faction || 'imperium')
  }, [user])

  async function saveProfile(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const result = await apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify({ username, avatarId, favoriteFaction }) })
      const updated = updateCurrentUser(result.user); onUser(updated); setNotice('Профиль сохранён.')
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  async function savePassword(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const result = await apiRequest('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) })
      const updated = updateCurrentUser(result.user); onUser(updated); setCurrentPassword(''); setNewPassword(''); setNotice('Пароль изменён.')
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  return <section className="account-settings">
    <div className="section-heading"><div><p className="eyebrow">АККАУНТ · НАСТРОЙКИ</p><h2>Личные данные</h2></div></div>
    <form className="account-settings-form" onSubmit={saveProfile}>
      <label>ПОЗЫВНОЙ<input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" required /></label>
      <label>ЛЮБИМАЯ ФРАКЦИЯ<select value={favoriteFaction} onChange={(event) => setFavoriteFaction(event.target.value)}>{Object.entries(FACTION_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <fieldset className="account-avatar-picker"><legend>ЗНАК ПРОФИЛЯ</legend>{AVATARS.map(([id, name, icon]) => <label className={avatarId === id ? 'is-selected' : ''} key={id} title={name}><input type="radio" name="avatarId" value={id} checked={avatarId === id} onChange={() => setAvatarId(id)} /><span>{icon}</span><small>{name}</small></label>)}</fieldset>
      <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'СОХРАНЯЮ…' : 'Сохранить профиль'}</button>
    </form>
    <form className="account-password-form" onSubmit={savePassword}>
      <h3>Сменить пароль</h3><label>ТЕКУЩИЙ ПАРОЛЬ<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label><label>НОВЫЙ ПАРОЛЬ<input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label><button className="button button-outline" type="submit" disabled={busy}>{busy ? 'СОХРАНЯЮ…' : 'Изменить пароль'}</button>
    </form>
    {error && <p className="online-error" role="alert">{error}</p>}{notice && <p className="online-notice" role="status">{notice}</p>}
  </section>
}

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
  const [user, setUser] = React.useState(getCurrentUser)
  const [battleStats, setBattleStats] = React.useState({ wins: 0, losses: 0, matches: 0, winRate: 0, favoriteFaction: null })
  const [matchHistory, setMatchHistory] = React.useState([])
  const [historyBusy, setHistoryBusy] = React.useState(true)
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
  React.useEffect(() => {
    const updateUser = (event) => setUser(event.detail || getCurrentUser())
    window.addEventListener('sv-user-updated', updateUser)
    return () => window.removeEventListener('sv-user-updated', updateUser)
  }, [])
  React.useEffect(() => {
    let cancelled = false
    Promise.all([apiRequest('/auth/profile'), apiRequest('/auth/matches?limit=50')]).then(([profile, history]) => {
      if (cancelled) return
      const updated = updateCurrentUser(profile.user)
      setUser(updated); setBattleStats(profile.stats); setMatchHistory(history.matches)
    }).catch(() => {}).finally(() => { if (!cancelled) setHistoryBusy(false) })
    return () => { cancelled = true }
  }, [])

  const ranks = factionId === 'chaos' ? CHAOS_RANKS : factionId === 'orks' ? ORKS_RANKS : factionId === 'tau' ? TAU_RANKS : IMPERIUM_RANKS
  const rank = getFactionRank(progress.xp, factionId)
  const completed = progress.completedLevels || []
  const factionCompleted = completed.filter((id) => levelIds.includes(id))
  const nextCampaignLevel = levelIds.find((id) => !factionCompleted.includes(id))
  const rankProgress = rank.next ? Math.min(100, Math.max(0, ((progress.xp - rank.minXP) / (rank.next.minXP - rank.minXP)) * 100)) : 100

  return <main className="content-page profile-page">
    <p className="eyebrow">ЛИЧНЫЙ АРХИВ · {factionId === 'imperium' ? 'ВОИНСКОЕ ЗВАНИЕ' : 'РАНГ'}</p>
    <section className={`profile-card ${factionId === 'chaos' ? 'chaos-theme' : factionId === 'orks' ? 'orks-theme' : factionId === 'tau' ? 'tau-theme' : ''}`}><div className={`profile-avatar avatar-${user?.avatarId || 'default'}`}>{AVATARS.find(([id]) => id === user?.avatarId)?.[2] || user?.username?.[0]?.toUpperCase() || 'A'}</div><div><span className="eyebrow">{user?.username || 'КОМАНДИР'} · {faction.name.toUpperCase()}</span><h1>{rank.name}</h1><p>{factionId === 'imperium' ? 'Твоё звание растёт вместе с опытом, полученным в операциях.' : 'Твой ранг растёт вместе с опытом, полученным в операциях.'}</p></div><div className="profile-xp"><b>{progress.xp}</b><span>ОПЫТ</span></div></section>
    <AccountSettings user={user} onUser={setUser} />
    <section className="online-battle-record"><div className="section-heading"><div><p className="eyebrow">СЕТЕВЫЕ ОПЕРАЦИИ</p><h2>Боевой послужной список</h2></div></div><div className="profile-stats battle-record-stats"><article><span>МАТЧИ</span><b>{battleStats.matches}</b></article><article><span>ПОБЕДЫ</span><b>{battleStats.wins}</b></article><article><span>ПОРАЖЕНИЯ</span><b>{battleStats.losses}</b></article><article><span>ПОБЕДНОСТЬ</span><b>{battleStats.winRate}%</b></article><article><span>ЧАСТАЯ ФРАКЦИЯ</span><b className="stat-rank">{FACTION_NAMES[battleStats.favoriteFaction] || '—'}</b></article></div>
      <div className="match-history-list">{historyBusy ? <p>Загружаю историю матчей…</p> : matchHistory.length ? matchHistory.map((match) => { const won = match.winnerUserId === user?.id; const opponent = match.participants.find((participant) => participant.userId !== user?.id); return <article className={`match-history-item ${won ? 'is-victory' : 'is-defeat'}`} key={match.matchId}><span className="match-history-result">{won ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</span><div><b>{opponent?.username || 'Соперник'} · {FACTION_NAMES[opponent?.faction] || 'фракция неизвестна'}</b><small>{match.mapName || match.mapId} · Ход {match.turns} · {Math.floor(match.durationSeconds / 60)} мин. · {new Date(match.playedAt).toLocaleDateString('ru-RU')}</small></div><span>{WIN_METHODS[match.winMethod] || 'бой завершён'}</span></article> }) : <p className="match-history-empty">Сетевых матчей пока нет. Первый результат появится здесь после завершения боя.</p>}</div>
    </section>
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
