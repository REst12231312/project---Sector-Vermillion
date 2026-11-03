import React from 'react'

const terrainByEra = {
  unification: {
    ridges: [
      'M 164 223 l22-17 13 6 16-21 14 4 18-18 12 8 20-22 13 4 18-16',
      'M 585 170 l18-16 13 7 17-22 13 5 19-18 13 8 17-20 12 6 22-16',
      'M 680 460 l17-14 13 5 19-21 12 8 16-18 14 5 18-17',
      'M 280 526 l14-13 12 5 17-18 14 5 16-18',
      'M 122 332 l17-11 12 5 18-16 12 6 17-13 15 5 14-12',
      'M 365 178 l14-12 10 5 15-17 12 7 17-14 12 4 18-17',
      'M 754 406 l16-15 12 4 17-20 14 6 15-15 14 5 15-18',
      'M 472 566 l15-12 13 5 18-17 14 6 15-16',
    ],
    roads: [
      'M 208 308 C 291 297 359 320 478 229',
      'M 478 229 C 574 241 660 255 774 286',
      'M 500 422 C 466 375 472 310 478 229',
      'M 500 422 C 420 457 334 494 242 539',
      'M 500 422 C 585 390 674 330 774 286',
      'M 208 308 C 240 372 278 418 342 463',
      'M 342 463 C 397 481 445 458 500 422',
      'M 563 197 C 618 222 664 245 710 265',
    ],
    settlements: [
      { id: 'west-works', x: 188, y: 268, label: 'СТАРЫЕ ФАБРИКИ', kind: 'industry' },
      { id: 'merica-ruins', x: 344, y: 352, label: 'РУИНЫ МЕРИКИ', kind: 'ruins' },
      { id: 'northern-holds', x: 563, y: 197, label: 'СЕВЕРНЫЕ УКРЕПЛЕНИЯ', kind: 'fort' },
      { id: 'eastern-ruins', x: 821, y: 347, label: 'ВОСТОЧНЫЙ РУБЕЖ', kind: 'ruins' },
    ],
    craters: [{ x: 292, y: 222, r: 15 }, { x: 642, y: 493, r: 21 }, { x: 845, y: 225, r: 11 }, { x: 193, y: 493, r: 8 }, { x: 733, y: 545, r: 13 }, { x: 383, y: 204, r: 9 }, { x: 881, y: 407, r: 16 }],
  },
  siege: {
    ridges: [
      'M 156 211 l22-12 14 6 17-18 12 7 18-21 13 6 17-17',
      'M 690 191 l17-13 13 5 17-18 13 6 20-21 12 8 18-15',
      'M 761 475 l17-12 12 7 17-17 13 4 17-15',
    ],
    roads: [
      'M 255 268 C 354 251 419 277 505 320',
      'M 505 320 C 576 345 609 399 612 442',
      'M 352 365 C 422 355 460 337 505 320',
      'M 612 442 C 672 405 727 370 790 367',
    ],
    settlements: [
      { id: 'outer-wall', x: 418, y: 194, label: 'ВНЕШНЕЕ КОЛЬЦО', kind: 'fort' },
      { id: 'palace-complex', x: 660, y: 462, label: 'ДВОРЦОВЫЙ КОМПЛЕКС', kind: 'industry' },
      { id: 'breach-zone', x: 500, y: 333, label: 'ПРОЛОМ', kind: 'ruins' },
    ],
    craters: [{ x: 298, y: 438, r: 22 }, { x: 709, y: 238, r: 17 }, { x: 826, y: 463, r: 20 }, { x: 433, y: 516, r: 13 }],
  },
}

function Crater({ x, y, r }) {
  return <g className="terrain-crater" transform={`translate(${x} ${y})`}>
    <circle r={r} /><circle r={r * .68} /><path d={`M ${-r * .8} ${-r * .35} Q 0 ${-r * .75} ${r * .6} ${-r * .3}`} />
  </g>
}

function Settlement({ settlement }) {
  const { x, y, label, kind, id } = settlement
  return <g className={`terrain-settlement settlement-${kind}`} transform={`translate(${x} ${y})`}>
    {kind === 'industry' && <><path d="M-24 10V-4l8 5v-11l9 7v-14l8 11h9v12h8v10h-42z"/><path d="M-15 7v4M-3 5v6M11 4v7"/></>}
    {kind === 'fort' && <><path d="M-23 10V-5l8-8 8 8 7-8 8 8 8-5V10z"/><path d="M-5 10V-1H6v11M-21 3h8M12 3h8"/></>}
    {kind === 'ruins' && <><path d="M-20 10V-3l8-7 7 4 4-9 8 7 10-3 6 8v13z"/><path d="m-8 1 5 4-4 5m13-11-4 5 6 4"/></>}
    <text x="0" y="27" textAnchor="middle">{label}</text>
    <title>{label.toLowerCase()}</title>
    <desc>{id}</desc>
  </g>
}

export default React.memo(function PlanetTerrainLayer({ map, lod = 'detailed' }) {
  const terrain = terrainByEra[map.eraId] || terrainByEra.unification
  return <g className={`planet-geography planet-geography-${map.eraId}`} aria-hidden="true" pointerEvents="none">
    <g className="planet-wasteland"><path d="M93 265Q183 190 271 229t87 91q-42 56-120 44t-145-99Z"/><path d="M626 453q85-72 171-9t27 117q-77 54-155 5t-43-113Z"/><path d="M333 286q67-43 125 8t3 76q-74 27-119-7t-9-77Z"/></g>
    <g className="planet-contours">{map.contours.map((path, index) => <path key={`contour-${index}`} d={path} />)}</g>
    <g className="planet-erosion-lines"><path d="M108 291q49-32 96 1t83 4M120 307q56-28 107 5t63 0M652 490q57-42 108-5t48 33M670 510q50-32 91-1t35 27M358 316q41-22 75 6t39 9M351 333q44-17 78 7t28 11"/></g>
    <g className="planet-mountains">{terrain.ridges.map((path, index) => <g key={`ridge-${index}`}><path d={path} /><path className="mountain-shadow" d={path} transform="translate(0 4)" /></g>)}</g>
    <g className="planet-craters">{terrain.craters.map((crater, index) => <Crater key={`crater-${index}`} {...crater} />)}</g>
    <g className="planet-roads">{terrain.roads.map((path, index) => <path key={`road-${index}`} d={path} />)}</g>
    <g className="planet-fortifications"><path d={map.eraId === 'siege' ? 'M340 242q91-69 174-18t136 131M363 255q83-54 148-9t120 110M422 305l-13 18m44-38-9 21m57-19-5 22m56 2-12 19m52 14-17 15' : 'M423 161q67-35 119-3t77 77M434 174q56-25 97 2t69 63M452 194l-13 18m50-25-6 19m48-8-8 20m41 2-13 15'} /></g>
    <g className={`planet-settlements${lod === 'overview' ? ' is-overview' : ''}`}>{terrain.settlements.map((settlement) => <Settlement key={settlement.id} settlement={settlement} />)}</g>
    <g className="planet-battle-scars"><path d={map.eraId === 'siege' ? 'M 247 284l36 18-11 19 42 23-18 17 33 12M 625 180l-20 24 31 22-18 20 27 19' : 'M 259 187l31 19-13 12 27 16M 648 438l-24 16 26 17-16 20'} /></g>
  </g>
})
