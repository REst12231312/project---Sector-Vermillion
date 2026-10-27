import { verifyToken } from '../services/authService.js'
import { findUserById } from '../services/userRepository.js'

export async function requireAuth(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const claims = token && verifyToken(token)
  if (!claims) return res.status(401).json({ error: 'Войди в архив, чтобы продолжить.' })
  const currentUser = await findUserById(claims.sub)
  if (!currentUser) return res.status(401).json({ error: 'Профиль не найден. Войди в архив повторно.' })
  req.user = {
    ...claims, id: currentUser.id, username: currentUser.username, email: currentUser.email || '',
    faction: currentUser.faction || 'imperium', favoriteFaction: currentUser.favoriteFaction || currentUser.faction || 'imperium',
    avatarId: currentUser.avatarId || 'default',
    createdAt: currentUser.createdAt || null,
  }
  next()
}
