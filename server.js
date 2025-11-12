const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-bot')
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// Rutas
const webhookRoutes = require('./routes/webhook');
const adminRoutes = require('./routes/admin');

app.use('/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bot Dental API - Sistema funcionando',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// Iniciar cron jobs (comentado por ahora)
// require('./jobs/appointmentChecker');

const PORT = process.env.PORT || 3001;  // CAMBIADO A 3001
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});
