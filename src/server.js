const express = require('express')
const cors = require('cors')
require('dotenv').config()

const { initDB } = require('./config/db')
const patientRoutes = require('./routes/patient.routes')
const errorHandler = require('./middlewares/errorHandler')

const app = express()
const PORT = process.env.PORT || 3002
const HOST = process.env.HOST || '0.0.0.0'

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Patient Service is running' })
})

app.use('/', patientRoutes)

app.use(errorHandler)

const startServer = async () => {
  try {
    await initDB()
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Patient Service (PostgreSQL) démarré sur http://${HOST}:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Échec du démarrage:', error.message)
    setTimeout(startServer, 5000)
  }
}

startServer()

module.exports = app
