import React from 'react'
import { Link } from 'react-router-dom'
import { FACTION_IDS, getProgress, getTodayKey } from '../utils/gameProgress'
import { apiRequest } from '../utils/api'

const achievements = [
  { id: 'first-dossier', icon: 'I', name: 'Первый архивариус', description: 'Изучи первое досье' },
  { id: 'first-daily', icon: '✦', name: 'Задание дня', description: 'Выполни ежедневное исследование' },
  { id: 'all-factions', icon: 'IV', name: 'Картограф сектора', description: 'Изучи все четыре фракции' },
  { id: 'quiz-complete', icon: 'IV', name: 'Знаток сектора', description: 'Ответь на все вопросы испытания' },
  { id: 'signal-decoder', icon: '⌘', name: 'Дешифровщик', description: 'Открой засекреченную главу' },
]

export default function PlayerPages() {
  const [progress, setProgress] = React.useState(getProgress)
  const [chapterUnlocked, setChapterUnlocked] = React.useState(false)
  React.useEffect(() => {
    const updateProgress = (event) => setProgress(event.detail)
    window.addEventListener('sv-progress-updated', updateProgress)
    return () => window.removeEventListener('sv-progress-updated', updateProgress)
  }, [])
  React.useEffect(() => { apiRequest('/chapters/locked').then((result) => setChapterUnlocked(result.unlocked)).catch(() => {}) }, [])

  const level = Math.floor(progress.xp / 100) + 1
  const nextLevel = 100 - (progress.xp % 100)
  const missionComplete = progress.dailyMission === getTodayKey()

  return <main className="content-page profile-page">
    <p className="eyebrow">ЛИЧНЫЙ АРХИВ · ДОПУСК {level}</p>
    <section className="profile-card"><div className="profile-avatar">A</div><div><span className="eyebrow">АКОЛИТ СЕКТОРА</span><h1>Архивариус</h1><p>Твой путь в секторе только начинается.</p></div><div className="profile-xp"><b>{progress.xp}</b><span>ОПЫТ</span></div></section>
    <div className="profile-stats"><article><span>УРОВЕНЬ</span><b>{level}</b><small>До следующего уровня: {nextLevel} XP</small></article><article><span>ЗАДАНИЕ ДНЯ</span><b>{missionComplete ? '✓' : '—'}</b><small>{missionComplete ? 'Исследование завершено' : 'Изучи досье новой фракции'}</small></article><article><span>ФРАКЦИИ ИЗУЧЕНЫ</span><b>{progress.studiedFactions.length}/{FACTION_IDS.length}</b><small>Записи личного архива</small></article><article><span>ИСПЫТАНИЕ</span><b>{progress.answeredQuestions.length}/4</b><small>Правильные ответы в архиве</small></article></div>
    <section className="achievement-section"><div className="section-heading"><div><p className="eyebrow">НАГРАДЫ · {progress.achievements.length}/{achievements.length}</p><h2>Достижения</h2></div></div><div className="achievement-grid">{achievements.map((achievement) => { const earned = progress.achievements.includes(achievement.id); return <article className={`achievement-card ${earned ? 'earned' : ''}`} key={achievement.id}><span className="achievement-icon">{achievement.icon}</span><div><h3>{achievement.name}</h3><p>{achievement.description}</p></div><span className="achievement-state">{earned ? 'ПОЛУЧЕНО' : 'ЗАКРЫТО'}</span></article>})}</div></section>
    <section className="profile-mission"><div><p className="eyebrow">КЛАССИФИЦИРОВАННЫЕ ДАННЫЕ</p><h2>{chapterUnlocked ? 'Следующая запись открыта' : 'Сигнал требует расшифровки'}</h2><p>{chapterUnlocked ? 'Продолжение истории уже доступно в архиве сектора.' : 'Собери ключ из трёх фрагментов в полевых конспектах.'}</p></div><Link className="button button-primary" to="/archive/sector-ix">{chapterUnlocked ? 'Читать главу' : 'Искать подсказки'} <span>→</span></Link></section>
    <section className="profile-mission"><div><p className="eyebrow">ТЕКУЩАЯ ЦЕЛЬ</p><h2>{progress.studiedFactions.length === FACTION_IDS.length ? 'Сектор исследован' : 'Продолжить исследование'}</h2><p>{progress.studiedFactions.length === FACTION_IDS.length ? 'Ты изучил все доступные досье.' : `Изучи ещё ${FACTION_IDS.length - progress.studiedFactions.length} ${progress.studiedFactions.length === FACTION_IDS.length - 1 ? 'фракцию' : 'фракции'}, чтобы открыть достижение картографа.`}</p></div><Link className="button button-primary" to={progress.answeredQuestions.length === 4 ? '/factions' : '/quiz'}>{progress.answeredQuestions.length === 4 ? 'К досье' : 'Пройти испытание'} <span>→</span></Link></section>
  </main>
}
