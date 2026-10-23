import React from 'react'
import { Link } from 'react-router-dom'
import { imperiumRecords } from '../data/imperiumCampaign'
import { chaosRecords } from '../data/chaosCampaign'
import { orksRecords } from '../data/orksCampaign'
import { tauRecords } from '../data/tauCampaign'
import './CampaignGalaxyMap.css'

const imperiumWorlds = [
  { id: 'terra', name: 'Терра', system: 'Солнечная система', region: 'Сегментум Солар', type: 'Мир-трон', x: 470, y: 445, operations: ['imperium-origin', 'great-crusade', 'siege-terra-loyalist', 'scouring-aftermath'], description: 'Колыбель человечества и сердце Империума. Здесь начинались войны за объединение, сюда вернулся Великий крестовый поход и здесь решалась судьба Ереси.' },
  { id: 'luna', name: 'Луна', system: 'Солнечная система', region: 'Сегментум Солар', type: 'Спутник-крепость', x: 530, y: 411, operations: ['great-crusade'], description: 'Ближний рубеж Солнечной системы и опорный пункт первых экспедиционных флотов.' },
  { id: 'mars', name: 'Марс', system: 'Солнечная система', region: 'Сегментум Солар', type: 'Кузница-мир', x: 550, y: 478, operations: ['great-crusade', 'mars-schism'], description: 'Древний мир-кузница и важнейший союзник Терры при создании флота Великого крестового похода. Во время Ереси Хоруса здесь развернулась гражданская война Механикум.' },
  { id: 'caliban', name: 'Калибан', system: 'Система Калибан', region: 'Сегментум Обскурус', type: 'Мир ордена', x: 740, y: 205, operations: ['primarchs'], description: 'Мир, где был найден Лион Эль’Джонсон, примарх I легиона.' },
  { id: 'chthonia', name: 'Хтония', system: 'Система Хтония', region: 'Сегментум Солар', type: 'Шахтёрский мир', x: 646, y: 340, operations: ['primarchs'], description: 'Суровый мир, связанный с юностью Хоруса и его будущим легионом.' },
  { id: 'olympia', name: 'Олимпия', system: 'Система Олимпия', region: 'Сегментум Темпестус', type: 'Мир-крепость', x: 298, y: 576, operations: ['primarchs'], description: 'Родной мир Пертурабо, примарха IV легиона.' },
  { id: 'fenris', name: 'Фенрис', system: 'Система Фенрис', region: 'Сегментум Обскурус', type: 'Смертельный мир', x: 805, y: 343, operations: ['primarchs'], description: 'Ледяной мир, на котором вырос Леман Русс.' },
  { id: 'prospero', name: 'Просперо', system: 'Система Просперо', region: 'Сегментум Обскурус', type: 'Мир-цитадель', x: 867, y: 273, operations: ['primarchs', 'prospero-censure'], description: 'Центр знаний Тысячи Сынов и родной мир Магнуса Красного. Здесь карательная экспедиция Лемана Русса уничтожила Тизку.' },
  { id: 'nocturne', name: 'Ноктюрн', system: 'Система Ноктюрн', region: 'Сегментум Ультима', type: 'Вулканический мир', x: 832, y: 560, operations: ['primarchs'], description: 'Опасный вулканический мир, ставший домом Вулкана и Саламандр.' },
  { id: 'macragge', name: 'Макрагг', system: 'Система Макрагг', region: 'Сегментум Ультима', type: 'Мир-крепость', x: 925, y: 494, operations: ['primarchs'], description: 'Мир Ультрамара, где был найден Робут Жиллиман.' },
  { id: 'baal', name: 'Ваал', system: 'Система Ваал', region: 'Сегментум Ультима', type: 'Пустынный мир', x: 760, y: 685, operations: ['primarchs'], description: 'Суровый родной мир Сангвиния и IX легиона.' },
  { id: 'istvaan-iii', name: 'Исстван III', system: 'Система Исстван', region: 'Сегментум Пацификус', type: 'Мир-улья', x: 215, y: 356, operations: ['istvaan-iii-warning'], description: 'На этом мире лояльные воины узнали о предательстве Хоруса и пережили вирусную бомбардировку.' },
  { id: 'istvaan-v', name: 'Исстван V', system: 'Система Исстван', region: 'Сегментум Пацификус', type: 'Мир высадки', x: 258, y: 408, operations: ['istvaan-v'], description: 'Отдельный мир системы Исстван, место резни в зоне высадки и гибели Ферруса Мануса.' },
  { id: 'calth', name: 'Калт', system: 'Система Калт', region: 'Сегментум Ультима', type: 'Мир Ультрамара', x: 1010, y: 620, operations: ['imperium-calth'], description: 'Мир Ультрамара, атакованный Несущими Слово в начале Теневого крестового похода.' },
  { id: 'davin', name: 'Давин', system: 'Система Давин', region: 'Сегментум Солар', type: 'Мир-улей · демонический мир', x: 580, y: 260, operations: ['imperium-davin'], description: 'Мир, где восстание губернатора и ранение Хоруса привели к вмешательству ложи Змея и падению Воителя.' },
  { id: 'beta-garmon', name: 'Бета-Гармон', system: 'Скопление Гармона', region: 'Сегментум Солар', type: 'Стратегический узел', x: 1090, y: 390, operations: ['beta-garmon'], description: 'Ключевой варп-узел перед Террой и место Титандета — гибели сотен боевых машин в решающей битве.' },
]

