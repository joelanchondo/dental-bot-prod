require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-bot';

// Log environment
console.log('🔧 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('MONGODB_URI length:', MONGODB_URI ? MONGODB_URI.length : 'undefined');

// Conectar a MongoDB
console.log('🔗 Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  });

// Importar rutas
const webhookRoutes = require('./routes/webhook');
const adminRoutes = require('./routes/admin');
const onboardingRoutes = require('./routes/onboarding');
const onboardingDashboardRoutes = require('./routes/onboarding-dashboard');
const dashboardRoutes = require('./routes/dashboard');

// Registrar rutas
app.use('/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/onboarding', onboardingDashboardRoutes);
app.use('/dashboard', dashboardRoutes);

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
    message: 'Dental Bot API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      onboarding: '/onboarding',
      dashboard: '/dashboard/:businessId',
      webhook: '/webhook'
    }
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      health: '/health',
      onboarding: '/onboarding',
      dashboard: '/dashboard/:businessId'
    }
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🚀 Onboarding: http://localhost:${PORT}/onboarding`);
});
