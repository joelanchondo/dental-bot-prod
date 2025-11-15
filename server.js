const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DEBUG: Ver variables de entorno
console.log('🔧 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 'undefined');

// Conectar MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-bot';
    console.log('🔗 Conectando a MongoDB...');
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB conectado exitosamente');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.log('💡 URI usada:', process.env.MONGODB_URI ? 'Presente' : 'No encontrada');
    process.exit(1);
  }
};

connectDB();

// Rutas
const webhookRoutes = require('./routes/webhook');
const adminRoutes = require('./routes/admin');
const onboardingRoutes = require('./routes/onboarding');
const onboardingDashboardRoutes = require('./routes/onboarding-dashboard');

app.use('/webhook', webhookRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/onboarding', onboardingDashboardRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Bot Dental API funcionando',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
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
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Servir dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/views/dashboard.html');
});
