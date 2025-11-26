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
const calendarDashboardRoutes = require('./routes/calendar-dashboard');  // Ruta del Dashboard de Citas

// Registrar rutas PRINCIPALES primero
app.use('/onboarding', onboardingRoutes);  // ✅ ESTA ES LA IMPORTANTE
app.use('/api/onboarding', onboardingRoutes);
app.use('/onboarding-dashboard', onboardingDashboardRoutes);
app.use("/dashboard-pro", require("./routes/dashboard-pro"));

// Otras rutas
app.use('/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/dashboard', dashboardRoutes);
app.use("/dashboard-pro", require("./routes/dashboard-pro"));
app.use('/calendar-dashboard', calendarDashboardRoutes);
app.use("/dashboard-pro", require("./routes/dashboard-pro"));
app.use('/api/appointments', require('./routes/appointments-api'));

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
      webhook: '/webhook',
      admin: '/admin'
    }
  });
});

// Ruta admin dashboard
app.get('/admin', async (req, res) => {
  try {
    const Business = require('./models/Business');
    const businesses = await Business.find().sort({ createdAt: -1 });

    let businessList = '';
    businesses.forEach(business => {
      businessList += `
        <div class="business-item">
          <div>
            <strong>${business.businessName}</strong><br>
            <small>Plan: ${business.plan} | ${new Date(business.createdAt).toLocaleDateString('es-MX')}</small>
          </div>
          <div>
            <a href="/dashboard/${business._id}" target="_blank" class="btn btn-view">Ver</a>
            <button class="btn btn-delete" onclick="deleteBusiness('${business._id}')">Eliminar</button>
          </div>
        </div>`;
    });

    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .header { background: #dc2626; color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .business-list { background: white; padding: 20px; border-radius: 8px; }
        .business-item { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .btn { padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin: 2px; }
        .btn-delete { background: #dc2626; color: white; }
        .btn-view { background: #2563eb; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Gestión de Clientes</p>
    </div>

    <div class="business-list">
        <h2>📋 Clientes (${businesses.length})</h2>
        ${businessList}
    </div>

    <script>
        function deleteBusiness(businessId) {
            if (confirm('¿Eliminar este cliente?')) {
                fetch('/api/admin/businesses/' + businessId, { method: 'DELETE' })
                .then(response => {
                    if (response.ok) {
                        alert('Cliente eliminado');
                        location.reload();
                    }
                });
            }
        }
    </script>
</body>
</html>
    `);
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
