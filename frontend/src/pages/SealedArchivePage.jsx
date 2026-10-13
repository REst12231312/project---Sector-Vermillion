import React from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, postJson } from '../utils/api'
import { applyServerProgress } from '../utils/gameProgress'
import './SealedArchivePage.css'

export default function SealedArchivePage() {
  const [knowledge, setKnowledge] = React.useState(null)
  const [busyId, setBusyId] = React.useState(null)
  const [message, setMessage] = React.useState('Загружаю найденные материалы…')

  const refreshKnowledge = React.useCallback(async () => {
    const result = await apiRequest('/knowledge')
    setKnowledge(result)
  }, [])

  React.useEffect(() => {
    refreshKnowledge().then(() => setMessage('Изучай досье фракций, чтобы находить новые термины и записи.'))
      .catch(() => setMessage('Не удалось связаться с архивом. Проверь, что backend запущен.'))
  }, [refreshKnowledge])

  async function readEntry(entryId) {
    setBusyId(entryId)
    setMessage('Открываю запись…')
    try {
      const result = await postJson(`/knowledge/${entryId}/read`, {})
      if (result.progress) applyServerProgress(result.progress)
      await refreshKnowledge()
      setMessage(`Запись прочитана: +${entryId === 'zone-ver-ix' ? '50' : '20'} XP.`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusyId(null)
    }
  }

  const entries = knowledge?.entries || []
  const terms = knowledge?.terms || []
  const zone = entries.find((entry) => entry.id === 'zone-ver-ix')

  return <main className="content-page sealed-page">
    <Link className="back-link" to="/">← На главную</Link>
    <p className="eyebrow">СЕКТОР VER-IX · АРХИВ ОТКРЫТЫХ СВЕДЕНИЙ</p>
    <h1>Следы и свидетельства</h1>
    <p className="hero-lead">Вчитывайся в досье фракций: важные слова приведут к полевым заметкам, рассказам о битвах и новым зонам.</p>

    <section className="discovered-terms">
      <div className="section-heading"><div><p className="eyebrow">СЛОВА, НАЙДЕННЫЕ В ДОСЬЕ</p><h2>Ключевые термины</h2></div><span className="sealed-count">{terms.length} НАЙДЕНО</span></div>
      {terms.length ? <div className="term-grid">{terms.map((term) => <button className="term-chip" type="button" key={term.entryId} onClick={() => document.getElementById(`entry-${term.entryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><span>{term.category}</span><b>{term.keyword}</b><small>{term.title} →</small></button>)}</div> : <p className="archive-status">Пока нет терминов. Начни с досье Империума, Орков или Хаоса.</p>}
    </section>

    <section className="sealed-notes"><div className="section-heading"><div><p className="eyebrow">ПОЛЕВЫЕ МАТЕРИАЛЫ</p><h2>Связанные записи</h2></div><span className="sealed-count">{entries.filter((entry) => entry.read).length}/{entries.length} ПРОЧИТАНО</span></div>
      <div className="note-grid">{entries.map((entry) => <article className={`field-note ${entry.unlocked ? 'available' : 'locked'} ${entry.category === 'НОВАЯ ЗОНА' ? 'zone-note' : ''}`} id={`entry-${entry.id}`} key={entry.id}>
        <span className="note-index">{entry.unlocked ? entry.category : 'ЗАПИСЬ ЗАШИФРОВАНА'}</span>
        <h3>{entry.unlocked ? entry.title : 'Неизвестный материал'}</h3>
        {entry.read ? <><p>{entry.body}</p><span className="entry-read">ЗАПИСЬ ВНЕСЕНА В АРХИВ</span></> : entry.unlocked ? <><p>Найден термин: <b>{entry.keyword}</b>. Прочитай запись, чтобы связать эту зацепку с историей сектора.</p><button className="button button-outline" type="button" onClick={() => readEntry(entry.id)} disabled={busyId === entry.id}>{busyId === entry.id ? 'ОТКРЫВАЮ…' : `Открыть запись · +${entry.category === 'НОВАЯ ЗОНА' ? '50' : '20'} XP`}</button></> : <p>{entry.id === 'zone-ver-ix' ? 'Прочитай все открытые записи — и сопоставь их свидетельства.' : 'Изучи досье связанной фракции, чтобы обнаружить ключевое слово.'}</p>}
      </article>)}</div>
    </section>

    {zone?.read && <p className="archive-lore-note">Заметка о VER-IX — авторский сюжет Sector: Vermillion. Упоминание примарха в повреждённом отчёте является частью этой истории, а не официальным каноном Warhammer 40,000.</p>}
    <p className="archive-status" role="status">{message}</p>
  </main>
}