const imperiumRegionLabels = [
  { name: 'СЕГМЕНТУМ ОБСКУРУС', x: 780, y: 115 },
  { name: 'СЕГМЕНТУМ СОЛАР', x: 470, y: 292 },
  { name: 'СЕГМЕНТУМ ПАЦИФИКУС', x: 152, y: 278 },
  { name: 'СЕГМЕНТУМ ТЕМПЕСТУС', x: 250, y: 720 },
  { name: 'СЕГМЕНТУМ УЛЬТИМА', x: 955, y: 760 },
  { name: 'ОКО УЖАСА', x: 89, y: 95, variant: 'warp-eye-label' },
]

const imperiumRoutes = [
  ['terra', 'luna'], ['terra', 'mars'], ['terra', 'caliban'], ['terra', 'chthonia'], ['terra', 'olympia'], ['terra', 'fenris'], ['terra', 'prospero'], ['terra', 'nocturne'], ['terra', 'macragge'], ['terra', 'baal'], ['terra', 'davin'], ['davin', 'prospero'], ['prospero', 'mars'], ['terra', 'istvaan-iii'], ['istvaan-iii', 'istvaan-v'], ['terra', 'calth'], ['calth', 'macragge'], ['calth', 'beta-garmon'], ['beta-garmon', 'terra'],
]

const chaosWorlds = [
  { id: 'hive-fringe', name: 'Мир-улей', system: 'Пограничный сектор', region: 'Окраина Империума', type: 'Мир-улей', x: 330, y: 450, operations: ['chaos-whispers'], description: 'Здесь подпольный культ собирает сторонников и готовит первые шаги мятежа.' },
  { id: 'davin', name: 'Давин', system: 'Система Давин', region: 'Сегментум Солар', type: 'Мир-лес', x: 640, y: 360, operations: ['davin-fall'], description: 'Мир, где Хорус был ранен Anathame и попал под влияние ложи Змея.' },
  { id: 'signus-prime', name: 'Сигнус Прайм', system: 'Скопление Сигнус', region: 'Сегментум Ультима', type: 'Демонический мир', x: 1050, y: 675, operations: ['signus-prime'], description: 'Хорус направил сюда Кровавых Ангелов в надежде склонить Сангвиния к Хаосу.' },
  { id: 'istvaan-iii', name: 'Исстван III', system: 'Система Исстван', region: 'Сегментум Пацификус', type: 'Мир-улья', x: 220, y: 345, operations: ['istvaan-betrayal'], description: 'На поверхности этого мира предательские легионы оставили лояльных воинов после высадки.' },
  { id: 'istvaan-v', name: 'Исстван V', system: 'Система Исстван', region: 'Сегментум Пацификус', type: 'Мир высадки', x: 260, y: 400, operations: ['istvaan-betrayal'], description: 'Отдельный мир системы Исстван, место резни в зоне высадки.' },
  { id: 'calth', name: 'Калт', system: 'Система Калт', region: 'Ультрамар', type: 'Мир Ультрамара', x: 980, y: 590, operations: ['chaos-calth'], description: 'Мир Ультрамара, где Несущие Слово нанесли внезапный удар по Ультрамаринам.' },
  { id: 'shadow-crusade', name: 'Ультрамар', system: 'Сектор Ультрамар', region: 'Сегментум Ультима', type: 'Театр войны', x: 1080, y: 490, operations: ['shadow-crusade'], description: 'Лоргар и Ангрон провели здесь Теневой крестовый поход, а Руинный шторм отрезал лояльные миры от Терры.' },
  { id: 'molech', name: 'Молех', system: 'Система Молех', region: 'Сегментум Солар', type: 'Рыцарский мир', x: 740, y: 550, operations: ['molech-campaign'], description: 'Древние врата на Молехе дали Хорусу доступ к силе Варпа.' },
  { id: 'beta-garmon-chaos', name: 'Бета-Гармон', system: 'Скопление Гармона', region: 'Сегментум Солар', type: 'Стратегический узел', x: 670, y: 245, operations: ['beta-garmon-chaos'], description: 'Хорус захватил этот узел и расчистил путь для последнего броска к Терре.' },
  { id: 'terra', name: 'Терра', system: 'Солнечная система', region: 'Сегментум Солар', type: 'Мир-трон', x: 470, y: 445, operations: ['siege-terra'], description: 'Сердце Империума и цель последнего наступления Хоруса.' },
  { id: 'luna', name: 'Луна', system: 'Солнечная система', region: 'Сегментум Солар', type: 'Спутник-крепость', x: 540, y: 405, operations: ['battle-luna'], description: 'Последний рубеж Солнечной системы, через который пытаются прорваться уцелевшие мятежники.' },
  { id: 'eye-of-terror', name: 'Око Ужаса', system: 'Варп-разлом', region: 'Сегментум Обскурус', type: 'Варп-регион', x: 930, y: 180, operations: ['eye-retreat'], description: 'Искажённая область пространства, ставшая убежищем для отступивших предательских легионов.' },
]
const chaosRegionLabels = [
  { name: 'СЕГМЕНТУМ ОБСКУРУС', x: 790, y: 112 }, { name: 'СЕГМЕНТУМ СОЛАР', x: 470, y: 292 },
  { name: 'СЕГМЕНТУМ ПАЦИФИКУС', x: 130, y: 270 }, { name: 'УЛЬТРАМАР', x: 960, y: 735 },
  { name: 'ЗОНА ОЧИЩЕНИЯ', x: 195, y: 705 }, { name: 'ОКО УЖАСА', x: 866, y: 137, variant: 'warp-eye-label' },
]
const chaosRoutes = [['hive-fringe', 'davin'], ['davin', 'signus-prime'], ['signus-prime', 'istvaan-iii'], ['istvaan-iii', 'istvaan-v'], ['istvaan-v', 'calth'], ['calth', 'shadow-crusade'], ['shadow-crusade', 'molech'], ['molech', 'beta-garmon-chaos'], ['beta-garmon-chaos', 'terra'], ['terra', 'luna'], ['luna', 'eye-of-terror'], ['terra', 'eye-of-terror']]

