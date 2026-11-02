import React from 'react'
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
    <p className="account-email"><span>EMAIL</span>{user?.email || 'Не указан'}</p>
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
  { id: 'campaign-imperium-origin', icon: 'I', name: 'Объединитель Терры', description: 'Заверши операцию «Объединение Терры».' },
  { id: 'campaign-great-crusade', icon: 'II', name: 'Навигатор Великого похода', description: 'Заверши операцию Великого крестового похода.' },
  { id: 'campaign-primarchs', icon: 'III', name: 'Собиратель сыновей', description: 'Заверши операцию по поиску Примархов.' },
  { id: 'campaign-imperium-davin', icon: 'IV', name: 'Свидетель Давина', description: 'Сохрани свидетельства о ранении Воителя.' },
  { id: 'campaign-prospero-censure', icon: 'V', name: 'Пепел Просперо', description: 'Помоги экспедиции пережить гибель Тизки.' },
  { id: 'campaign-mars-schism', icon: 'VI', name: 'Верность Марса', description: 'Поддержи лоялистов в гражданской войне Механикум.' },
  { id: 'campaign-istvaan-iii-warning', icon: 'VII', name: 'Вестник Исствана', description: 'Помоги доставить Терре весть о мятеже.' },
  { id: 'campaign-istvaan-v', icon: 'VIII', name: 'Выживший Исствана', description: 'Помоги лоялистам пережить предательство на Исстване V.' },
  { id: 'campaign-imperium-calth', icon: 'IX', name: 'Оборона Ультрамара', description: 'Помоги отрядам Ультрамаринов удержаться после удара на Калте.' },
  { id: 'campaign-beta-garmon', icon: 'X', name: 'Рубеж Гармона', description: 'Помоги задержать наступление Хоруса на Бета-Гармоне.' },
  { id: 'campaign-siege-terra-loyalist', icon: 'XI', name: 'Щит Терры', description: 'Помоги защитникам Императорского дворца.' },
  { id: 'campaign-scouring-aftermath', icon: 'XII', name: 'Начало Очищения', description: 'Начни долгую кампанию против предателей.' },
]
const chaosAwards = [
  { id: 'campaign-chaos-whispers', icon: 'I', name: 'Глас из варпа', description: 'Заверши операцию по вербовке тайного культа.' },
  { id: 'campaign-davin-fall', icon: 'II', name: 'Путь Воителя', description: 'Заверши операцию на Давине.' },
  { id: 'campaign-signus-prime', icon: 'III', name: 'Ловушка на Сигнусе', description: 'Заверши попытку Хоруса склонить Сангвиния к Хаосу.' },
  { id: 'campaign-istvaan-betrayal', icon: 'IV', name: 'Пепел Исствана', description: 'Заверши операцию предательства.' },
  { id: 'campaign-chaos-calth', icon: 'V', name: 'Пепел Калта', description: 'Заверши атаку Несущих Слово на Ультрамар.' },
  { id: 'campaign-shadow-crusade', icon: 'VI', name: 'Теневой крестовый поход', description: 'Помоги Лоргару и Ангрону прорваться в Ультрамар.' },
  { id: 'campaign-molech-campaign', icon: 'VII', name: 'Врата Молеха', description: 'Помоги Хорусу получить силу Варпа.' },
  { id: 'campaign-beta-garmon-chaos', icon: 'VIII', name: 'Пролом у Бета-Гармона', description: 'Расчисти путь предательским силам к Терре.' },
  { id: 'campaign-siege-terra', icon: 'IX', name: 'Осада Терры', description: 'Доведи кампанию Хаоса до осады дворца.' },
  { id: 'campaign-battle-luna', icon: 'X', name: 'Побег из Сола', description: 'Выведи часть сил из Солнечной системы.' },
  { id: 'campaign-eye-retreat', icon: 'XI', name: 'Путь в Око', description: 'Приведи уцелевших к убежищу в Варпе.' },
]
const orkAwards = [
  { id: 'campaign-orks-gathering', icon: 'I', name: 'Зов Waaagh!', description: 'Собери первую орду.' },
  { id: 'campaign-orks-ullanor-gates', icon: 'II', name: 'Врата Улланора', description: 'Проведи орду к крепости Урлакка Урга.' },
  { id: 'campaign-orks-ullanor-battle', icon: 'III', name: 'Последний бой Урлакка Урга', description: 'Пройди каноническую битву на Улланоре.' },
  { id: 'campaign-orks-beast-arises', icon: 'IV', name: 'Восстание Зверя', description: 'Проведи орду через Империум во времена Зверя.' },
  { id: 'campaign-orks-scattered-warband', icon: 'V', name: 'Орда снова собирается', description: 'Объедини банду в 41-м тысячелетии.' },
  { id: 'campaign-orks-armageddon', icon: 'VI', name: 'Зелёный прилив', description: 'Заверши кампанию Армагеддона.' },
  { id: 'campaign-orks-octarius', icon: 'VII', name: 'Бойня Октариуса', description: 'Сражайся против флота-улья Левиафан.' },
  { id: 'campaign-orks-krongar', icon: 'VIII', name: 'Десять дней на Кронгаре', description: 'Помоги Газкуллу пережить дуэль.' },
]
const tauAwards = [
  { id: 'campaign-tau-first-sphere', icon: 'I', name: 'Общее предназначение', description: 'Подготовь первые экспедиции Империи Тау.' },
  { id: 'campaign-tau-damocles', icon: 'II', name: 'Рубеж Дамокла', description: 'Переживи Крестовый поход Дамокла.' },
  { id: 'campaign-tau-arkunasha', icon: 'III', name: 'Щит Аркунаши', description: 'Удержи орочий натиск вместе с Фарсайтом.' },
  { id: 'campaign-tau-farsight-enclaves', icon: 'IV', name: 'Красный исход', description: 'Сопроводи Фарсайта в изгнание.' },
  { id: 'campaign-tau-agrellan', icon: 'V', name: 'Вторая кампания на Аггреллане', description: 'Удержи мир во время имперской блокады.' },
  { id: 'campaign-tau-fourth-sphere', icon: 'VI', name: 'Возвращение Четвёртой', description: 'Собери экспедицию после варп-катастрофы.' },
  { id: 'campaign-tau-fifth-sphere', icon: 'VII', name: 'Новая сфера', description: 'Поддержи экспансию Шэдоусан.' },
  { id: 'campaign-tau-chalnath', icon: 'VIII', name: 'Возвращение на Ведик', description: 'Подготовь новое наступление в системе Ведик.' },
  { id: 'campaign-tau-cao-quo', icon: 'IX', name: 'Восстание на Цао Куо', description: 'Разберись с восстанием на новом мире Тау.' },
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

function ProfileGlyph({ name }) {
  const paths = {
    profile: <><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></>,
    ranks: <><path d="m12 3 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9L12 3Z"/><path d="M7 21h10"/></>,
    awards: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v2a4 4 0 0 0 4 4m7-6h3v2a4 4 0 0 1-4 4m-3 4v3m-4 2h8"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.6a8 8 0 0 1-1.6.9l-.2 1.5h-2.5l-.2-1.5a8 8 0 0 1-1.7-.9l-1.3.6-1.3-2.1 1.2-.9a7 7 0 0 1 0-1.9l-1.2-.9 1.3-2.1 1.3.6a8 8 0 0 1 1.7-.9l.2-1.5h2.5l.2 1.5a8 8 0 0 1 1.6.9l1.4-.6 1.2 2.1-1.2.9a7 7 0 0 1-.1 1.9Z" transform="translate(-1 -1)"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function RankLadder({ ranks, xp, currentRank, factionId, factionName }) {
  const [selectedId, setSelectedId] = React.useState(currentRank.id)
  React.useEffect(() => setSelectedId(currentRank.id), [currentRank.id])
  const selected = ranks.find((item) => item.id === selectedId) || currentRank
  const selectedIndex = ranks.findIndex((item) => item.id === selected.id)
  const rankMarks = ['◇', '✦', '✥', '✣', '✹']
  const title = factionId === 'imperium' ? 'звание' : 'ранг'
  return <section className="profile-panel profile-ranks" aria-labelledby="rank-heading">
    <header className="profile-section-heading"><p className="eyebrow">ПУТЬ СЛУЖЕНИЯ · {xp} XP</p><h2 id="rank-heading">Лестница {factionId === 'imperium' ? 'званий' : 'рангов'}</h2><p>Выбери знак, чтобы изучить требование для повышения.</p></header>
    <div className="rank-ladder">{ranks.map((item, index) => {
      const achieved = xp >= item.minXP
      const current = item.id === currentRank.id
      return <button type="button" aria-pressed={selected.id === item.id} className={`rank-step ${achieved ? 'rank-achieved' : ''} ${current ? 'rank-current' : ''} ${selected.id === item.id ? 'rank-selected' : ''}`} key={item.id} onClick={() => setSelectedId(item.id)}>
        <span className="rank-step-seal" aria-hidden="true">{rankMarks[index % rankMarks.length]}</span><span className="rank-step-copy"><b>{item.name}</b><small>{item.minXP} XP</small></span><span className="rank-step-state">{current ? 'ТЕКУЩИЙ' : achieved ? 'ПОЛУЧЕН' : 'ЗАКРЫТ'}</span>
      </button>
    })}</div>
    <aside className="rank-detail" aria-live="polite"><span className="profile-detail-mark">{rankMarks[selectedIndex % rankMarks.length]}</span><div><p className="eyebrow">{selected.id === currentRank.id ? `ТЕКУЩЕЕ ${title.toUpperCase()}` : selected.minXP <= xp ? 'ПОЛУЧЕННЫЙ РАНГ' : 'СЛЕДУЮЩЕЕ ПОВЫШЕНИЕ'}</p><h3>{selected.name}</h3><p>Ступень {selectedIndex + 1} из {ranks.length} в иерархии «{factionName}». {selected.minXP <= xp ? `Порог получения: ${selected.minXP} XP. ${selected.id === currentRank.id ? 'Это твоё действующее звание.' : `Текущее звание — ${currentRank.name}.`}` : `Для получения требуется ${selected.minXP} XP. До повышения осталось ${Math.max(0, selected.minXP - xp)} XP.`}</p></div><span className="rank-detail-faction">{factionName}</span></aside>
  </section>
}

function AchievementGroup({ title, mark, awards, progress, selectedAward, onSelect, isOpen, onOpen, onBack }) {
  const earnedCount = awards.filter((award) => progress.achievements.includes(award.id)).length
  return <section className={`award-group ${isOpen ? 'is-open' : ''}`}>
    {isOpen ? <><button type="button" className="award-group-back" onClick={onBack}>← К разделам достижений</button><header><span className="award-group-mark" aria-hidden="true">{mark}</span><h3>{title}</h3><span>{earnedCount} / {awards.length} ПОЛУЧЕНО</span></header></> : <button type="button" className="award-group-trigger" onClick={onOpen}><span className="award-group-mark" aria-hidden="true">{mark}</span><span className="award-group-trigger-title">{title}</span><span className="award-group-trigger-count">{earnedCount} / {awards.length} ПОЛУЧЕНО</span><span className="award-group-trigger-arrow" aria-hidden="true">→</span></button>}
    {isOpen && <div className="achievement-grid">{awards.map((award) => {
      const earned = progress.achievements.includes(award.id)
      const collected = award.sourceFaction ? (progress.interceptedLore?.[award.sourceFaction] || []).length : 0
      const total = award.sourceFaction ? FACTION_DETAILS[award.sourceFaction].levelIds.length : 0
      return <button type="button" aria-pressed={selectedAward?.id === award.id} className={`achievement-card ${earned ? 'earned' : ''} ${selectedAward?.id === award.id ? 'is-selected' : ''}`} key={award.id} onClick={() => onSelect(award, earned, award.sourceFaction && !earned ? `${collected}/${total} досье перехвачено · ${award.description}` : award.description)}>
        <span className="achievement-icon" aria-hidden="true">{award.icon}</span><span className="achievement-title">{award.name}</span><span className="achievement-state">{earned ? 'ПОЛУЧЕНО' : 'ЗАКРЫТО'}</span>
      </button>
    })}</div>}
  </section>
}

export default function PlayerPages() {
  const [progress, setProgress] = React.useState(getProgress)
  const [user, setUser] = React.useState(getCurrentUser)
  const [activeTab, setActiveTab] = React.useState('profile')
  const [selectedAward, setSelectedAward] = React.useState(null)
  const [openAchievementSection, setOpenAchievementSection] = React.useState(null)
  const [battleStats, setBattleStats] = React.useState({ wins: 0, losses: 0, matches: 0, winRate: 0, favoriteFaction: null })
  const [matchHistory, setMatchHistory] = React.useState([])
  const [historyBusy, setHistoryBusy] = React.useState(true)
  React.useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])
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
  const rankProgress = rank.next ? Math.min(100, Math.max(0, ((progress.xp - rank.minXP) / (rank.next.minXP - rank.minXP)) * 100)) : 100
  const themeClass = `${factionId}-theme`
  const factionArtwork = {
    imperium: 'vermillion_fullwidth_background.svg',
    chaos: 'chaos_profile.svg',
    orks: 'orks_profile.svg',
    tau: 'tau_profile.svg',
  }[factionId]
  const heroImage = `/images/main_svg/profileSite/${factionArtwork}`
  const tabs = [{ id: 'profile', label: 'Профиль', icon: 'profile' }, { id: 'ranks', label: 'Ранги', icon: 'ranks' }, { id: 'awards', label: 'Отличия', icon: 'awards' }, { id: 'settings', label: 'Настройки', icon: 'settings' }]
  const tabKeyDown = (event) => {
    const current = tabs.findIndex((tab) => tab.id === activeTab)
    let next = current
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % tabs.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return
    event.preventDefault()
    setActiveTab(tabs[next].id)
    document.getElementById(`profile-tab-${tabs[next].id}`)?.focus()
  }
  const chooseAward = (award, earned, description) => setSelectedAward({ ...award, earned, detail: description })
  const achievementSections = [
    ...Object.entries(historyAwards).map(([id, awards]) => ({ id: `history-${id}`, title: historyTitles[id], mark: historyMarks[id], awards })),
    { id: 'archive', title: 'Архивные заслуги', mark: '◆', awards: archiveAwards },
    { id: 'signals', title: 'Перехваченные сигналы', mark: '⌁', awards: commonAwards[factionId] },
  ]

  return <main className={`profile-page ${themeClass}`} style={{ '--profile-artwork': `url("${heroImage}")` }}>
    <aside className="profile-sidebar"><p className="profile-sidebar-brand">SV<span> /</span> ARCHIVE</p><nav className="profile-tabs" role="tablist" aria-label="Разделы личного профиля" onKeyDown={tabKeyDown}>{tabs.map((tab) => <button id={`profile-tab-${tab.id}`} key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`profile-panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} className={`profile-tab ${activeTab === tab.id ? 'is-active' : ''}`} onClick={() => setActiveTab(tab.id)}><ProfileGlyph name={tab.icon} /><span>{tab.label}</span></button>)}</nav><div className="profile-sidebar-foot"><span className="profile-sidebar-seal">{faction.mark}</span><small>ФРАКЦИЯ<br />{faction.shortName.toUpperCase()}</small></div></aside>
    <div className="profile-main">
      <div className="profile-topline"><p className="eyebrow">ЛИЧНОЕ ДОСЬЕ · {factionId === 'imperium' ? 'ВОИНСКОЕ ЗВАНИЕ' : 'РАНГ'}</p><span>SECTOR: VERMILLION <i>·</i> 41K</span></div>
      {activeTab === 'profile' && <section className="profile-tab-content profile-panel profile-overview" id="profile-panel-profile" role="tabpanel" aria-labelledby="profile-tab-profile">
        <section className="profile-hero" aria-label={`Досье ${faction.name}`}><div className="profile-hero-top"><span className="profile-hero-classification">{faction.mark} <i>·</i> {faction.name.toUpperCase()}</span><span>ЛИЧНОЕ ДЕЛО / 001</span></div>
          <div className="profile-hero-content"><div className={`profile-avatar avatar-${user?.avatarId || 'default'}`} aria-label="Знак профиля">{AVATARS.find(([id]) => id === user?.avatarId)?.[2] || user?.username?.[0]?.toUpperCase() || 'A'}</div><div className="profile-identity"><p className="eyebrow">КОМАНДИР · {rank.name.toUpperCase()}</p><div className="profile-name-line"><h1>{user?.username || 'КОМАНДИР'}</h1><button type="button" className="profile-edit-name" aria-label="Изменить имя пользователя" title="Изменить имя пользователя" onClick={() => setActiveTab('settings')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16.5-.8 4.3 4.3-.8L19 8.5 15.5 5 4 16.5Z"/><path d="m13.8 6.7 3.5 3.5"/></svg></button></div><p className="profile-faction-name">{faction.name}</p></div>
            <div className="profile-xp-total"><b>{progress.xp.toLocaleString('ru-RU')}</b><span>ОПЫТ</span></div>
          </div>
          <div className="profile-rank-progress"><div className="profile-rank-progress-label"><span>{rank.name.toUpperCase()}</span>{rank.next ? <span>СЛЕДУЮЩЕЕ: {rank.next.name.toUpperCase()}</span> : <span>МАКСИМАЛЬНЫЙ РАНГ</span>}</div><div className="profile-progress-track" role="progressbar" aria-label="Прогресс до следующего ранга" aria-valuemin="0" aria-valuemax="100" aria-valuenow={rankProgress}><span style={{ width: `${rankProgress}%` }} /></div><div className="profile-rank-progress-values"><span>{progress.xp.toLocaleString('ru-RU')} XP</span><span>{rank.next ? `${rank.next.minXP.toLocaleString('ru-RU')} XP · ${rank.next.name}` : 'ПУТЬ ПРОЙДЕН'}</span></div></div>
        </section>
        <div className="profile-overview-stats"><article><span>ЗВАНИЕ</span><b>{rank.name}</b><small>{rank.next ? `Ещё ${Math.max(0, rank.next.minXP - progress.xp)} XP до повышения` : 'Высшее звание получено'}</small></article><article><span>ОПЕРАЦИИ</span><b>{factionCompleted.length} <small>/ {levelIds.length}</small></b><small>Пройдено в кампании</small></article><article><span>БОЕВЫЕ ОТЛИЧИЯ</span><b>{earnedAwardsCount} <small>/ {allAwardsCount}</small></b><small>Наград получено</small></article></div>
        <section className="online-battle-record"><header className="profile-section-heading"><p className="eyebrow">СЕТЕВЫЕ ОПЕРАЦИИ</p><h2>Боевой послужной список</h2></header><div className="profile-stats battle-record-stats"><article><span>МАТЧИ</span><b>{battleStats.matches}</b></article><article><span>ПОБЕДЫ</span><b>{battleStats.wins}</b></article><article><span>ПОРАЖЕНИЯ</span><b>{battleStats.losses}</b></article><article><span>ПОБЕДНОСТЬ</span><b>{battleStats.winRate}%</b></article><article><span>ЧАСТАЯ ФРАКЦИЯ</span><b className="stat-rank">{FACTION_NAMES[battleStats.favoriteFaction] || '—'}</b></article></div>
          <div className="match-history-list">{historyBusy ? <p>Загружаю историю матчей…</p> : matchHistory.length ? matchHistory.map((match) => { const won = match.winnerUserId === user?.id; const opponent = match.participants.find((participant) => participant.userId !== user?.id); return <article className={`match-history-item ${won ? 'is-victory' : 'is-defeat'}`} key={match.matchId}><span className="match-history-result">{won ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</span><div><b>{opponent?.username || 'Соперник'} · {FACTION_NAMES[opponent?.faction] || 'фракция неизвестна'}</b><small>{match.mapName || match.mapId} · Ход {match.turns} · {Math.floor(match.durationSeconds / 60)} мин. · {new Date(match.playedAt).toLocaleDateString('ru-RU')}</small></div><span>{WIN_METHODS[match.winMethod] || 'бой завершён'}</span></article> }) : <p className="match-history-empty">Сетевых матчей пока нет. Первый результат появится здесь после завершения боя.</p>}</div>
        </section>
      </section>}
      {activeTab === 'ranks' && <div className="profile-tab-content" id="profile-panel-ranks" role="tabpanel" aria-labelledby="profile-tab-ranks"><RankLadder ranks={ranks} xp={progress.xp} currentRank={rank} factionId={factionId} factionName={faction.name} /></div>}
      {activeTab === 'awards' && <section className={`profile-tab-content profile-panel profile-awards ${openAchievementSection ? 'has-open-achievement-section' : ''}`} id="profile-panel-awards" role="tabpanel" aria-labelledby="profile-tab-awards"><header className="profile-section-heading"><p className="eyebrow">НАГРАДЫ · {earnedAwardsCount}/{allAwardsCount} ПОЛУЧЕНО</p><h2>Боевые отличия</h2><p>Выбери раздел, чтобы открыть его достижения.</p></header><div className="achievement-groups">
        {achievementSections.filter((section) => !openAchievementSection || section.id === openAchievementSection).map((section) => <AchievementGroup key={section.id} title={section.title} mark={section.mark} awards={section.awards} progress={progress} selectedAward={selectedAward} onSelect={chooseAward} isOpen={openAchievementSection === section.id} onOpen={() => { setSelectedAward(null); setOpenAchievementSection(section.id) }} onBack={() => { setSelectedAward(null); setOpenAchievementSection(null) }} />)}
      </div>{openAchievementSection && selectedAward && <aside className="award-detail" aria-live="polite"><span className="achievement-icon">{selectedAward.icon}</span><div><p className="eyebrow">{selectedAward.earned ? 'БОЕВОЕ ОТЛИЧИЕ · ПОЛУЧЕНО' : 'БОЕВОЕ ОТЛИЧИЕ · ЗАКРЫТО'}</p><h3>{selectedAward.name}</h3><p>{selectedAward.detail}</p><span className="award-detail-status">{selectedAward.earned ? 'СТАТУС: ПОЛУЧЕНО' : 'СТАТУС: НЕ ПОЛУЧЕНО'}</span></div><button type="button" aria-label="Снять выбор награды" onClick={() => setSelectedAward(null)}>×</button></aside>}</section>}
      {activeTab === 'settings' && <div className="profile-tab-content" id="profile-panel-settings" role="tabpanel" aria-labelledby="profile-tab-settings"><AccountSettings user={user} onUser={setUser} /></div>}
    </div>
  </main>
}
