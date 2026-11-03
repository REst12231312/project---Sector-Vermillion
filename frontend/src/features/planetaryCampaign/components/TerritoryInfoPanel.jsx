import React from 'react'

const controlLabels = { enemy: 'Под контролем противника', contested: 'Оспаривается', player: 'Под контролем Империума' }

const missionTypes = { capture: 'Захват', destroy: 'Уничтожение цели', defend: 'Оборона' }
const missionStates = { locked: 'Заблокирована', available: 'Доступна', in_progress: 'В процессе', completed: 'Завершена' }
function victoryText(mission) {
  const rules = mission.victoryConditions || {}
  if (rules.captureRounds) return `Захватить точку и удерживать ${rules.captureRounds} раунда.`
  if (rules.destroyPrimaryObject) return `Уничтожить основную цель${mission.strategicObjects?.find((item) => item.primary)?.name ? `: ${mission.strategicObjects.find((item) => item.primary).name}` : ''}.`
  if (rules.defendRounds) return `Удержать командный узел ${rules.defendRounds} раундов.`
  return 'Выполнить тактическую задачу операции.'
}

export default function TerritoryInfoPanel({ territory, selectedMission, planet, era, progress, missionById, onLaunch, onReplay, onClose, territories = [], objective, campaignTitle }) {
  if (!territory) {
    const counts = territories.reduce((summary, region) => { summary[region.control] = (summary[region.control] || 0) + 1; return summary }, {})
    const complete = territories.reduce((sum, region) => sum + region.completedCount, 0)
    const total = territories.reduce((sum, region) => sum + region.totalMissions, 0)
    return <aside className="planet-territory-panel is-empty">
      <div><p className="planet-panel-kicker">ПОЛЕВОЕ ДОСЬЕ · КАМПАНИЯ</p><h2>{campaignTitle || era.title}</h2><p className="planet-panel-description">{era.title} · {planet.name} · {era.chronologicalOrder ? `Эпоха ${era.chronologicalOrder}` : 'Историческая кампания'}</p></div>
      <div className="planet-campaign-summary"><div className="planet-summary-total"><b>{territories.length}</b><span>ТЕРРИТОРИЙ В СЕКТОРЕ</span></div><div className="planet-summary-controls"><span><i className="control-enemy"/>Противник <b>{counts.enemy || 0}</b></span><span><i className="control-contested"/>Оспаривается <b>{counts.contested || 0}</b></span><span><i className="control-player"/>Империум <b>{counts.player || 0}</b></span></div><div className="planet-summary-progress"><span>Выполнено операций</span><b>{complete}<small> / {total}</small></b><i><em style={{ width: `${total ? complete / total * 100 : 0}%` }} /></i></div></div>
      <div className="planet-region-value"><span>СТРАТЕГИЧЕСКАЯ ЦЕЛЬ</span><p>{objective || era.description}</p></div>
      <p className="planet-panel-empty">Выберите отмеченную территорию, чтобы открыть её досье и доступные операции.</p>
      <span className="planet-panel-empty-coordinate">КУРСОР · ОЖИДАНИЕ ВЫБОРА</span>
    </aside>
  }
  const bonuses = [...(progress.pendingConsequences || []), ...(progress.activeMissionSetup?.appliedConsequences || []), ...(progress.history || []).flatMap((entry) => entry.appliedConsequences || [])]
  const uniqueBonuses = Array.from(new Map(bonuses.map((bonus) => [bonus.id, bonus])).values())
  const controlLabel = controlLabels[territory.control] || 'Статус неизвестен'
  if (selectedMission) {
    const { mission, status } = selectedMission
    const replayable = status === 'completed'
    return <aside className="planet-territory-panel mission-details-panel" aria-live="polite">
      <div className="planet-panel-title"><div><p className="planet-panel-kicker">ОПЕРАЦИЯ · {territory.name.toUpperCase()}</p><h2>{mission.name}</h2></div><button type="button" onClick={onClose} aria-label="Закрыть панель операции">×</button></div>
      <div className="planet-panel-meta"><span>{era.name} · {planet.name}</span><b className={`mission-state-label state-${status}`}>{missionStates[status]}</b></div>
      <p className="planet-mission-type-line">ТИП ОПЕРАЦИИ <b>{missionTypes[mission.type] || 'Тактическая операция'}</b></p>
      <p className="planet-panel-description">{mission.description}</p>
      <div className="planet-region-value"><span>УСЛОВИЕ ПОБЕДЫ</span><p>{victoryText(mission)}</p></div>
      <div className="planet-region-value"><span>СЕКТОР · КОНТРОЛЬ</span><p>{territory.name} · {controlLabel}</p></div>
      {status === 'locked' ? <p className="planet-region-lock">Операция пока закрыта. Сначала завершите предшествующие задачи сектора.</p> : <button className="planet-launch-operation" type="button" onClick={() => replayable ? onReplay(mission) : onLaunch(mission)}>{replayable ? 'Повторить операцию' : status === 'in_progress' ? 'Продолжить операцию' : 'Начать операцию'} <span>→</span></button>}
    </aside>
  }
  return <aside className="planet-territory-panel" aria-live="polite">
    <div className="planet-panel-title"><div><p className="planet-panel-kicker">ПОЛЕВОЕ ДОСЬЕ · {planet.name.toUpperCase()}</p><h2>{territory.name}</h2></div><button type="button" onClick={onClose} aria-label="Закрыть панель территории">×</button></div>
    <div className="planet-panel-meta"><span>{era.name} · {planet.name}</span><b className={`control-label control-${territory.control}`}><i />{controlLabel}</b></div>
    <p className="planet-panel-description">{territory.description}</p>
    <div className="planet-region-value"><span>СТРАТЕГИЧЕСКОЕ ЗНАЧЕНИЕ</span><p>{territory.strategicValue || territory.description}</p></div>
    <div className="planet-region-progress"><div><span>ОПЕРАЦИОННАЯ СВОДКА</span><b>{territory.completedCount}<small> / {territory.totalMissions}</small></b></div><i><em style={{ width: `${territory.totalMissions ? territory.completedCount / territory.totalMissions * 100 : 0}%` }} /></i></div>
    <div className="planet-sector-operation-count"><span>ОПЕРАЦИЙ В СЕКТОРЕ</span><b>{territory.totalMissions}</b></div>
    <p className="planet-panel-empty">Выберите значок операции на карте, чтобы открыть условия и запуск.</p>
    {uniqueBonuses.length > 0 && <details className="planet-region-bonuses"><summary>Последствия операций <span>{uniqueBonuses.length}</span></summary>{uniqueBonuses.map((bonus) => <p key={bonus.id}>{bonus.description}</p>)}</details>}
  </aside>
}
