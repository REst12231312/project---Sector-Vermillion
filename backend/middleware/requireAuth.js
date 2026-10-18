import { verifyToken } from '../services/authService.js'
import { findUserById } from '../storage.js'
export function requireAuth(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const user = token && verifyToken(token)
  if (!user) return res.status(401).json({ error: 'Войди в архив, чтобы продолжить.' })
  const currentUser = findUserById(user.sub)
  if (!currentUser) return res.status(401).json({ error: 'Профиль не найден. Войди в архив повторно.' })
  req.user = { ...user, username: currentUser.username, faction: currentUser.faction || 'imperium', onlineIdentity: currentUser.onlineIdentity || {} }
  next()
}
