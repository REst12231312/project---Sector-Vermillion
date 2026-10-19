import { Router } from 'express'
import { changePassword, login, logout, refreshSession, register, updateProfile } from '../services/authService.js'
import { getMatchHistory, getMatchStats } from '../services/userRepository.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
const REFRESH_COOKIE = 'sv-refresh'
const REFRESH_COOKIE_PATH = '/api/auth'

function cookieValue(req, name) {
  const raw = req.headers.cookie || ''
  const part = raw.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`))
  if (!part) return ''
  try { return decodeURIComponent(part.slice(name.length + 1)) } catch { return '' }
}

function setRefreshCookie(res, token) {
  const options = [`${REFRESH_COOKIE}=${encodeURIComponent(token)}`, `Path=${REFRESH_COOKIE_PATH}`, 'HttpOnly', 'SameSite=None', 'Max-Age=2592000']
  if (process.env.NODE_ENV === 'production') options.push('Secure')
  else options[options.length - 1] = 'SameSite=Lax; Max-Age=2592000'
  res.setHeader('Set-Cookie', options.join('; '))
}

function clearRefreshCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${REFRESH_COOKIE}=; Path=${REFRESH_COOKIE_PATH}; HttpOnly; SameSite=Lax; Max-Age=0${secure}`)
}

function sendSession(res, result) {
  const { status, refreshToken, ...body } = result
  if (refreshToken) setRefreshCookie(res, refreshToken)
  return res.status(status).json(body)
}

router.post('/register', async (req, res) => sendSession(res, await register(req.body || {})))
router.post('/login', async (req, res) => sendSession(res, await login(req.body || {})))
router.post('/refresh', async (req, res) => {
  const result = await refreshSession(cookieValue(req, REFRESH_COOKIE))
  if (!result.refreshToken) clearRefreshCookie(res)
  return sendSession(res, result)
})
router.post('/logout', async (req, res) => {
  await logout(cookieValue(req, REFRESH_COOKIE))
  clearRefreshCookie(res)
  res.json({ status: 'logged-out' })
})
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))
router.get('/profile', requireAuth, async (req, res) => {
  const stats = await getMatchStats(req.user.sub)
  res.json({ user: req.user, stats })
})
router.put('/profile', requireAuth, async (req, res) => sendSession(res, await updateProfile(req.user.sub, req.body || {})))
router.put('/password', requireAuth, async (req, res) => sendSession(res, await changePassword(req.user.sub, req.body || {})))
router.get('/matches', requireAuth, async (req, res) => res.json({ matches: await getMatchHistory(req.user.sub, { limit: req.query.limit }) }))

export default router
