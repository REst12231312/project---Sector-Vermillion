import React from 'react'
import { clampPlanetCamera, PLANET_CAMERA, zoomPlanetCamera } from '../engine/planetCamera'

const initialCamera = { x: 0, y: 0, scale: PLANET_CAMERA.minScale }

export default function usePlanetCamera() {
  const [camera, setCamera] = React.useState(initialCamera)
  const [isPanning, setIsPanning] = React.useState(false)
  const frameRef = React.useRef(null)
  const dragRef = React.useRef(null)
  const suppressClickRef = React.useRef(false)
  const clickResetTimerRef = React.useRef(null)

  React.useEffect(() => () => window.clearTimeout(clickResetTimerRef.current), [])

  const zoomBy = React.useCallback((factor) => {
    setCamera((current) => zoomPlanetCamera(current, current.scale * factor))
  }, [])
  const resetCamera = React.useCallback(() => setCamera(initialCamera), [])

  const onPointerDown = React.useCallback((event) => {
    if (camera.scale <= PLANET_CAMERA.minScale || (event.button !== undefined && event.button !== 0)) return
    const bounds = frameRef.current?.getBoundingClientRect()
    if (!bounds?.width || !bounds?.height) return
    const pointerId = event.pointerId ?? 1
    dragRef.current = {
      pointerId,
      startX: Number.isFinite(event.clientX) ? event.clientX : 0,
      startY: Number.isFinite(event.clientY) ? event.clientY : 0,
      startCamera: camera,
      bounds: { width: bounds.width, height: bounds.height },
    }
    try { event.currentTarget.setPointerCapture(pointerId) } catch { /* Pointer capture is unavailable in some test environments. */ }
  }, [camera])

  const onPointerMove = React.useCallback((event) => {
    const drag = dragRef.current
    const pointerId = event.pointerId ?? 1
    if (!drag || drag.pointerId !== pointerId) return
    const clientX = Number.isFinite(event.clientX) ? event.clientX : drag.startX
    const clientY = Number.isFinite(event.clientY) ? event.clientY : drag.startY
    const deltaX = clientX - drag.startX
    const deltaY = clientY - drag.startY
    if (Math.hypot(deltaX, deltaY) < 3 && !suppressClickRef.current) return
    suppressClickRef.current = true
    setIsPanning(true)
    setCamera(clampPlanetCamera({
      scale: drag.startCamera.scale,
      x: drag.startCamera.x + deltaX / drag.bounds.width * PLANET_CAMERA.width,
      y: drag.startCamera.y + deltaY / drag.bounds.height * PLANET_CAMERA.height,
    }))
  }, [])

  const onPointerUp = React.useCallback((event) => {
    const pointerId = event.pointerId ?? 1
    if (dragRef.current?.pointerId === pointerId) dragRef.current = null
    setIsPanning(false)
    if (suppressClickRef.current) {
      window.clearTimeout(clickResetTimerRef.current)
      clickResetTimerRef.current = window.setTimeout(() => { suppressClickRef.current = false }, 0)
    }
  }, [])

  React.useEffect(() => {
    const frame = frameRef.current
    if (!frame) return undefined
    const handleWheel = (event) => {
      event.preventDefault()
      zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12)
    }
    frame.addEventListener('wheel', handleWheel, { passive: false })
    return () => frame.removeEventListener('wheel', handleWheel)
  }, [zoomBy])

  const onMapClick = React.useCallback((callback, ...args) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      window.clearTimeout(clickResetTimerRef.current)
      return
    }
    callback(...args)
  }, [])
  return { camera, frameRef, zoomBy, resetCamera, isPanning, onPointerDown, onPointerMove, onPointerUp, onMapClick }
}
