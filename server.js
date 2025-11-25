const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

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
const dashboardRoutes = require('./routes/dashboard');
const calendarDashboardRoutes = require('./routes/calendar-dashboard');
const calendarApiRoutes = require('./routes/calendar-api');

// Registrar rutas
app.use('/webhook', webhookRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/onboarding', onboardingDashboardRoutes);
app.use('/dashboard', calendarDashboardRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/dashboard/api', calendarApiRoutes);
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
    version: '2.0.0',
    features: {
      calendar: 'enabled',
      interactiveCalendar: 'enabled',
      payments: 'in-development',
      templates: ['dental', 'automotive', 'barbershop', 'medical']
    },
    timestamp: new Date()
  });
});

// Manejo de errores 404
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Calendario: http://localhost:${PORT}/dashboard/calendar`);
  console.log(`🏥 Onboarding: http://localhost:${PORT}/onboarding`);
});
