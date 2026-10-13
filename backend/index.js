import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto'
import { promisify } from 'node:util'

const app = express()
const port = Number(process.env.PORT || 4000)
const here = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(here, 'data', 'progress.json')
const usersPath = path.join(here, 'data', 'users.json')
const secretPath = path.join(here, 'data', 'auth-secret')
const scrypt = promisify(scryptCallback)
fs.mkdirSync(path.dirname(secretPath), { recursive: true })
if (!fs.existsSync(secretPath)) fs.writeFileSync(secretPath, randomBytes(48).toString('hex'), { flag: 'wx' })
const authSecret = fs.readFileSync(secretPath, 'utf8').trim()
const factionIds = ['imperium', 'orks', 'chaos', 'tau']
const quizAnswers = { 'sector-1': 0, 'sector-2': 0, 'sector-3': 1, 'sector-4': 2 }
const factionFragments = {
  imperium: [
    ['neophyte-record', 'НЕОФИТ', 'Новобранец, проходящий начальное посвящение в ордене.', 'Рекрут из пепельных доков', 'В журнале гарнизона новичок спасён после боя у доков. На его броне нашли знак сломанного маяка и координаты подземного сигнала.'],
    ['imperium-astartes', 'АСТАРТЕС', 'Космический десантник, созданный для войны.', 'Следы геносемени', 'В медицинском отсеке обнаружены пустые ампулы и отметка о визите генетических хирургов. Свидетель называет их братьями в броне.'],
    ['imperium-commissar', 'КОМИССАР', 'Имперский офицер, отвечающий за дисциплину и боевой дух.', 'Приказ без подписи', 'Приказ удерживать доки подписан комиссаром, но его печать поставлена уже после эвакуации. Время документа не совпадает с журналом связи.'],
    ['imperium-astropath', 'АСТРОПАТ', 'Псайкер, передающий сообщения через варп.', 'Голос за пределами эфира', 'Астропат принял повторяющийся сигнал до того, как маяк включился. В записи слышен второй голос, произносящий координаты.'],
    ['imperium-inquisition', 'ИНКВИЗИЦИЯ', 'Орган, расследующий угрозы Империуму.', 'Печать на опечатанной двери', 'На двери хранилища найдена печать тайного ведомства. Её пытались снять, но воск оказался холодным и не повреждённым.'],
    ['imperium-hive', 'УЛЕЙ', 'Гигантский многоуровневый город-муравейник.', 'Город под пеплом', 'Карта показывает, что доки связаны с нижними ярусами улья. На старой схеме отмечен ход, которого нет в актуальном реестре.'],
    ['imperium-vox', 'ВОКС', 'Система дальней радиосвязи Империума.', 'Тринадцать секунд тишины', 'Вокс-сеть замолкает ровно на тринадцать секунд перед каждым появлением сигнала. Затем передаётся команда об эвакуации.'],
    ['imperium-aquila', 'АКВИЛА', 'Двуглавый орёл — знак Империума.', 'Осколок знамени', 'На обломке знамени сохранилась половина аквилы. Под металлом выгравировано имя корабля, официально пропавшего столетия назад.'],
    ['imperium-forge', 'КУЗНЯ', 'Промышленный комплекс или мир производства.', 'Цех, которого нет', 'В производственном журнале фигурирует закрытая кузня. Её оборудование продолжало потреблять энергию после официальной консервации.'],
    ['imperium-guard', 'ГВАРДИЯ', 'Имперская гвардия — многочисленные регулярные войска.', 'Последний расчёт', 'Гвардейский расчёт покинул позицию, оставив оружие заряженным. На стене нашли схему маяка с пометкой «не отключать».'],
  ],
  orks: [
    ['waaagh-report', 'ВААГХ!', 'Орочий боевой клич и общее состояние военного разгула.', 'Битва у Красного маяка', 'Орочий налёт сорвал эвакуацию с доков. На карте боя отмечен Красный маяк; после отступления налётчиков тот продолжил передавать сигнал.'],
    ['orks-boss', 'ВАРБОСС', 'Сильнейший вождь, ведущий орков в бой.', 'Кто собрал стаю', 'На броне убитого предводителя выцарапаны координаты маяка. Орки спорят, кто станет новым вождём, но все смотрят в одну сторону.'],
    ['orks-gretchin', 'ГРЕТЧИН', 'Мелкий оркоподобный прислужник и разведчик.', 'Свидетель из вентиляции', 'Пленный мелкий разведчик утверждает, что пробрался в доки раньше налёта и слышал из-под земли «громкий железный сон».'],
    ['orks-squig', 'Сквиг', 'Разнообразные агрессивные существа, связанные с орками.', 'Следы когтей', 'Неизвестный зверь прогрыз кабель маяка, но оставил его питание целым. Следы ведут к заваленному проходу.'],
    ['orks-loota', 'ЛУТАЗ', 'Орк, специализирующийся на сборе трофейного оружия.', 'Трофейная катушка', 'Лутаз снял с маяка медную катушку и принял её за украшение. После этого его оружие стало повторять перехваченный сигнал.'],
    ['orks-trukk', 'ТРАКК', 'Орочья боевая машина, собранная из металлолома.', 'Маршрут на обломках', 'На борту разбитого тракка нарисован маршрут к башне. Машина не могла проехать по этому пути: там нет дороги.'],
    ['orks-clan', 'КЛАН', 'Орочье объединение со своими обычаями и стилем боя.', 'Цвета на стене', 'Разные орочьи метки указывают на несколько кланов, временно державшихся вместе. Их символы повторяют форму сигнальной антенны.'],
    ['orks-gargant', 'ГАРГАНТ', 'Гигантская шагающая боевая машина орков.', 'Тень титана', 'Разведчик докладывает о громаде за пепельным хребтом. На снимке видны лишь ноги, но тень падает против направления света.'],
    ['orks-battlewagon', 'БАТТЛ-ВАГОН', 'Тяжёлый транспорт орков, превращённый в боевую машину.', 'Пробитая броня', 'В броне найден снаряд имперского образца. Он пробил машину изнутри, хотя экипаж клянётся, что не открывал огонь.'],
    ['orks-mek', 'МЕК', 'Орк-механик, создающий грубую, но работающую технику.', 'Ремонт невозможного', 'Мек починил передатчик, просто ударив по корпусу. После ремонта прибор начал отвечать на команды, которых никто не отправлял.'],
  ],
  chaos: [
    ['warp-echo', 'ВАРП', 'Имматериум — измерение психической энергии и опасных сущностей.', 'Шёпот под руинами', 'В подземном храме культисты описывают разлом в варпе. Они пришли к маяку, чтобы не дать кому-то выйти из камеры; внизу указана координата VER-IX.'],
    ['chaos-cult', 'КУЛЬТ', 'Тайное сообщество, поклоняющееся силам Хаоса.', 'Пустые алтари', 'В храме нашли следы недавнего собрания, но алтарь оказался пуст. На полу мелом нарисован план инженерных туннелей.'],
    ['chaos-daemon', 'ДЕМОН', 'Сущность Имматериума, воплощающая его разрушительные силы.', 'Отражение без хозяина', 'Камера наблюдения фиксирует фигуру, которой нет на записи с соседнего угла. Она появляется только в отражении бронированного стекла.'],
    ['chaos-heretic', 'ЕРЕТИК', 'Тот, кто отвернулся от установленной Империумом веры.', 'Список имён', 'Список подозреваемых включает людей, умерших до основания гарнизона. Рядом с каждым именем стоит дата будущего затмения.'],
    ['chaos-heresy', 'ЕРЕСЬ', 'Отступление от догм Империума, часто связанное с Хаосом.', 'Изъятая страница', 'Из хроники вырезана страница о первом сигнале. Края бумаги обуглены изнутри, а чернила проступают на обратной стороне.'],
    ['chaos-astartes', 'ХАОСИТ', 'Воин-предатель, служащий тёмным силам.', 'Броня без знаков', 'На поле боя найден фрагмент силовой брони без легионных знаков. Внутри шлема сохранился имперский позывной.'],
    ['chaos-ritual', 'РИТУАЛ', 'Обряд, используемый для взаимодействия с силами Варпа.', 'Последний круг', 'Ритуальный круг прерывается у стены. Следы показывают, что участники бежали наружу, а не пытались войти внутрь.'],
    ['chaos-eye', 'ГЛАЗ УЖАСА', 'Область галактики, искажённая разломом в Имматериум.', 'Карта невозможного неба', 'Звёздная карта показывает созвездие, видимое только из области сильного варп-искажения. Ни один навигатор не признаёт маршрут.'],
    ['chaos-corruption', 'СКВЕРНА', 'Искажение материи и разума под влиянием Хаоса.', 'Ржавчина на внутренней стороне', 'Металл покрыт ржавчиной с внутренней стороны листа. Приборы не находят химических причин такого разрушения.'],
    ['chaos-sorcerer', 'КОЛДУН', 'Псайкер, направляющий опасные силы Варпа.', 'Запись о безмолвном проводнике', 'Свидетели упоминают фигуру, которая не произнесла ни слова, но все услышали одну и ту же команду.'],
  ],
  tau: [
    ['tau-ethereal', 'ЭФИРНЫЙ', 'Представитель касты Тау, направляющий общество.', 'Послание Эфирного', 'В обращении к колонии повторяется призыв не открывать старый передатчик. Подпись принадлежит Эфирному, которого никто не видел лично.'],
    ['tau-fire', 'ОГНЕННАЯ КАСТА', 'Каста Тау, отвечающая за военное дело.', 'Позиция стрелков', 'Огненная каста заняла позиции вне радиуса маяка. Тактическая карта помечает место как «угроза без источника».'],
    ['tau-earth', 'ЗЕМНАЯ КАСТА', 'Каста инженеров, строителей и учёных Тау.', 'Схема чужого устройства', 'Инженеры Тау разобрали передатчик и обнаружили детали, изготовленные из сплава, неизвестного их лабораториям.'],
    ['tau-air', 'ВОЗДУШНАЯ КАСТА', 'Каста пилотов и космических экипажей Тау.', 'Невозможная траектория', 'Пилоты засекли сигнал за планетой, хотя он пришёл с поверхности. Все корабли получили одинаковые координаты.'],
    ['tau-water', 'ВОДНАЯ КАСТА', 'Каста дипломатов и переговорщиков Тау.', 'Протокол контакта', 'Дипломаты предложили эвакуацию, но в ответ получили сообщение на языке, которого нет в архиве переговоров.'],
    ['tau-greater-good', 'ВЫСШЕЕ БЛАГО', 'Общественный идеал, объединяющий Империю Тау.', 'Два перевода', 'Фраза «Высшее Благо» появляется в двух версиях перехвата: одна зовёт к сотрудничеству, другая предупреждает об опасности.'],
    ['tau-sept', 'СЕПТ', 'Звёздная система или центр владений Тау.', 'Метка далёкой системы', 'На карте отмечена система, не принадлежащая ни одному известному септу. Она появляется только после сбоя навигации.'],
    ['tau-drone', 'ДРОН', 'Автономная машина поддержки, используемая Тау.', 'Дрон вернулся пустым', 'Разведывательный дрон вернулся с целой памятью, но его внешние камеры были сняты аккуратно, без следов боя.'],
    ['tau-railgun', 'РЕЛЬСОТРОН', 'Мощное кинетическое оружие Тау.', 'След выстрела', 'На поверхности найден канал от рельсотронного выстрела. Траектория заканчивается в пустоте, где по сканерам должна быть скала.'],
    ['tau-kroot', 'КРУТ', 'Союзный народ Тау, известный охотниками и следопытами.', 'Запах под камнем', 'Следопыты крут отказались входить в туннель. Они заявили, что камень пахнет живым существом.'],
  ],
}
const loreEntries = Object.entries(factionFragments).flatMap(([factionId, fragments]) => fragments.map(([id, keyword, hint, title, body], index) => ({
  id, factionId, keyword, hint, cipherText: `ФРАГМЕНТ ${String(index + 1).padStart(2, '0')} · ${body.split('.')[0]}.`,
  category: factionId === 'orks' ? 'ПОЛЕВОЙ ЖУРНАЛ' : factionId === 'chaos' ? 'ПОВРЕЖДЁННАЯ ЗАПИСЬ' : factionId === 'tau' ? 'ПЕРЕХВАЧЕННЫЙ СИГНАЛ' : 'ДОСЬЕ', title, body,
})))
loreEntries.push({ id: 'zone-ver-ix', requiredEntries: ['neophyte-record', 'waaagh-report', 'warp-echo'], keyword: 'VER-IX', category: 'НОВАЯ ЗОНА', title: 'VER-IX · Пепельный маяк', body: 'Архив свёл три свидетельства в одну точку: заброшенный маяк на планете Кайрос-9. Здесь столкнулись гарнизон, орочий налёт и силы Хаоса. Под руинами обнаружена стазисная камера с генетическими маркерами, похожими на маркеры примарха. Имя стёрто из записи.' })

