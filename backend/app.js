import cors from 'cors'
import express from 'express'
import apiRoutes from './routes/apiRoutes.js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }))
app.use(express.json({ limit: '16kb' }))
app.use('/api', apiRoutes)
export default app
