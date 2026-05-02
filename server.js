require('dotenv').config({ path: `${__dirname}/.env.${process.env.NODE_ENV || 'development'}` });
const express = require('express');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { authenticateToken, requireRole } = require('./middleware/auth');

const app = express();
app.set("trust proxy", 1);

// ✅ Motor de vistas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 🔒 RATE LIMITING GLOBAL PARA PROTECCIÓN
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por ventana
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta más tarde'
  },
  skip: (req) => {
    // Saltar rate limit para webhooks de Twilio
    return req.path.includes('/api/whatsapp') &&
      req.headers['x-twilio-signature'] !== undefined;
  }
});

app.use(globalLimiter);

// Middleware
app.use(cors());
app.use(cookieParser()); // ✅ FIX: Necesario para leer JWT desde cookies
// Middleware para detectar subdominio
app.use((req, res, next) => {
  const host = req.headers.host;

  // Extraer subdominio si existe
  if (host.includes('.')) {
    const subdomain = host.split('.')[0];

    // Solo procesar si no es 'www' o 'dental-bot-prod'
    if (!['www', 'dental-bot-prod', 'localhost'].includes(subdomain)) {
      req.subdomain = subdomain;
      console.log('🚀 [ANTIGRAVITY] Subdominio detectado:', subdomain);
    }
  }

  next();
});

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
const calendarDashboardRoutes = require('./routes/calendar-dashboard');  // Ruta del Dashboard de Citas

// Registrar rutas PRINCIPALES primero
app.use('/onboarding', onboardingRoutes);  // ✅ ESTA ES LA IMPORTANTE
app.use('/api/onboarding', onboardingRoutes);
app.use('/onboarding-dashboard', onboardingDashboardRoutes);
app.use("/onboarding-complete", require("./routes/onboarding-complete"));
app.use("/api/onboarding-complete", require("./routes/onboarding-complete"));
app.use("/onboarding-enhanced", require("./routes/onboarding-enhanced"));
app.use("/dashboard-pro", require("./routes/dashboard-pro")); // ✅ FIX: Solo UNA vez

// Otras rutas
app.use('/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/calendar-dashboard', calendarDashboardRoutes);
app.use('/api/appointments', require('./routes/appointments-api'));
app.use('/api/auth', require('./routes/auth'));
app.use('/auth', require('./routes/auth-pages')); // ✅ Páginas de login/registro


// Silenciar 404 de favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());


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

// 🎯 SAAS ROUTING (LANDING PAGE & SIGNUP)
const saasRoutes = require('./routes/saas');
app.use('/', saasRoutes);

// ⚠️ RUTA ANTIGUA DESACTIVADA (Reemplazada por Landing Page)
/*
app.get('/', (req, res) => {
  res.json({
    message: 'Dental Bot API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      onboarding: '/onboarding',
      dashboard: '/dashboard/:businessId',
      webhook: '/webhook',
      admin: '/admin'
    }
  });
});
*/

// Ruta admin dashboard — ✅ FIX: Protegida con JWT + rol superadmin
app.get('/admin', authenticateToken, requireRole('superadmin'), async (req, res) => {
  try {
    const Business = require('./models/Business');
    const businesses = await Business.find().sort({ createdAt: -1 });

    res.render('dashboard-admin-saas', { businesses });
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
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
      dashboard: '/dashboard/:businessId',
      admin: '/admin'
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
  console.log(`👑 Admin: http://localhost:${PORT}/admin`);
});

// Agregar ruta calendar-dashboard (antes del 404)





