import { Router } from 'express'
import authRoutes from './authRoutes.js'
import gameRoutes from './gameRoutes.js'
const router = Router()
router.get('/health', (_req, res) => res.json({ status: 'online', service: 'Sector: Vermillion API' }))
router.use('/auth', authRoutes)
router.use('/', gameRoutes)
export default router