const orksWorlds = [
  { id: 'muster', name: 'Сбор Waaagh!', system: 'Флот орды', region: 'Орочий фронт', type: 'Место сбора орды', x: 250, y: 360, operations: ['orks-gathering'], description: 'Точка, где разрозненные банды объединяются вокруг вожака и выбирают цель для большой драки.' },
  { id: 'ullanor', name: 'Улланор', system: 'Система Улланор', region: 'Сегментум Солар', type: 'Орочья столица', x: 680, y: 390, operations: ['orks-ullanor-gates', 'orks-ullanor-battle', 'orks-beast-arises'], description: 'Центр владений Урлакка Урга и место решающей битвы с войсками Великого крестового похода. Полторы тысячи лет спустя здесь началось восстание нового Зверя.' },
  { id: 'frontier', name: 'Пограничный мир', system: 'Окраина Империума', region: 'Сегментум Ультима', type: 'Зона сборки банды', x: 330, y: 665, operations: ['orks-scattered-warband'], description: 'На окраине галактики новая банда собирается в 41-м тысячелетии и ищет достойного противника.' },
  { id: 'armageddon', name: 'Армагеддон', system: 'Система Армагеддон', region: 'Сегментум Солар', type: 'Мир-улей', x: 980, y: 620, operations: ['orks-armageddon'], description: 'Имперский мир-улей, ставший ареной масштабных войн с ордами Газкулла Траки.' },
  { id: 'octarius', name: 'Октариус', system: 'Сектор Октариус', region: 'Сегментум Ультима', type: 'Зона войны', x: 1040, y: 345, operations: ['orks-octarius'], description: 'Газкулл собрал здесь орды против флота-улья Левиафан и объявил себя победителем.' },
  { id: 'krongar', name: 'Кронгар', system: 'Система Кронгар', region: 'Восточная окраина', type: 'Поле битвы', x: 760, y: 200, operations: ['orks-krongar'], description: 'Место десятидневной схватки Газкулла с Рагнаром Черногривым.' },
]
const orksRegionLabels = [
  { name: 'СЕГМЕНТУМ ОБСКУРУС', x: 760, y: 120 }, { name: 'СЕГМЕНТУМ СОЛАР', x: 530, y: 290 },
  { name: 'ПУТЬ ВЕЛИКОГО ПОХОДА', x: 250, y: 760 }, { name: 'ВОЕННЫЙ ФРОНТ', x: 940, y: 760 },
]
const orksRoutes = [['muster', 'ullanor'], ['ullanor', 'frontier'], ['frontier', 'armageddon'], ['armageddon', 'octarius'], ['octarius', 'krongar']]