function freshState() {
  return { xp: 0, studiedFactions: [], dailyMission: null, achievements: [], answeredQuestions: [], discoveredEntries: [], readEntries: [], updatedAt: new Date().toISOString() }
}
function readData() {
  try { return JSON.parse(fs.readFileSync(dataPath, 'utf8')) } catch { return {} }
}
function writeData(data) {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true })
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
}
function getState(profileId = 'acolyte') {
  const data = readData()
  const saved = data[profileId]
  if (!saved) return freshState()
  return { ...freshState(), ...saved, discoveredEntries: Array.isArray(saved.discoveredEntries) ? saved.discoveredEntries : [], readEntries: Array.isArray(saved.readEntries) ? saved.readEntries : [] }
}
function saveState(profileId, state) {
  const data = readData()
  state.updatedAt = new Date().toISOString()
  data[profileId] = state
  writeData(data)
  return state
}
function today() { return new Date().toISOString().slice(0, 10) }
function readUsers() {
  try { return JSON.parse(fs.readFileSync(usersPath, 'utf8')) } catch { return [] }
}
function writeUsers(users) {
  fs.mkdirSync(path.dirname(usersPath), { recursive: true })
  const temporary = `${usersPath}.tmp`
  fs.writeFileSync(temporary, JSON.stringify(users, null, 2))
  fs.renameSync(temporary, usersPath)
}
function makeToken(user) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({ sub: user.id, username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })
  const unsigned = `${header}.${payload}`
  const signature = createHmac('sha256', authSecret).update(unsigned).digest('base64url')
  return `${unsigned}.${signature}`
}
function verifyToken(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const unsigned = `${parts[0]}.${parts[1]}`
  const expected = createHmac('sha256', authSecret).update(unsigned).digest()
  let provided
  try { provided = Buffer.from(parts[2], 'base64url') } catch { return null }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null
  } catch { return null }
}
function requireAuth(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const user = token && verifyToken(token)
  if (!user) return res.status(401).json({ error: 'Войди в архив, чтобы продолжить.' })
  req.user = user
  next()
}
function awardStudy(state, factionId) {
  if (!factionIds.includes(factionId)) return null
  if (state.studiedFactions.includes(factionId)) return state
  state.studiedFactions.push(factionId)
  state.xp += 25
  if (state.dailyMission !== today()) {
    state.dailyMission = today()
    state.xp += 50
    if (!state.achievements.includes('first-daily')) state.achievements.push('first-daily')
  }
  if (!state.achievements.includes('first-dossier')) state.achievements.push('first-dossier')
  if (state.studiedFactions.length === factionIds.length && !state.achievements.includes('all-factions')) {
    state.achievements.push('all-factions')
    state.xp += 100
  }
  return state
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }))
app.use(express.json({ limit: '16kb' }))
app.get('/api/health', (_req, res) => res.json({ status: 'online', service: 'Sector: Vermillion API' }))
app.post('/api/auth/register', async (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!/^[a-z0-9_]{3,24}$/.test(username)) return res.status(400).json({ error: 'Имя: 3–24 символа, только латиница, цифры и _.' })
  if (password.length < 8 || password.length > 128) return res.status(400).json({ error: 'Пароль должен содержать от 8 до 128 символов.' })
  const users = readUsers()
  if (users.some((user) => user.username === username)) return res.status(409).json({ error: 'Это имя уже занято. Выбери другое или войди.' })
  const id = randomBytes(16).toString('hex')
  const salt = randomBytes(16).toString('hex')
  const passwordHash = (await scrypt(password, salt, 64)).toString('hex')
  const user = { id, username, salt, passwordHash, createdAt: new Date().toISOString() }
  users.push(user)
  writeUsers(users)
  res.status(201).json({ token: makeToken(user), user: { id, username } })
})
app.post('/api/auth/login', async (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const user = readUsers().find((candidate) => candidate.username === username)
  if (!user || password.length > 128) return res.status(401).json({ error: 'Неверное имя или пароль.' })
  const passwordHash = (await scrypt(password, user.salt, 64)).toString('hex')
  const expected = Buffer.from(user.passwordHash, 'hex')
  const provided = Buffer.from(passwordHash, 'hex')
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return res.status(401).json({ error: 'Неверное имя или пароль.' })
  res.json({ token: makeToken(user), user: { id: user.id, username: user.username } })
})
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: { id: req.user.sub, username: req.user.username } }))
app.get('/api/progress', requireAuth, (req, res) => res.json(getState(req.user.sub)))
app.get('/api/lore/:factionId/fragments', (req, res) => {
  const fragments = loreEntries.filter((entry) => entry.factionId === req.params.factionId)
  if (!fragments.length) return res.status(404).json({ error: 'Досье фракции не найдено.' })
  res.json({ fragments: fragments.map(({ id, hint, cipherText }) => ({ id, hint, cipherText })) })
})
app.post('/api/study/:factionId', requireAuth, (req, res) => {
  const state = getState(req.user.sub)
  if (!awardStudy(state, req.params.factionId)) return res.status(404).json({ error: 'Досье не найдено.' })
  res.json(saveState(req.user.sub, state))
})
app.post('/api/quiz', requireAuth, (req, res) => {
  const { questionId, answerIndex } = req.body || {}
  if (!(questionId in quizAnswers)) return res.status(404).json({ error: 'Вопрос не найден.' })
  const state = getState(req.user.sub)
  if (state.answeredQuestions.includes(questionId)) return res.json({ correct: true, alreadyAnswered: true, progress: state })
  if (Number(answerIndex) !== quizAnswers[questionId]) return res.status(400).json({ correct: false, error: 'Ответ неверный. Перечитай досье и попробуй ещё раз.' })
  state.answeredQuestions.push(questionId)
  state.xp += 15
  if (state.answeredQuestions.length === Object.keys(quizAnswers).length && !state.achievements.includes('quiz-complete')) {
    state.achievements.push('quiz-complete')
    state.xp += 50
  }
  res.json({ correct: true, progress: saveState(req.user.sub, state) })
})
app.get('/api/knowledge', requireAuth, (req, res) => {
  const progress = getState(req.user.sub)
  const entries = loreEntries.map((entry) => {
    const unlocked = entry.requiredEntries
      ? entry.requiredEntries.every((id) => progress.readEntries.includes(id))
      : progress.discoveredEntries.includes(entry.id) || progress.readEntries.includes(entry.id)
    return { ...entry, keyword: unlocked ? entry.keyword : null, hint: unlocked ? entry.hint : null, title: unlocked ? entry.title : null, unlocked, read: progress.readEntries.includes(entry.id), body: unlocked ? entry.body : null }
  })
  res.json({ terms: entries.filter((entry) => entry.unlocked).map(({ keyword, category, title, id }) => ({ keyword, category, title, entryId: id })), entries })
})
app.post('/api/knowledge/:entryId/discover', requireAuth, (req, res) => {
  const entry = loreEntries.find((candidate) => candidate.id === req.params.entryId && candidate.factionId)
  if (!entry) return res.status(404).json({ error: 'Ключевой фрагмент не найден.' })
  const normalize = (value) => String(value || '').trim().toLocaleUpperCase('ru-RU').replace(/Ё/g, 'Е').replace(/\s+/g, ' ')
  if (normalize(req.body?.answer) !== normalize(entry.keyword)) return res.status(400).json({ error: 'Кодовое слово не совпало. Сверь подсказку с досье и попробуй ещё раз.' })
  const state = getState(req.user.sub)
  if (!state.discoveredEntries.includes(entry.id)) {
    state.discoveredEntries.push(entry.id)
    state.xp += 5
  }
  res.json({ entry: { id: entry.id, title: entry.title, keyword: entry.keyword }, progress: saveState(req.user.sub, state) })
})
app.post('/api/knowledge/:entryId/read', requireAuth, (req, res) => {
  const entry = loreEntries.find((candidate) => candidate.id === req.params.entryId)
  if (!entry) return res.status(404).json({ error: 'Запись не найдена.' })
  const state = getState(req.user.sub)
  const unlocked = entry.requiredEntries
    ? entry.requiredEntries.every((id) => state.readEntries.includes(id))
    : state.discoveredEntries.includes(entry.id) || state.readEntries.includes(entry.id)
  if (!unlocked) return res.status(403).json({ error: 'Эта запись пока закрыта. Изучи нужные досье и прочитай связанные материалы.' })
  if (!state.readEntries.includes(entry.id)) {
    state.readEntries.push(entry.id)
    state.xp += entry.category === 'НОВАЯ ЗОНА' ? 50 : 20
    if (entry.id === 'zone-ver-ix' && !state.achievements.includes('signal-decoder')) state.achievements.push('signal-decoder')
  }
  res.json({ entry, progress: saveState(req.user.sub, state) })
})
app.listen(port, () => console.log(`Sector: Vermillion API listening on http://localhost:${port}`))
