export const terraMap = {
  id: 'terra-unification',
  planetId: 'terra',
  eraId: 'unification',
  viewBox: { width: 1000, height: 700 },
  surfacePath: 'M 500 10 C 765 10 980 164 980 355 C 980 546 765 700 500 700 C 235 700 20 546 20 355 C 20 164 235 10 500 10 Z',
  contours: [
    'M 132 276 C 204 222 278 210 354 224 C 438 239 510 210 591 199 C 690 185 775 220 847 276',
    'M 116 365 C 211 330 285 347 365 378 C 461 415 560 395 638 367 C 737 333 818 354 878 397',
    'M 184 474 C 273 444 335 466 414 500 C 502 539 610 531 696 490 C 757 461 810 452 849 463',
    'M 235 153 C 282 239 283 320 252 398 C 222 472 250 535 304 595',
    'M 501 96 C 475 191 492 274 535 349 C 579 427 572 512 534 607',
    'M 745 123 C 704 220 722 296 774 366 C 819 425 805 480 768 516',
  ],
  regions: [
    { id: 'terra-western-basin', territoryId: 'terra-western-basin', name: 'Западный бассейн', description: 'Промышленные поселения и старые транспортные артерии.', path: 'M 130 150 L 360 120 L 390 300 L 310 430 L 140 420 L 80 280 Z', center: { x: 230, y: 282 }, neighbors: ['terra-northern-front', 'terra-central-plateau', 'terra-southern-expanse'], borders: { 'terra-northern-front': 'M 360 120 L 390 300', 'terra-central-plateau': 'M 390 300 L 310 430', 'terra-southern-expanse': 'M 140 420 L 310 430' }, defaultControl: 'enemy', objects: [{ id: 'west-supply-depot', type: 'supply', name: 'Склад снабжения', x: 208, y: 308 }] },
    { id: 'terra-northern-front', territoryId: 'terra-northern-front', name: 'Северный фронт', description: 'Узел снабжения, артиллерийские позиции и укрепления северного сектора.', path: 'M 360 120 L 590 100 L 650 240 L 570 350 L 390 300 Z', center: { x: 493, y: 222 }, neighbors: ['terra-western-basin', 'terra-eastern-reach', 'terra-central-plateau'], borders: { 'terra-western-basin': 'M 390 300 L 360 120', 'terra-eastern-reach': 'M 590 100 L 650 240', 'terra-central-plateau': 'M 570 350 L 390 300' }, defaultControl: 'enemy', objects: [{ id: 'north-checkpoint', type: 'control', name: 'Узел снабжения', x: 478, y: 229 }, { id: 'north-artillery', type: 'artillery', name: 'Артиллерийская позиция', x: 555, y: 176 }] },
    { id: 'terra-eastern-reach', territoryId: 'terra-eastern-reach', name: 'Восточный предел', description: 'Разрозненные укрепления на пути к восточным перевалам.', path: 'M 590 100 L 830 145 L 900 320 L 700 430 L 570 350 L 650 240 Z', center: { x: 740, y: 268 }, neighbors: ['terra-northern-front', 'terra-central-plateau'], borders: { 'terra-northern-front': 'M 650 240 L 590 100', 'terra-central-plateau': 'M 700 430 L 570 350' }, defaultControl: 'enemy', objects: [{ id: 'east-fort', type: 'fortress', name: 'Пограничное укрепление', x: 774, y: 286 }] },
    { id: 'terra-central-plateau', territoryId: 'terra-central-plateau', name: 'Центральное плато', description: 'Перекрёсток снабжения между северными и южными провинциями.', path: 'M 390 300 L 570 350 L 700 430 L 610 560 L 390 520 L 310 430 Z', center: { x: 500, y: 431 }, neighbors: ['terra-western-basin', 'terra-northern-front', 'terra-eastern-reach', 'terra-southern-expanse'], borders: { 'terra-western-basin': 'M 310 430 L 390 300', 'terra-northern-front': 'M 390 300 L 570 350', 'terra-eastern-reach': 'M 570 350 L 700 430', 'terra-southern-expanse': 'M 310 430 L 390 520' }, defaultControl: 'enemy', objects: [{ id: 'central-command', type: 'command', name: 'Командный пункт', x: 500, y: 422 }] },
    { id: 'terra-southern-expanse', territoryId: 'terra-southern-expanse', name: 'Южные пространства', description: 'Редко населённые земли за границей укреплённой центральной зоны.', path: 'M 140 420 L 310 430 L 390 520 L 330 640 L 145 570 L 90 500 Z', center: { x: 243, y: 512 }, neighbors: ['terra-western-basin', 'terra-central-plateau'], borders: { 'terra-western-basin': 'M 310 430 L 140 420', 'terra-central-plateau': 'M 390 520 L 310 430' }, defaultControl: 'enemy', objects: [{ id: 'south-fallback-point', type: 'control', name: 'Рубежная контрольная точка', x: 242, y: 539 }] },
  ],
}
