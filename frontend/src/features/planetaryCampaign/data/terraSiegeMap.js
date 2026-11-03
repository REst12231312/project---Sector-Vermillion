export const terraSiegeMap = {
  id: 'terra-siege', planetId: 'terra', eraId: 'siege', viewBox: { width: 1000, height: 700 },
  surfacePath: 'M 500 10 C 765 10 980 164 980 355 C 980 546 765 700 500 700 C 235 700 20 546 20 355 C 20 164 235 10 500 10 Z',
  contours: [
    'M 149 242 C 264 190 362 206 469 240 S 684 272 842 225',
    'M 104 370 C 234 316 348 354 458 391 S 680 425 885 351',
    'M 178 486 C 290 432 392 468 506 511 S 699 510 817 461',
    'M 311 113 C 354 219 331 317 292 405 S 306 520 378 605',
    'M 574 94 C 529 209 564 294 613 373 S 623 504 568 604',
    'M 781 158 C 709 248 731 326 786 391 S 800 468 755 526',
  ],
  regions: [
    { id: 'terra-siege-outer-palace', territoryId: 'terra-siege-outer-palace', name: 'Внешние рубежи дворца', description: 'Разрушенные стены и огневые позиции внешнего кольца обороны.', path: 'M 285 154 L 504 119 L 620 241 L 559 386 L 352 365 L 241 257 Z', center: { x: 420, y: 257 }, neighbors: ['terra-siege-inner-defenses'], borders: { 'terra-siege-inner-defenses': 'M 559 386 L 352 365' }, defaultControl: 'contested', objects: [{ id: 'siege-battery-line', type: 'artillery', name: 'Орудия дворцовой стены', x: 453, y: 217 }, { id: 'siege-breach-gate', type: 'fortress', name: 'Пробитые внешние ворота', x: 509, y: 322 }] },
    { id: 'terra-siege-inner-defenses', territoryId: 'terra-siege-inner-defenses', name: 'Внутренний периметр', description: 'Последние укрепления между предательскими войсками и Императорским дворцом.', path: 'M 352 365 L 559 386 L 620 241 L 761 290 L 817 409 L 704 526 L 497 553 L 367 489 Z', center: { x: 578, y: 441 }, neighbors: ['terra-siege-outer-palace'], borders: { 'terra-siege-outer-palace': 'M 352 365 L 559 386' }, defaultControl: 'player', objects: [{ id: 'siege-palace-command', type: 'command', name: 'Командный узел дворца', x: 612, y: 442 }, { id: 'siege-inner-fort', type: 'fortress', name: 'Внутренняя цитадель', x: 552, y: 493 }] },
  ],
}
