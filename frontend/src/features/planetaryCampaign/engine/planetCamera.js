export const PLANET_CAMERA = { width: 1000, height: 700, minScale: 1, maxScale: 3 }
export function clampPlanetCamera(camera) {
  const scale = Math.min(PLANET_CAMERA.maxScale, Math.max(PLANET_CAMERA.minScale, camera.scale))
  const x = Math.min(0, Math.max(PLANET_CAMERA.width * (1 - scale), camera.x ?? 0))
  const y = Math.min(0, Math.max(PLANET_CAMERA.height * (1 - scale), camera.y ?? 0))
  return {
    scale,
    x: Math.round(x * 1000) / 1000,
    y: Math.round(y * 1000) / 1000,
  }
}

export function zoomPlanetCamera(camera, scale) {
  const nextScale = Math.min(PLANET_CAMERA.maxScale, Math.max(PLANET_CAMERA.minScale, scale))
  const ratio = nextScale / camera.scale
  const centerX = PLANET_CAMERA.width / 2
  const centerY = PLANET_CAMERA.height / 2
  return clampPlanetCamera({
    scale: nextScale,
    x: centerX - (centerX - camera.x) * ratio,
    y: centerY - (centerY - camera.y) * ratio,
  })
}