const tauWorlds = [
  { id: 'tau-prime', name: 'Т’ау', system: 'Система Т’ау', region: 'Империя Тау', type: 'Родной мир', x: 440, y: 440, operations: ['tau-first-sphere'], description: 'Родной мир молодой державы, откуда начались объединение каст и первые волны экспансии.' },
  { id: 'damocles-gulf', name: 'Залив Дамокла', system: 'Залив Дамокла', region: 'Восточная окраина', type: 'Пограничный регион', x: 190, y: 315, operations: ['tau-damocles'], description: 'Пограничье, где Империя Тау впервые столкнулась с крупной военной экспансией Империума.' },
  { id: 'arkunasha', name: 'Аркунаша', system: 'Система Аркунаша', region: 'Восточная окраина', type: 'Пустынный мир', x: 830, y: 565, operations: ['tau-arkunasha'], description: 'Мир, где Фарсайт возглавил оборону против орочьих банд.' },
  { id: 'farsight-enclaves', name: 'Анклавы Фарсайта', system: 'Восточная окраина', region: 'Независимые анклавы', type: 'Пограничный сектор', x: 770, y: 320, operations: ['tau-farsight-enclaves', 'tau-fifth-sphere'], description: 'Независимые владения О’Шоваха, возникшие после его раскола с Эфирными.' },
  { id: 'agrellan', name: 'Аггреллан', system: 'Система Аггреллан', region: 'Третья сфера', type: 'Имперский мир', x: 590, y: 260, operations: ['tau-agrellan'], description: 'Тау захватили мир во время экспансии, но Империум вернулся с блокадой и армией возмездия.' },
  { id: 'startide-nexus', name: 'Узел Звёздного Прилива', system: 'Варп-переход', region: 'Граница Империи Тау', type: 'Стратегический проход', x: 1035, y: 230, operations: ['tau-fourth-sphere'], description: 'Ключевой проход, через который вернулись уцелевшие корабли Четвёртой сферы.' },
  { id: 'mugulath-bay', name: 'Залив Мугулат', system: 'Залив Мугулат', region: 'Пятая сфера', type: 'Пограничный фронт', x: 1010, y: 650, operations: ['tau-fifth-sphere'], description: 'Регион новой экспансии, где сходятся силы Тау, Империума, орков и Хаоса.' },
  { id: 'vedik', name: 'Ведик', system: 'Система Ведик', region: 'Экспансия Чалнат', type: 'Крепостной мир', x: 210, y: 560, operations: ['tau-chalnath'], description: 'Пятая сфера возвращается в систему Ведик после того, как Сороритас отвоевали её у тайных агентов Тау.' },
  { id: 'cao-quo', name: 'Цао Куо', system: 'Элементал-кластер', region: 'Пятая сфера', type: 'Недавно присоединённый мир', x: 865, y: 450, operations: ['tau-cao-quo'], description: 'На недавно аннексированном мире началось восстание, которым руководит сержант Рапторов Артамакс.' },
]
const tauRegionLabels = [
  { name: 'ИМПЕРИЯ ТАУ', x: 470, y: 295 }, { name: 'ЗАЛИВ ДАМОКЛА', x: 112, y: 255 },
  { name: 'АНКЛАВЫ ФАРСАЙТА', x: 755, y: 165 }, { name: 'ПЯТАЯ СФЕРА', x: 930, y: 760 },
]
const tauRoutes = [['tau-prime', 'damocles-gulf'], ['tau-prime', 'arkunasha'], ['tau-prime', 'farsight-enclaves'], ['farsight-enclaves', 'agrellan'], ['agrellan', 'startide-nexus'], ['farsight-enclaves', 'startide-nexus'], ['farsight-enclaves', 'mugulath-bay'], ['arkunasha', 'mugulath-bay'], ['startide-nexus', 'vedik'], ['mugulath-bay', 'cao-quo'], ['vedik', 'cao-quo']]

const mapConfigs = {
  imperium: { name: 'Империум Человечества', mark: 'I', worldLabel: 'миры Империума', worlds: imperiumWorlds, regions: imperiumRegionLabels, routes: imperiumRoutes, records: imperiumRecords, startWorld: 'terra', scale: 'СОЛ · СХЕМАТИЧЕСКИЙ СЕКТОР' },
  chaos: { name: 'Силы Хаоса', mark: '⛧', worldLabel: 'пути предательских легионов', worlds: chaosWorlds, regions: chaosRegionLabels, routes: chaosRoutes, records: chaosRecords, startWorld: 'terra', scale: 'СХЕМАТИЧЕСКИЙ МАРШРУТ ХОРУСА' },
  orks: { name: 'Орки', mark: 'W', worldLabel: 'фронты орочьей Waaagh!', worlds: orksWorlds, regions: orksRegionLabels, routes: orksRoutes, records: orksRecords, startWorld: 'ullanor', scale: 'СХЕМАТИЧЕСКИЙ ПУТЬ WAAAGH!' },
  tau: { name: 'Империя Тау', mark: 'T', worldLabel: 'миры и фронты Империи Тау', worlds: tauWorlds, regions: tauRegionLabels, routes: tauRoutes, records: tauRecords, startWorld: 'tau-prime', scale: 'СХЕМАТИЧЕСКИЙ ФРОНТИР ТАУ' },
}

const starSeeds = Array.from({ length: 84 }, (_, index) => ({
  x: (index * 197 + 47) % 1200,
  y: (index * 311 + 83) % 860,
  r: index % 11 === 0 ? 1.8 : index % 4 === 0 ? 1.15 : 0.65,
  opacity: 0.24 + ((index * 13) % 60) / 100,
}))

function statusFor(operation, levels, completed) {
  const index = levels.findIndex((item) => item.id === operation.id)
  if (completed.includes(operation.id)) return 'complete'
  return index === 0 || completed.includes(levels[index - 1]?.id) ? 'ready' : 'locked'
}

