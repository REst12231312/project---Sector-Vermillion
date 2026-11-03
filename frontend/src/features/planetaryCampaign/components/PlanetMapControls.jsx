import React from 'react'

export default function PlanetMapControls({ scale, onZoomIn, onZoomOut, onReset, minScale = 1, maxScale = 3 }) {
  return <div className="planet-map-tools" aria-label="Управление планетарной картой">
    <button type="button" onClick={onZoomIn} disabled={scale >= maxScale} aria-label="Приблизить карту">+</button>
    <button type="button" onClick={onZoomOut} disabled={scale <= minScale} aria-label="Отдалить карту">−</button>
    <span aria-live="polite">{Math.round(scale * 100)}%</span>
    <button type="button" onClick={onReset} aria-label="Сбросить камеру">⌂</button>
  </div>
}
