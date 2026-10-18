import { Router } from 'express'
import { login, register } from '../services/authService.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
router.post('/register', async (req, res) => {
  const result = await register(req.body || {})
  const { status, ...body } = result
  res.status(status).json(body)
})
router.post('/login', async (req, res) => {
  const result = await login(req.body || {})
  const { status, ...body } = result
  res.status(status).json(body)
})
router.get('/me', requireAuth, (req, res) => res.json({ user: { id: req.user.sub, username: req.user.username, faction: req.user.faction || 'imperium' } }))
export default router
