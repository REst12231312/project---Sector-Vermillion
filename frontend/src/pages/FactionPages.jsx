import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FACTION_IDS, getProgress, studyFaction, applyServerProgress } from '../utils/gameProgress'
import { apiRequest, isAuthenticated, postJson } from '../utils/api'

export const factions = {
  orks: { name: 'Орки', type: 'Ксеносы · Waaagh!', mark: 'W', color: 'green', summary: 'Орки — многочисленная зеленокожая раса, чьи яростные набеги способны охватить целые звёздные системы.', home: 'Вся галактика', doctrine: 'Орочьи отряды стремятся навязать противнику ближний бой и задавить его числом. Их военная культура строится вокруг вождей, племён и общего боевого порыва — Waaagh!.', sectorGoal: 'Собрать достаточно племён и сил, чтобы начать крупный Waaagh! в секторе.', source: 'https://www.warhammer-community.com/en-gb/articles/VQFlu0K2/what-is-warhammer-40000/' },
  chaos: { name: 'Хаос', type: 'Ересь · Варп', mark: '☼', color: 'red', summary: 'Силы Хаоса объединяют людей и сверхлюдей, поклоняющихся Тёмным Богам, а также демонов Варпа.', home: 'Имматериум и миры Империума', doctrine: 'Предательские легионы, разрозненные военные банды и смертные культисты ведут собственные войны. Их союзы часто непрочны, а амбиции военачальников меняют направление походов.', sectorGoal: 'Распространить влияние Варпа и ослабить власть Империума над мирами сектора.', source: 'https://www.warhammer-community.com/en-gb/articles/1C92Kwgj/starting-a-chaos-space-marines-army-in-warhammer-40000-everything-you-need-to-know-from-painting-to-lore/' },
  imperium: { name: 'Империум человечества', type: 'Человечество · Imperium', mark: 'I', color: 'gold', summary: 'Человечество удерживает огромную галактическую державу в эпоху постоянных войн и внутренних угроз.', home: 'Терра и тысячи подконтрольных миров', doctrine: 'Силы Империума включают множество организаций и армий. Их объединяет защита человеческих миров и верность Императору, но огромные расстояния и масштабы державы затрудняют управление.', sectorGoal: 'Удержать ключевые миры и восстановить связь между имперскими владениями сектора.', source: 'https://www.warhammer-community.com/en-gb/articles/VQFlu0K2/what-is-warhammer-40000/' },
  tau: { name: "Империя Т'ау", type: 'Ксеносы · Высшее Благо', mark: 'T', color: 'blue', summary: "Молодая и технологически развитая Империя Т'ау расширяется на восточной окраине галактики.", home: "Восточная окраина галактики · Сфера Т'ау", doctrine: "Касты Т'ау специализируются на разных задачах: Огненная каста воюет, Земная создаёт технологии, Воздушная управляет космическим флотом, а Водная ведёт переговоры. Их общество объединено идеей Высшего Блага.", sectorGoal: 'Убедить миры сектора присоединиться к Империи и обеспечить безопасность новых рубежей.', source: 'https://www.warhammer-community.com/en-gb/articles/qx7ln8cU/starting-a-tau-empire-army-in-warhammer-40000-everything-you-need-to-know-from-painting-to-lore/' },
}

const emptyProgress = { xp: 0, studiedFactions: [], dailyMission: null, achievements: [], answeredQuestions: [], discoveredEntries: [], readEntries: [] }

