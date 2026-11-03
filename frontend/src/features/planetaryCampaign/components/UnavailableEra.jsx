import React from 'react'
import { Link } from 'react-router-dom'
import { planetById } from '../data/planets'

export default function UnavailableEra({ planetId, message = 'Продолжайте прохождение открытой исторической эпохи, чтобы получить доступ к другим материалам.' }) {
  const planet = planetById[planetId] || planetById.terra
  return <main className="planet-era-unavailable">
    <p className="era-kicker">ДОСТУП К КАМПАНИИ ОГРАНИЧЕН</p>
    <h1>Эта кампания пока недоступна</h1>
    <p>{message}</p>
    <Link to={`/planets/${planet.id}/eras/${planet.defaultEraId}`}>Вернуться к доступной кампании <span>→</span></Link>
  </main>
}
