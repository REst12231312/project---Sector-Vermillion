import cors from 'cors'
import express from 'express'
import apiRoutes from './routes/apiRoutes.js'

const app = express()
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',').map((origin) => origin.trim()).filter(Boolean)
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(null, false)
  },
  credentials: true,
}))
app.use(express.json({ limit: '16kb' }))
app.use('/api', apiRoutes)
export default app
