import React from 'react'
import FrontlineOverlay from './FrontlineOverlay'
import PlanetTerrainLayer from './PlanetTerrainLayer'
import PlanetTerritoryLayer from './PlanetTerritoryLayer'
import StrategicObjectsLayer from './StrategicObjectsLayer'
import PlanetMapLabelsLayer from './PlanetMapLabelsLayer'
import MapOperationsLayer from './MapOperationsLayer'
import { getPlanetMapTheme } from '../data/planetMapThemes'

function PlanetMap({ map, territories, frontlines, selectedId, selectedMissionId, hoveredId, onSelectTerritory, onSelectMission, onHoverTerritory, guardClick, onMapBackgroundClick, camera, isPanning, onPointerDown, onPointerMove, onPointerUp, factionId = 'imperium' }) {
  const theme = getPlanetMapTheme(map.planetId, map.eraId, factionId)
  const idPrefix = map.id.replace(/[^a-z0-9-]/gi, '-')
  const lod = camera.scale < 1.15 ? 'overview' : 'detailed'
  return <svg style={theme.style} className={`planet-map-svg campaign-strategy-map planet-map-theme-${theme.id}${camera.scale > 1 ? ' is-zoomed' : ''}${isPanning ? ' is-panning' : ''}`} viewBox={`0 0 ${map.viewBox.width} ${map.viewBox.height}`} role="group" aria-label={`Планетарная карта: ${map.planetId}`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onClick={(event) => guardClick(() => onMapBackgroundClick(event), event)}>
    <defs>
      <clipPath id={`${idPrefix}-surface-clip`}><rect width={map.viewBox.width} height={map.viewBox.height} /></clipPath>
      <pattern id={`${idPrefix}-grid`} width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="var(--map-grid)" strokeOpacity=".08" strokeWidth=".7" /></pattern>
      <pattern id={`${idPrefix}-planet-grain`} width="18" height="18" patternUnits="userSpaceOnUse"><path d="M2 3h1M12 7h1M7 15h1M16 17h.7" stroke="var(--map-relief)" strokeOpacity=".2" strokeWidth="1" /></pattern>
      <pattern id={`${idPrefix}-enemy-hatch`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V9" stroke="var(--control-enemy-pattern)" strokeOpacity=".38" strokeWidth="1" /></pattern>
      <pattern id={`${idPrefix}-contested-hatch`} width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 0 10 10M10 0 0 10" stroke="var(--control-contested-pattern)" strokeOpacity=".35" strokeWidth=".8" /></pattern>
      <pattern id={`${idPrefix}-player-hatch`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 0V10" stroke="var(--control-player-pattern)" strokeOpacity=".36" strokeWidth="1.1" /></pattern>
      <marker id={`${idPrefix}-front-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" /></marker>
    </defs>
    <rect width={map.viewBox.width} height={map.viewBox.height} className="planet-map-space" />
    <g className="planet-map-scene" data-lod={lod} transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}>
      <rect width={map.viewBox.width} height={map.viewBox.height} className="planet-surface" />
      <g clipPath={`url(#${idPrefix}-surface-clip)`}>
        <g className="campaign-map-terrain-base" aria-hidden="true"><path d="M0 0H1000V700H0Z"/><path d="M0 136 182 95 316 123 459 72 612 101 745 66 1000 115V0H0Z"/><path d="M0 600 148 555 271 597 433 562 584 619 747 571 1000 625V700H0Z"/></g>
        <rect width={map.viewBox.width} height={map.viewBox.height} fill={`url(#${idPrefix}-grid)`} />
        <PlanetTerrainLayer map={map} lod={lod} />
        <PlanetTerritoryLayer territories={territories} selectedId={selectedId} hoveredId={hoveredId} onSelectTerritory={onSelectTerritory} onHoverTerritory={onHoverTerritory} guardClick={guardClick} idPrefix={idPrefix} />
        <PlanetMapLabelsLayer map={map} territories={territories} selectedId={selectedId} hoveredId={hoveredId} lod={lod} landmarks={theme.landmarks} />
        <FrontlineOverlay segments={frontlines} markerId={`${idPrefix}-front-arrow`} />
        <StrategicObjectsLayer territories={territories} selectedId={selectedId} onSelectTerritory={onSelectTerritory} />
        <MapOperationsLayer eraId={map.eraId} territories={territories} selectedMissionId={selectedMissionId} onSelectMission={onSelectMission} guardClick={guardClick} />
        <path className="campaign-map-boundary" d="M24 44H976V656H24Z" />
      </g>
      <g className="planet-map-coordinate" aria-hidden="true"><text x="38" y="35">TERRA · {theme.label} · M31</text><text x="820" y="682">СТРАТЕГИЧЕСКАЯ СХЕМА</text></g>
    </g>
  </svg>
}

export default React.memo(PlanetMap)
