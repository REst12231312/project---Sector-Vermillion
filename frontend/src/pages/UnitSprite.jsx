import React from 'react'

const factionColor = { imperium: '#d69a67', chaos: '#d1849a', orks: '#a9c977', tau: '#82c7d8' }

export default function UnitSprite({ unitId = 'unit', faction, type, selected = false, attacking = false, hit = false, destroyed = false }) {
  const chaos = faction === 'chaos'
  const orks = faction === 'orks'
  const tau = faction === 'tau'
  const heavy = type.includes('terminator') || type === 'nob' || type === 'crisis-suit'
  const scout = type === 'scout' || type === 'havoc' || type === 'pathfinder'
  const color = factionColor[faction] || factionColor.imperium
  const gradientId = `armor-${String(unitId).replace(/[^a-z0-9_-]/gi, '-')}`
  return <svg className={`unit-sprite ${selected ? 'is-selected' : ''} ${attacking ? 'is-attacking' : ''} ${hit ? 'is-hit' : ''} ${destroyed ? 'is-destroyed' : ''}`} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <defs><linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1"><stop stopColor={color} /><stop offset="1" stopColor="#342b25" /></linearGradient></defs>
    <ellipse cx="24" cy="43" rx="17" ry="3" fill="#070907" opacity=".72" />
    <path d={heavy ? 'M10 16 7 10 15 11 19 15M38 16l3-6-8 1-3 9' : 'M12 18 9 14 16 14M36 18l3-4-7 0'} fill={chaos ? '#402739' : `url(#${gradientId})`} stroke={color} strokeWidth="1.4" />
    <path d={scout ? 'M18 28 14 41h7l4-9 3 9h7l-3-14z' : 'M16 27 13 41h8l3-9 4 9h8l-4-15z'} fill={`url(#${gradientId})`} stroke="#201e19" strokeWidth="1" />
    <path d={heavy ? 'M17 17 30 15l5 5-2 9-8 4-9-5-2-7z' : 'M18 18 30 17l4 5-2 8-7 3-8-4-1-6z'} fill={`url(#${gradientId})`} stroke={color} strokeWidth="1.5" />
    <path d="M18 18 12 21l-2 7 5 2 4-5M31 18l5 2 3 7-4 2-4-5" fill={orks ? '#546537' : chaos ? '#5b394e' : '#313b3b'} stroke={color} strokeWidth="1.3" />
    <path d="M19 11 22 6h7l4 5-2 7-5 3-6-4z" fill={tau ? '#477382' : chaos ? '#593e54' : '#4a4b43'} stroke={color} strokeWidth="1.5" />
    <path d={orks ? 'm19 12-4-5 6 2m11 3 4-5-6 2' : chaos ? 'm20 10-4-7 7 5m7 2 4-7-7 5' : tau ? 'M18 12h3m8 0h3' : 'M19 13h11'} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d={tau ? 'M22 14h7' : orks ? 'M22 14h5l-2 2h-4' : 'M21 14h7'} fill="none" stroke={tau ? '#dcfaff' : '#f0d59a'} strokeWidth="1.4" />
    {chaos && <path d="M23 22 20 27l4-1-1 4 5-6-4 1 2-3z" fill="#cf6682" />}
    {tau && <path d="M14 20 7 19l4 4-2 4 7-3m18-4 7-1-4 4 2 4-7-3" fill="#6bb5ca" stroke="#9addf0" strokeWidth="1" />}
    {orks && <path d="m20 25 3 2m5-2-3 2m-2 1 3 1" fill="none" stroke="#eee8c4" strokeWidth="1.4" />}
    <path d={scout ? 'M34 19 39 12l2 1-3 10' : 'M34 21 41 15l2 1-5 11'} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M36 19 42 14" stroke="#d8d3bd" strokeWidth="1" />
    {selected && <circle cx="24" cy="23" r="21" fill="none" stroke="#f4d179" strokeWidth="1.2" strokeDasharray="3 2" />}
  </svg>
}
