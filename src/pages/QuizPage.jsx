import React from 'react'
import { Link } from 'react-router-dom'
import { getProgress, QUIZ_IDS, submitQuizAnswer } from '../utils/gameProgress'
import './QuizPage.css'

const questions = [
  { id: 'sector-1', prompt: "На какой окраине галактики расположена Империя Т'ау?", options: ['На восточной', 'На западной', 'В центре Терры'], answer: 0 },
  { id: 'sector-2', prompt: 'Что такое Варп в материалах о силах Хаоса?', options: ['Имматериум — источник демонов и сил Хаоса', 'Столичный мир Империума', 'Каста инженеров Т\'ау'], answer: 0 },
  { id: 'sector-3', prompt: 'Как называется общий боевой порыв орков?', options: ['Высшее Благо', 'Waaagh!', 'Великий поход'], answer: 1 },
  { id: 'sector-4', prompt: "Какая каста Т'ау отвечает за переговоры?", options: ['Огненная', 'Земная', 'Водная'], answer: 2 },
]

export default function QuizPage() {
  const [progress, setProgress] = React.useState(getProgress)
  const [choice, setChoice] = React.useState(null)
  const [feedback, setFeedback] = React.useState('')
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])

  const answered = progress.answeredQuestions.length
  const current = questions.find((question) => !progress.answeredQuestions.includes(question.id))

  function submit() {
    if (!current || choice === null) return
    if (choice !== current.answer) {
      setFeedback('Ответ неверный. Перечитай досье и попробуй ещё раз.')
      return
    }
    submitQuizAnswer(current.id)
    setChoice(null)
    setFeedback('Верно. Архив пополнен: +15 XP.')
  }

  return <main className="content-page quiz-page">
    <Link className="back-link" to="/">← Вернуться в сектор</Link>
    <p className="eyebrow">ПОЛЕВОЕ ИСПЫТАНИЕ · АРХИВАРИУС</p>
    <h1>Проверка знаний</h1>
    <p className="hero-lead">Ответь на вопросы по досье фракций. За каждый новый правильный ответ начисляется 15 XP, за полное испытание — бонус 50 XP.</p>
    <div className="quiz-progress"><div><span>АРХИВ ПОПОЛНЕН</span><b>{answered}/{QUIZ_IDS.length}</b></div><div className="quiz-progress-track"><span style={{ width: `${(answered / QUIZ_IDS.length) * 100}%` }} /></div></div>
    {current ? <section className="quiz-card"><span className="eyebrow">ВОПРОС {answered + 1} ИЗ {questions.length}</span><h2>{current.prompt}</h2><div className="quiz-options">{current.options.map((option, index) => <button className={`quiz-option ${choice === index ? 'selected' : ''}`} onClick={() => { setChoice(index); setFeedback('') }} key={option}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div><div className="quiz-actions"><span className="quiz-feedback" role="status">{feedback}</span><button className="button button-primary" onClick={submit} disabled={choice === null}>Проверить ответ <span>→</span></button></div></section> : <section className="quiz-card quiz-complete"><div className="mission-icon">✦</div><p className="eyebrow">ИСПЫТАНИЕ ЗАВЕРШЕНО</p><h2>Досье сектора усвоены</h2><p>Ты ответил на все вопросы и получил бонус за завершение. Продолжай исследовать архив.</p><Link className="button button-primary" to="/profile">Открыть награды <span>→</span></Link></section>}
  </main>
}
