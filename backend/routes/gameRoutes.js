import { Router } from 'express'
import { loreEntries } from '../data/gameData.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { defectToChaos } from '../services/authService.js'
import { recordMatchHistory, updateUserOnlineIdentity } from '../services/userRepository.js'
import {
  cancelQueue, createPrivateRoom, getMatch, getPrivateRoom, joinPrivateRoom,
  leavePrivateRoom, performMatchAction, queueForMatch, readyForRematch,
  setRoomReady,
} from '../services/battleService.js'
import {
  answerQuiz, completeCampaign, discoverEntry, getFactionFragments, recordSignalIntercept,
  getKnowledge, getState, readEntry, recordInterceptedLore, studyFaction,
} from '../services/gameService.js'

const router = Router()
const onlineChoices = {
  imperium: { chapter: ['ultramarines', 'imperial-fists', 'blood-angels', 'dark-angels', 'space-wolves', 'salamanders', 'raven-guard', 'white-scars', 'iron-hands'] },
  chaos: { legion: ['black-legion', 'word-bearers', 'world-eaters', 'death-guard', 'emperors-children', 'thousand-sons', 'night-lords', 'iron-warriors', 'alpha-legion'] },
}
router.get('/progress', requireAuth, (req, res) => res.json(getState(req.user.sub)))
router.put('/online-profile', requireAuth, async (req, res) => {
  const faction = req.user.faction
  const field = faction === 'imperium' ? 'chapter' : faction === 'chaos' ? 'legion' : null
  const value = String(req.body?.value || '')
  if (!field) return res.status(409).json({ error: 'Для этой фракции нет выбора ордена или легиона.' })
  if (value && !onlineChoices[faction][field].includes(value)) return res.status(400).json({ error: 'Такой вариант недоступен.' })
  const user = await updateUserOnlineIdentity(req.user.sub, { [field]: value })
  if (!user) return res.status(404).json({ error: 'Профиль не найден.' })
  res.json({ user: { id: user.id, username: user.username, faction, chapter: user.onlineIdentity?.chapter || '', legion: user.onlineIdentity?.legion || '' } })
})
router.post('/online/matchmaking', requireAuth, (req, res) => {
  const result = queueForMatch({ id: req.user.sub, username: req.user.username }, req.body?.faction)
  if (result.error) return res.status(result.statusCode || 400).json({ error: result.error })
  res.json(result)
})
router.delete('/online/matchmaking', requireAuth, (req, res) => {
  cancelQueue(req.user.sub)
  res.json({ status: 'cancelled' })
})
router.post('/online/rooms', requireAuth, (req, res) => {
  const result = createPrivateRoom({ id: req.user.sub, username: req.user.username }, req.body?.faction)
  if (result.error) return res.status(result.statusCode || 400).json({ error: result.error })
  res.status(201).json(result)
})
router.post('/online/rooms/:code/join', requireAuth, (req, res) => {
  const result = joinPrivateRoom(req.params.code, { id: req.user.sub, username: req.user.username }, req.body?.faction)
  if (result.error) return res.status(result.statusCode || 400).json({ error: result.error })
  res.json(result)
})
router.get('/online/rooms/:code', requireAuth, (req, res) => {
  const room = getPrivateRoom(req.params.code, req.user.sub)
  if (!room) return res.status(404).json({ error: 'Комната не найдена или доступ закрыт.' })
  res.json({ room })
})
router.put('/online/rooms/:code/ready', requireAuth, (req, res) => {
  const result = setRoomReady(req.params.code, req.user.sub, req.body?.ready)
  if (result.error) return res.status(result.statusCode || 400).json({ error: result.error })
  res.json(result)
})
router.delete('/online/rooms/:code', requireAuth, (req, res) => {
  const result = leavePrivateRoom(req.params.code, req.user.sub)
  if (result.error) return res.status(result.statusCode || 400).json({ error: result.error })
  res.json(result)
})
router.post('/online/rooms/:code/rematch', requireAuth, (req, res) => {
  const result = readyForRematch(req.params.code, req.user.sub)
  if (result.error) return res.status(result.statusCode || 400).json({ error: result.error })
  res.json(result)
})
async function persistFinishedMatch(match) {
  if (match?.status === 'finished') await recordMatchHistory(match)
}
router.get('/online/matches/:matchId', requireAuth, async (req, res) => {
  const match = getMatch(req.params.matchId, req.user.sub)
  if (!match) return res.status(404).json({ error: 'Операция не найдена или доступ к ней закрыт.' })
  await persistFinishedMatch(match)
  res.json({ match })
})
router.post('/online/matches/:matchId/presence', requireAuth, async (req, res) => {
  const match = getMatch(req.params.matchId, req.user.sub)
  if (!match) return res.status(404).json({ error: 'Операция не найдена или доступ к ней закрыт.' })
  await persistFinishedMatch(match)
  res.json({ match })
})
router.post('/online/matches/:matchId/actions', requireAuth, async (req, res) => {
  const result = performMatchAction(req.params.matchId, req.user.sub, req.body?.type, req.body?.payload, req.body?.actionId)
  if (result.error) return res.status(result.status || 400).json({ error: result.error })
  await persistFinishedMatch(result.match)
  res.json(result)
})
router.post('/campaign/complete', requireAuth, (req, res) => {
  const result = completeCampaign(req.user.sub, req.user.faction, req.body?.levelId)
  if (result.error) return res.status(result.status).json({ error: result.error })
  res.json(result.state)
})
router.post('/campaign/defect', requireAuth, async (req, res) => {
  const result = await defectToChaos(req.user.sub, req.body || {})
  const { status, ...body } = result
  res.status(status).json(body)
})
router.get('/lore/:factionId/fragments', (req, res) => {
  const fragments = getFactionFragments(req.params.factionId)
  if (!fragments) return res.status(404).json({ error: 'Досье фракции не найдено.' })
  res.json({ fragments })
})
router.post('/study/:factionId', requireAuth, (req, res) => {
  const state = studyFaction(req.user.sub, req.params.factionId)
  if (!state) return res.status(404).json({ error: 'Досье не найдено.' })
  res.json(state)
})
router.post('/signal-intercept', requireAuth, (req, res) => {
  res.json(recordSignalIntercept(req.user.sub))
})
router.post('/signal-intercept/read', requireAuth, (req, res) => {
  const result = recordInterceptedLore(req.user.sub, req.user.faction, req.body?.factionId, req.body?.recordId)
  if (result.status) {
    const { status, ...body } = result
    return res.status(status).json(body)
  }
  res.json(result)
})
router.post('/quiz', requireAuth, (req, res) => {
  const result = answerQuiz(req.user.sub, req.body?.questionId, req.body?.answerIndex)
  if (result.status) {
    const { status, ...body } = result
    return res.status(status).json(body)
  }
  res.json(result)
})
router.get('/knowledge', requireAuth, (req, res) => res.json(getKnowledge(req.user.sub)))
router.post('/knowledge/:entryId/discover', requireAuth, (req, res) => {
  const result = discoverEntry(req.user.sub, req.params.entryId, req.body?.choiceId)
  if (result.status) {
    const { status, ...body } = result
    return res.status(status).json(body)
  }
  res.json(result)
})
router.post('/knowledge/:entryId/read', requireAuth, (req, res) => {
  const result = readEntry(req.user.sub, req.params.entryId)
  if (result.status) {
    const { status, ...body } = result
    return res.status(status).json(body)
  }
  res.json(result)
})
export default router
