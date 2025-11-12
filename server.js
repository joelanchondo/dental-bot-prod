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

// Health check - RUTA CORREGIDA
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Bot Dental API funcionando',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bot Dental API - Sistema funcionando',
    version: '1.0.0',
    timestamp: new Date()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});
