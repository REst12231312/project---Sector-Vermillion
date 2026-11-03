import React from 'react'

export default function EraUnlockModal({ planet, era, onEnter, onClose }) {
  if (!era) return null
  return <div className="era-unlock-backdrop" role="presentation">
    <section className="era-unlock-modal" role="dialog" aria-modal="true" aria-labelledby="era-unlock-title">
      <button type="button" className="era-unlock-close" onClick={onClose} aria-label="Закрыть уведомление">×</button>
      <p className="era-kicker">НОВАЯ ИСТОРИЧЕСКАЯ ЭПОХА · {planet.name.toUpperCase()}</p>
      <h2 id="era-unlock-title">{era.title}</h2>
      <p>{era.description}</p>
      <div className="era-unlock-actions"><button type="button" onClick={onEnter}>Перейти к карте эпохи <span>→</span></button><button type="button" onClick={onClose}>Позже</button></div>
    </section>
  </div>
}