export default function CampaignGalaxyMap({ faction = 'imperium', levels, completedLevels, onStartOperation }) {
  const mapData = mapConfigs[faction] || mapConfigs.imperium
  const worlds = mapData.worlds
  const mapRoutes = mapData.routes
  const regionLabels = mapData.regions
  const records = mapData.records
  const [selectedPlanetId, setSelectedPlanetId] = React.useState(mapData.startWorld)
  const [selectedOperationId, setSelectedOperationId] = React.useState(null)
  const [filter, setFilter] = React.useState('all')
  const [showRoutes, setShowRoutes] = React.useState(true)
  const [showLabels, setShowLabels] = React.useState(true)
  const [view, setView] = React.useState({ x: 0, y: 0, scale: 1 })
  const [expandedLoreId, setExpandedLoreId] = React.useState(null)
  const mapFrameRef = React.useRef(null)
  const drag = React.useRef(null)
  const pointers = React.useRef(new Map())
  const pinch = React.useRef(null)

  const selectedPlanet = worlds.find((planet) => planet.id === selectedPlanetId) || worlds[0]
  const selectedOperation = levels.find((operation) => operation.id === selectedOperationId)
  const visibleLevels = levels.filter((operation) => filter === 'all' || statusFor(operation, levels, completedLevels) === filter)
  const relatedOperations = selectedPlanet.operations.map((id) => levels.find((operation) => operation.id === id)).filter(Boolean)
  const linkedOperationIds = selectedOperation ? [selectedOperation.id] : selectedPlanet.operations
  const linkedPlanetIds = new Set(worlds.filter((planet) => planet.operations.some((id) => linkedOperationIds.includes(id))).map((planet) => planet.id))

  const resetMap = () => setView({ x: 0, y: 0, scale: 1 })
  const zoom = (factor) => setView((current) => ({ ...current, scale: Math.min(2.5, Math.max(0.75, current.scale * factor)) }))

  React.useEffect(() => {
    setSelectedPlanetId(mapData.startWorld)
    setSelectedOperationId(null)
    setExpandedLoreId(null)
    resetMap()
  }, [faction, mapData.startWorld])

  React.useEffect(() => {
    const mapFrame = mapFrameRef.current
    if (!mapFrame) return undefined
    const handleWheel = (event) => {
      event.preventDefault()
      const factor = event.deltaY < 0 ? 1.12 : 0.89
      setView((current) => ({ ...current, scale: Math.min(2.5, Math.max(0.75, current.scale * factor)) }))
    }
    mapFrame.addEventListener('wheel', handleWheel, { passive: false })
    return () => mapFrame.removeEventListener('wheel', handleWheel)
  }, [])

  function handlePointerDown(event) {
    if (event.target.closest('[data-world]')) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture(event.pointerId)
    if (pointers.current.size === 2) {
      const [first, second] = Array.from(pointers.current.values())
      pinch.current = { distance: Math.hypot(first.x - second.x, first.y - second.y), scale: view.scale }
      drag.current = null
      return
    }
    drag.current = { x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y, pointerId: event.pointerId }
  }

  function handlePointerMove(event) {
    if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pinch.current && pointers.current.size > 1) {
      const [first, second] = Array.from(pointers.current.values())
      const distance = Math.hypot(first.x - second.x, first.y - second.y)
      setView((current) => ({ ...current, scale: Math.min(2.5, Math.max(0.75, pinch.current.scale * distance / pinch.current.distance)) }))
      return
    }
    if (!drag.current || drag.current.pointerId !== event.pointerId) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const scaleX = 1200 / bounds.width
    const scaleY = 860 / bounds.height
    setView((current) => ({ ...current, x: drag.current.viewX + (event.clientX - drag.current.x) * scaleX, y: drag.current.viewY + (event.clientY - drag.current.y) * scaleY }))
  }

  function handlePointerUp(event) {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (drag.current?.pointerId === event.pointerId) drag.current = null
    if (pointers.current.size === 1) {
      const [pointerId, point] = Array.from(pointers.current.entries())[0]
      drag.current = { x: point.x, y: point.y, viewX: view.x, viewY: view.y, pointerId }
    }
  }

  function selectPlanet(planet) {
    const planetOperations = planet.operations
      .map((id) => levels.find((operation) => operation.id === id))
      .filter(Boolean)
    const associatedOperation = planetOperations.find((operation) => statusFor(operation, levels, completedLevels) === 'ready') || planetOperations[0]
    setSelectedPlanetId(planet.id)
    setSelectedOperationId(associatedOperation?.id || null)
    if (associatedOperation && !visibleLevels.some((operation) => operation.id === associatedOperation.id)) setFilter('all')
    setExpandedLoreId(null)
    setView((current) => ({ ...current, x: (600 - planet.x) * current.scale, y: (430 - planet.y) * current.scale }))
  }

  function selectOperation(operation) {
    setSelectedOperationId(operation.id)
    const planet = worlds.find((item) => item.operations.includes(operation.id)) || worlds[0]
    setSelectedPlanetId(planet.id)
    setExpandedLoreId(null)
    setView((current) => ({ ...current, x: (600 - planet.x) * current.scale, y: (430 - planet.y) * current.scale }))
  }

  function renderPlanet(planet) {
    const active = linkedPlanetIds.has(planet.id)
    const selected = selectedPlanet.id === planet.id
    const hasCompletedOperation = planet.operations.some((id) => completedLevels.includes(id))
    return <g
      key={planet.id}
      data-world="true"
      className={`galaxy-world ${active ? 'world-linked' : ''} ${selected ? 'world-selected' : ''}`}
      transform={`translate(${planet.x} ${planet.y})`}
      role="button"
      tabIndex="0"
      aria-label={`${planet.name}, ${planet.region}`}
      onClick={(event) => { event.stopPropagation(); selectPlanet(planet) }}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPlanet(planet) } }}
    >
      <circle className="world-hit-area" r="24" />
      <circle className="world-orbit" r="15" />
      <circle className="world-core" r={planet.id === 'terra' ? 6.5 : 4.2} />
      {hasCompletedOperation && <path className="world-complete-mark" d="M 10 -12 l 3 3 6 -7" />}
      {showLabels && <text className="world-label" x="13" y="-12">{planet.name.toUpperCase()}</text>}
    </g>
  }

  return <section className={`campaign-galaxy faction-${faction}`} aria-label={`Интерактивная карта: ${mapData.name}`}>
    <header className="galaxy-heading">
      <div><p className="eyebrow">СТРАТЕГИЧЕСКИЙ АРХИВ · {mapData.name.toUpperCase()}</p><h2>Галактическая карта</h2><p>Выбери операцию или мир, чтобы изучить ход кампании. Координаты условны и служат навигации по хронике.</p></div>
      <div className="galaxy-progress"><span>ОПЕРАЦИИ ЗАВЕРШЕНЫ</span><b>{completedLevels.filter((id) => levels.some((level) => level.id === id)).length}<small> / {levels.length}</small></b><div><i style={{ width: `${completedLevels.filter((id) => levels.some((level) => level.id === id)).length / levels.length * 100}%` }} /></div></div>
    </header>

    <div className="galaxy-workspace">
      <aside className="galaxy-sidebar" aria-label="Список операций">
        <div className="galaxy-sidebar-title"><span className="galaxy-sigil">{mapData.mark}</span><div><span className="eyebrow">{mapData.name.toUpperCase()}</span><h3>Архив операций</h3></div></div>
        <label className="galaxy-filter">ПОКАЗАТЬ<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Все операции</option><option value="ready">Доступные</option><option value="complete">Завершённые</option><option value="locked">Закрытые</option></select></label>
        <div className="galaxy-operation-list">{visibleLevels.map((operation) => {
          const status = statusFor(operation, levels, completedLevels)
          return <button key={operation.id} className={`galaxy-operation ${selectedOperationId === operation.id ? 'operation-selected' : ''}`} type="button" onClick={() => selectOperation(operation)}>
            <span className={`operation-number operation-${status}`}>{status === 'complete' ? '✓' : status === 'locked' ? '·' : operation.number}</span>
            <span className="operation-copy"><b>{operation.title}</b><small>{operation.subtitle}</small></span>
            <span className={`operation-status status-${status}`}>{status === 'complete' ? 'ГОТОВО' : status === 'ready' ? 'ДОСТУПНА' : 'ЗАКРЫТА'}</span>
          </button>
        })}</div>
        <div className="galaxy-controls-list">
          <label><input type="checkbox" checked={showRoutes} onChange={(event) => setShowRoutes(event.target.checked)} /> Линии маршрутов</label>
          <label><input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} /> Названия миров</label>
          <button type="button" onClick={resetMap}>СБРОСИТЬ ВИД <span>↺</span></button>
        </div>
      </aside>

      <div ref={mapFrameRef} className={`galaxy-map-frame ${faction === 'imperium' ? 'imperial-cartography' : ''}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
        <div className="galaxy-map-caption"><span>{faction === 'imperium' ? 'КАРТОГРАФИЧЕСКИЙ АРХИВ · АДЕПТУС МЕХАНИКУС' : faction === 'chaos' ? 'ВАРП-КАРТОГРАФИЯ · ИСКАЖЁННАЯ РЕАЛЬНОСТЬ' : faction === 'orks' ? 'НАВИГАТОР WAAAGH! · КАРТА БОЕВОГО КОРАБЛЯ' : faction === 'tau' ? 'СИСТЕМА СТРАТЕГИЧЕСКОГО АНАЛИЗА' : 'УЧАСТОК ГАЛАКТИЧЕСКОЙ КАРТЫ'}</span><span>{faction === 'imperium' ? 'СВОД НАВИГАТОРА · М31' : faction === 'chaos' ? 'НЕСТАБИЛЬНАЯ КАРТА · ⸸' : faction === 'orks' ? 'ЦЕЛИ · МАРШРУТЫ НАЛЁТА' : faction === 'tau' ? 'ТАКТИЧЕСКАЯ СЕТЬ · АКТИВНА' : 'СХЕМА · НЕ В МАСШТАБЕ'}</span></div>
        <div className="galaxy-map-tools" aria-label="Масштаб карты"><button type="button" onClick={() => zoom(1.15)} aria-label="Приблизить">+</button><button type="button" onClick={() => zoom(0.87)} aria-label="Отдалить">−</button><button type="button" onClick={resetMap} aria-label="Сбросить масштаб">⌂</button></div>
        <svg className="galaxy-map-svg" viewBox="0 0 1200 860" role="group" aria-label={`Карта: ${mapData.worldLabel}`}>
          <defs>
            <radialGradient id="galaxy-nebula"><stop stopColor="#9c7844" stopOpacity=".2" /><stop offset=".52" stopColor="#665333" stopOpacity=".11" /><stop offset="1" stopColor="#10100d" stopOpacity="0" /></radialGradient>
            <radialGradient id="galaxy-core"><stop stopColor="#e1bd72" stopOpacity=".3" /><stop offset="1" stopColor="#9b7840" stopOpacity="0" /></radialGradient>
            <filter id="galaxy-soft"><feGaussianBlur stdDeviation="24" /></filter>
          </defs>
          <rect width="1200" height="860" fill="#0b0b09" />
          <g className="galaxy-scene" transform={`translate(${view.x} ${view.y}) translate(600 430) scale(${view.scale}) translate(-600 -430)`}>
            <ellipse cx="510" cy="430" rx="515" ry="335" fill="url(#galaxy-nebula)" filter="url(#galaxy-soft)" />
            <ellipse cx="480" cy="444" rx="215" ry="170" fill="url(#galaxy-core)" />
            <g className="galaxy-arms" fill="none" strokeLinecap="round">
              <path d="M476 444 C650 400 875 300 844 165 C808 3 475 36 290 139 C98 247 75 481 215 611 C386 771 751 791 960 638" />
              <path d="M476 444 C325 486 158 609 269 721 C394 846 747 739 909 579 C1081 410 1034 184 839 101 C686 35 570 72 486 119" />
              <path d="M476 444 C523 283 494 112 653 91 C808 69 1018 218 1037 375 C1057 536 876 687 702 722" />
              <path className="galaxy-arm-highlight" d="M476 444 C650 400 875 300 844 165 C808 3 475 36 290 139 C98 247 75 481 215 611" />
            </g>
            {faction === 'imperium' && <g className="imperium-orbital-lines" fill="none">
              <circle cx="470" cy="445" r="58" />
              <circle cx="470" cy="445" r="126" />
              <circle cx="470" cy="445" r="214" />
              <ellipse cx="470" cy="445" rx="302" ry="185" transform="rotate(-27 470 445)" />
              <ellipse cx="470" cy="445" rx="370" ry="246" transform="rotate(22 470 445)" />
              <path d="M470 100v690M126 445h690M227 202l486 486M227 688l486-486" />
              <g className="imperium-orbit-ticks">{Array.from({ length: 36 }, (_, index) => {
                const angle = index * 10 * Math.PI / 180
                const inner = index % 3 === 0 ? 224 : 231
                const outer = 239
                return <line key={index} x1={470 + Math.cos(angle) * inner} y1={445 + Math.sin(angle) * inner} x2={470 + Math.cos(angle) * outer} y2={445 + Math.sin(angle) * outer} />
              })}</g>
            </g>}
            {faction === 'imperium' && <g className="imperium-aquila" transform="translate(1044 138)" aria-hidden="true">
              <path d="M0 0 L-54 -18 -35 0 -68 8 -28 13 -51 28 -14 20 -8 34 0 24 8 34 14 20 51 28 28 13 68 8 35 0 54 -18 0 0Z" />
              <path d="M-7 -2 L0 -13 7 -2 5 12 0 18 -5 12Z" />
              <circle cx="0" cy="1" r="3" />
              <text x="0" y="52" textAnchor="middle">IMPERIAL NAVIS</text>
            </g>}
            {faction === 'chaos' && <g className="chaos-warp-cartography" fill="none" aria-hidden="true">
              <circle className="warp-ring warp-ring-one" cx="476" cy="444" r="74" />
              <circle className="warp-ring warp-ring-two" cx="476" cy="444" r="152" />
              <circle className="warp-ring warp-ring-three" cx="476" cy="444" r="248" />
              <ellipse className="warp-ring warp-ring-ellipse" cx="476" cy="444" rx="355" ry="226" transform="rotate(-31 476 444)" />
              <path className="warp-fracture" d="M476 444 550 388 534 331 602 287 585 224 646 177 629 121 M534 331 492 292 516 255 478 214 493 169 M550 388 621 402 668 367 724 386 781 344 M585 224 664 239 703 204 762 219 810 184 M492 292 412 273 383 224 326 218 297 175 M621 402 619 468 672 508 656 564 713 609 M412 273 370 321 312 306 274 355 219 340 M619 468 553 519 566 577 512 624 529 690" />
              <path className="warp-sigil" d="M1028 186l17-15 17 15-17 16z M1045 170v31m-15-15h30 M1017 225l11-10 11 10-11 10z M1055 233l9-8 9 8-9 8z" />
              <text className="warp-map-mark" x="1045" y="257" textAnchor="middle">WARP · NOCTIS</text>
            </g>}
            {faction === 'orks' && <g className="orks-waaagh-cartography" fill="none" aria-hidden="true">
              <path className="orks-panel-seams" d="M40 82h165l16 14h94m534-20h108l15 14h150M53 772h119l17-13h146m500 21h151l19-16h119M83 120v68m0 470v105m1019-637v80m0 424v87" />
              <path className="orks-coordinate-lines" d="M89 234h112M89 244h75m837-30h103m-103 10h77M245 727h120m-98 10h78m491-20h158m-111 11h72" />
              <path className="orks-advance-route" d="M123 651 272 609 362 642 478 532 618 554 715 438 851 459 1006 313M196 347 325 375 423 333 538 382 656 294 801 319 936 226" />
              <g className="orks-target" transform="translate(1006 313)"><circle r="25"/><circle r="13"/><path d="M-36 0h72M0-36v72M-20-20l40 40m0-40-40 40"/><path d="m-7-7 14 14m0-14L-7 7"/></g>
              <g className="orks-target" transform="translate(936 226)"><circle r="19"/><circle r="8"/><path d="M-29 0h58M0-29v58M-5-5l10 10m0-10L-5 5"/></g>
              <path className="orks-scratched-mark" d="M1060 642l18-34 18 34zm13-9 5-12 5 12zM117 310l15-28 15 28z" />
              <text className="orks-coordinate-label" x="1038" y="362">DA TARGET</text>
              <text className="orks-coordinate-label" x="870" y="193">GO FER IT</text>
              <text className="orks-map-stamp" x="93" y="115">WAAAGH! NAV</text>
            </g>}
            {faction === 'tau' && <g className="tau-strategic-analysis" fill="none" aria-hidden="true">
              <path className="tau-grid-lines" d="M160 150h880M160 270h880M160 390h880M160 510h880M160 630h880M250 110v650M370 110v650M490 110v650M610 110v650M730 110v650M850 110v650M970 110v650" />
              <path className="tau-vector-routes" d="M238 625 373 510 492 510 612 390 732 390 852 270 972 270M250 270 370 390 490 390 610 510 730 510 850 630 970 630" />
              <path className="tau-analysis-frame" d="M82 102h170v55H82zm866 0h170v55H948zm-866 604h170v55H82zm866 0h170v55H948z" />
              <g className="tau-scan-ring" transform="translate(476 444)"><circle r="46"/><circle r="88"/><circle r="134"/><path d="M-152 0h304M0-152v304M-107-107l214 214m0-214-214 214"/><circle r="8" className="tau-scan-core"/></g>
              <g className="tau-data-panel" transform="translate(831 118)">
                <path d="M0 0h192l12 12v69H0zM0 92h204v4H0z"/>
                <text x="10" y="20">SECTOR ANALYSIS</text><text x="10" y="39">VECTOR GRID · 07</text><text x="10" y="59">SIGNAL: NOMINAL</text>
                <path className="tau-signal-bars" d="M142 56v-9m9 9V39m9 17V30m9 26V43m9 13V25m9 31V35"/>
              </g>
              <text className="tau-coordinate" x="174" y="184">AUX-03 / 77.4</text>
              <text className="tau-coordinate" x="877" y="668">VECTOR: OPTIMAL</text>
            </g>}
            <g className="galaxy-sector-lines"><path d="M480 440 L80 210 M480 440 L1080 115 M480 440 L1100 760 M480 440 L150 790 M480 440 L520 48" /></g>
            <g className="galaxy-region-labels">{regionLabels.map((region) => <text key={region.name} className={region.variant || ''} x={region.x} y={region.y}>{region.name}</text>)}</g>
            <g className="galaxy-stars">{starSeeds.map((star, index) => <circle key={index} cx={star.x} cy={star.y} r={star.r} opacity={star.opacity} />)}</g>
            {showRoutes && <g className="galaxy-routes">{mapRoutes.map(([fromId, toId]) => {
              const from = worlds.find((planet) => planet.id === fromId)
              const to = worlds.find((planet) => planet.id === toId)
              if (!from || !to) return null
              const routeActive = linkedPlanetIds.has(fromId) && linkedPlanetIds.has(toId)
              return <line key={`${fromId}-${toId}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={routeActive ? 'route-active' : ''} />
            })}</g>}
            <g className="galaxy-worlds">{worlds.map(renderPlanet)}</g>
          </g>
        </svg>
        <div className="galaxy-map-scale">{mapData.scale}</div>
      </div>

      <aside className="galaxy-detail" aria-live="polite">
        <div className="galaxy-detail-kicker"><span>ДОСЬЕ МИРА</span><span>◇</span></div>
        <div className="planet-illustration" aria-hidden="true"><div className={`planet-disc planet-${selectedPlanet.id}`} /><span className="planet-orbit orbit-one" /><span className="planet-orbit orbit-two" /></div>
        <h3>{selectedPlanet.name.toUpperCase()}</h3>
        <p className="planet-type">{selectedPlanet.type}</p>
        <dl className="planet-facts"><div><dt>СИСТЕМА</dt><dd>{selectedPlanet.system}</dd></div><div><dt>РЕГИОН</dt><dd>{selectedPlanet.region}</dd></div></dl>
        <p className="planet-description">{selectedPlanet.description}</p>
        <div className="planet-related"><p className="eyebrow">СВЯЗАННЫЕ ОПЕРАЦИИ</p>{relatedOperations.map((operation) => {
          const status = statusFor(operation, levels, completedLevels)
          const isExpanded = expandedLoreId === operation.id
          const record = records.find((item) => item.id === operation.id)
          return <div className="planet-related-entry" key={operation.id}>
            <button type="button" className={`planet-related-operation ${selectedOperationId === operation.id ? 'related-selected' : ''}`} onClick={() => selectOperation(operation)}><span>{operation.number}</span><b>{operation.title}</b><small>{status === 'complete' ? 'ЗАВЕРШЕНА' : status === 'ready' ? 'ДОСТУПНА' : 'ЗАКРЫТА'}</small></button>
            {status === 'complete' && record && <div className="planet-related-actions"><button type="button" onClick={() => setExpandedLoreId(isExpanded ? null : operation.id)}>{isExpanded ? 'Свернуть историю' : 'Историческая запись'}</button><Link to={`/archive/${faction}/${operation.id}`}>Полный архив ↗</Link></div>}
            {isExpanded && record && <div className="planet-lore-excerpt">{record.paragraphs.slice(0, 2).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>}
          </div>
        })}</div>
        {selectedOperation && <div className="galaxy-selected-operation"><p className="eyebrow">ОПЕРАЦИЯ {selectedOperation.number}</p><h4>{selectedOperation.title}</h4><p>{selectedOperation.objective}</p>{statusFor(selectedOperation, levels, completedLevels) === 'ready' && <button type="button" className="button button-primary" onClick={() => onStartOperation(selectedOperation.id)}>Перейти к операции <span>→</span></button>}</div>}
      </aside>
    </div>
  </section>
}