export default function FactionPages() {
  const { factionId } = useParams()
  const navigate = useNavigate()
  const [progress, setProgress] = React.useState(() => isAuthenticated() ? getProgress() : emptyProgress)
  const [fragments, setFragments] = React.useState([])
  const [answers, setAnswers] = React.useState({})
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  React.useEffect(() => {
    if (isAuthenticated() && factionId && factions[factionId]) studyFaction(factionId)
  }, [factionId])

  React.useEffect(() => {
    setFragments([])
    setAnswers({})
    setMessage('')
    if (!factionId || !factions[factionId]) return
    apiRequest(`/lore/${factionId}/fragments`)
      .then((result) => setFragments(result.fragments || []))
      .catch(() => setMessage('Сканер фрагментов недоступен. Проверь, что сервер архива запущен.'))
  }, [factionId])

  async function decodeFragment(event, fragment) {
    event.preventDefault()
    if (progress.discoveredEntries?.includes(fragment.id)) {
      navigate(`/archive/sector-ix?entry=${encodeURIComponent(fragment.id)}`)
      return
    }
    if (!isAuthenticated()) {
      setMessage('Чтобы сохранить найденное слово и открыть его архив, сначала вступи в ряды.')
      return
    }
    setMessage('Сверяю кодовое слово с архивом…')
    try {
      const result = await postJson(`/knowledge/${fragment.id}/discover`, { answer: answers[fragment.id] || '' })
      if (result.progress) applyServerProgress(result.progress)
      navigate(`/archive/sector-ix?entry=${encodeURIComponent(fragment.id)}`)
    } catch (error) {
      setMessage(error.message)
    }
  }

  if (factionId) {
    const faction = factions[factionId]
    if (!faction) return <main className="content-page"><p className="eyebrow">АРХИВ СЕКТОРА · ОШИБКА 404</p><h1>Досье не найдено</h1><Link className="text-link" to="/factions">Вернуться к фракциям →</Link></main>
    const authenticated = isAuthenticated()
    const foundCount = fragments.filter((fragment) => progress.discoveredEntries?.includes(fragment.id)).length
    return <main className="content-page">
      <Link className="back-link" to="/factions">← Все фракции</Link>
      <section className={`faction-detail ${faction.color}`}>
        <span className="eyebrow">{faction.type} · {authenticated ? (progress.studiedFactions.includes(factionId) ? 'ДОСЬЕ СОХРАНЕНО' : 'НОВАЯ ЗАПИСЬ') : 'ЧТЕНИЕ ДОСТУПНО'}</span>
        <div className="detail-mark">{faction.mark}</div>
        <h1>{faction.name}</h1>
        <p className="detail-lead">{faction.summary}</p>
        <div className="detail-facts">
          <div><span>РОДНОЙ РЕГИОН</span><b>{faction.home}</b></div>
          <div><span>ЗАПИСЬ АРХИВА</span><b>VER-IX / {factionId.toUpperCase()}</b></div>
          <div><span>СЛЕДЫ НАЙДЕНЫ</span><b>{foundCount}/{fragments.length || 10} · {authenticated ? `${progress.xp} XP` : 'ПРОГРЕСС СОХРАНИТСЯ ПОСЛЕ ВСТУПЛЕНИЯ'}</b></div>
        </div>
        <h2>Доктрина и методы</h2>
        <p>{faction.doctrine}</p>
        <div className="sector-objective"><span className="eyebrow">ИНТЕРЕСЫ В СЕКТОРЕ</span><p>{faction.sectorGoal}</p></div>
      </section>

      <section className="fragment-hunt">
        <div className="section-heading"><div><p className="eyebrow">СКАНЕР ПЕРЕХВАТОВ · {factionId.toUpperCase()}</p><h2>Расшифруй следы</h2></div><span className="sealed-count">{foundCount}/{fragments.length || 10} ФРАГМЕНТОВ</span></div>
        <p className="hero-lead">Прочитай подсказку и досье фракции, введи подходящее ключевое слово. Каждая расшифровка открывает отдельную запись сектора.</p>
        {!authenticated && <p className="archive-status">Читать можно без входа. Чтобы расшифровывать и сохранять находки, <Link to="/register">вступи в ряды</Link>.</p>}
        <div className="fragment-grid">{fragments.map((fragment, index) => {
          const discovered = progress.discoveredEntries?.includes(fragment.id)
          return <form className={`fragment-card ${discovered ? 'fragment-found' : ''}`} key={fragment.id} onSubmit={(event) => decodeFragment(event, fragment)}>
            <span className="note-index">{discovered ? 'СИГНАЛ РАСШИФРОВАН' : `ЗАПИСЬ ${String(index + 1).padStart(2, '0')} · ЗАШИФРОВАНО`}</span>
            <p className="fragment-cipher">{fragment.cipherText}</p>
            <p className="fragment-hint"><b>Подсказка:</b> {fragment.hint}</p>
            <label htmlFor={`answer-${fragment.id}`}>КЛЮЧЕВОЕ СЛОВО</label>
            <div className="fragment-input-row"><input id={`answer-${fragment.id}`} value={answers[fragment.id] || ''} onChange={(event) => setAnswers({ ...answers, [fragment.id]: event.target.value })} placeholder="Введи термин" autoComplete="off" /><button className="button button-outline" type="submit">{discovered ? 'Открыть запись' : 'Расшифровать'} <span>→</span></button></div>
            {discovered && <small className="entry-read">ОТКРЫТО · НАЖМИ, ЧТОБЫ ПЕРЕЙТИ К ЗАПИСИ</small>}
          </form>
        })}</div>
        {message && <p className="archive-status" role="status">{message}</p>}
      </section>
      <a className="source-link" href={faction.source} target="_blank" rel="noreferrer">Источник по вселенной: Warhammer Community ↗</a>
    </main>
  }

  return <main className="content-page"><p className="eyebrow">ДОСЬЕ СЕКТОРА · {String(FACTION_IDS.length).padStart(2, '0')} ЗАПИСИ · ИЗУЧЕНО {progress.studiedFactions.length}/{FACTION_IDS.length}</p><div className="section-heading"><div><h1>Фракции</h1><p className="hero-lead">Силы, претендующие на контроль над галактикой.</p></div></div><div className="faction-grid">{Object.entries(factions).map(([id, faction]) => { const studied = progress.studiedFactions.includes(id); return <Link className={`faction-card ${faction.color}`} to={`/factions/${id}`} key={id}><div className="card-top"><span>{faction.type}</span><span>{studied ? '✓' : '↗'}</span></div><div className="faction-mark">{faction.mark}</div><h3>{faction.name}</h3><p>{faction.summary}</p><span className="card-bottom">{studied ? 'ДОСЬЕ ИЗУЧЕНО' : 'ОТКРЫТЬ ДОСЬЕ'} <span>→</span></span></Link>})}</div></main>
}
