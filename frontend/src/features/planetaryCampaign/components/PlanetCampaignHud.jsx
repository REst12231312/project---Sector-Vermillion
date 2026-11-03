import React from 'react'
import { Link } from 'react-router-dom'

export default function PlanetCampaignHud({ planet, era, operation = null, completedMissions, totalMissions, returnPath }) {
  const percent = totalMissions ? Math.round(completedMissions / totalMissions * 100) : 0
  return <header className="planet-command-hud" role="region" aria-label="Сводка планетарной операции">
    <Link to={returnPath} className="planet-hud-return" aria-label="Вернуться к сюжетной карте">← <span>Сюжетная карта</span></Link>
    <div className="planet-hud-identity">
      <span className="planet-hud-sigil" aria-hidden="true"><i>I</i></span>
      <div><p>ПЛАНЕТАРНЫЙ ТЕАТР · ИМПЕРИУМ</p><h1>{planet.name}</h1></div>
    </div>
    <div className="planet-hud-operation">
      <span>АКТИВНАЯ КАМПАНИЯ</span>
      <b>{operation?.title || era.title}</b>
      <small>{era.title} · {planet.name}</small>
    </div>
    <div className="planet-hud-progress" role="group" aria-label="Прогресс обязательных миссий">
      <div><span>МИССИИ</span><b>{completedMissions}<small> / {totalMissions}</small></b></div>
      <i role="progressbar" aria-valuemin="0" aria-valuemax={totalMissions} aria-valuenow={completedMissions} aria-label={`Прогресс операций: ${completedMissions} из ${totalMissions}`}><em style={{ width: `${percent}%` }} /></i>
      <small>{percent}% · СЕКТОРНАЯ КАМПАНИЯ</small>
    </div>
  </header>
}
