import React from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, postJson } from '../utils/api'
import { applyServerProgress } from '../utils/gameProgress'
import './SealedArchivePage.css'

export default function SealedArchivePage() {
  const [notes, setNotes] = React.useState([])
  const [chapter, setChapter] = React.useState(null)
  const [unlocked, setUnlocked] = React.useState(false)
  const [answer, setAnswer] = React.useState('')
  const [message, setMessage] = React.useState('Загружаю архивные фрагменты…')

  React.useEffect(() => {
    Promise.all([apiRequest('/notes'), apiRequest('/chapters/locked')])
      .then(([archiveNotes, access]) => {
        setNotes(archiveNotes)
        setChapter(access.chapter)
        setUnlocked(access.unlocked)
        setMessage(archiveNotes.length === 3 ? 'Собери пароль из фрагментов в порядке их номеров.' : `Фрагменты появляются после изучения связанных досье: Империум, Орки и Хаос. Найдено ${archiveNotes.length}/3.`)
      })
      .catch(() => setMessage('Сервер архива недоступен. Запусти API командой npm run server.'))
  }, [])

  async function decode(event) {
    event.preventDefault()
    setMessage('Проверяю шифр…')
    try {
      const result = await postJson('/chapters/locked/decode', { answer })
      setChapter(result.chapter)
      setUnlocked(true)
      if (result.progress) applyServerProgress(result.progress)
      setMessage('Допуск подтверждён. В архив внесено +75 XP.')
    } catch (error) { setMessage(error.message) }
  }

  return <main className="content-page sealed-page">
    <Link className="back-link" to="/profile">← Вернуться в личный архив</Link>
    <p className="eyebrow">СЕКТОР VER-IX · ХРАНИЛИЩЕ КЛАССИФИЦИРОВАННЫХ ДАННЫХ</p>
    <h1>Зашифрованный сигнал</h1>
    <p className="hero-lead">Следующая глава закрыта шифром. Ищи подсказки в найденных конспектах и сопоставь фрагменты по порядку.</p>
    <section className="sealed-notes"><div className="section-heading"><div><p className="eyebrow">ПОЛЕВЫЕ МАТЕРИАЛЫ</p><h2>Найденные конспекты</h2></div><span className="sealed-count">{notes.length} ФРАГМЕНТА</span></div>
      {notes.length ? <div className="note-grid">{notes.map((note, index) => <article className="field-note" key={note.id}><span className="note-index">ФРАГМЕНТ · {note.id.slice(-2).toUpperCase()}</span><h3>{note.title}</h3><p>{note.text}</p></article>)}</div> : <p className="archive-status">{message}</p>}
    </section>
    {!unlocked ? <form className="decode-panel" onSubmit={decode}><div><span className="eyebrow">ПРОТОКОЛ ДОСТУПА</span><h2>Введи ключ расшифровки</h2><p>Соедини три фрагмента из уже изученных досье.</p></div><div className="decode-controls"><input aria-label="Ключ расшифровки" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="КОД ДОСТУПА" autoComplete="off"/><button className="button button-primary" type="submit" disabled={notes.length < 3}>Проверить код <span>→</span></button></div><span className="archive-status" role="status">{message}</span></form> : <section className="decoded-chapter"><p className="eyebrow">ДОПУСК ОТКРЫТ · {chapter?.id}</p><h2>{chapter?.title}</h2><p>{chapter?.body}</p><Link className="button button-outline" to="/profile">К наградам архива <span>→</span></Link></section>}
  </main>
}
