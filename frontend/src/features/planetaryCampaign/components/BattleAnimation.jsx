import React from 'react'

const eventLabels = {
  round_started: 'Боевой такт начался', unit_moved: 'Подразделение перемещается', movement_blocked: 'Перемещение остановлено', movement_collision: 'Столкновение за клетку',
  unit_defending: 'Подразделение держит оборону', unit_held: 'Подразделение удерживает позицию', attack_performed: 'Атака', attack_blocked: 'Атака не прошла', damage_dealt: 'Получен урон', unit_destroyed: 'Подразделение уничтожено',
  round_finished: 'Раунд завершён', battle_finished: 'Бой завершён',
}

export default function BattleAnimation({ activeEvent, onSkip }) {
  return <section className="tactical-animation-bar" role="status" aria-live="polite">
    <div><p className="tactical-card-kicker">ИДЁТ ВЫПОЛНЕНИЕ</p><b>{eventLabels[activeEvent?.type] || 'Обработка событий раунда'}</b></div>
    <button type="button" onClick={onSkip}>Пропустить анимацию</button>
  </section>
}
