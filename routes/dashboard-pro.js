const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const moment = require('moment');
const mongoose = require('mongoose');

// =========================================================
// 1. RUTAS DE API (Deben ir PRIMERO para evitar conflictos)
// =========================================================

// GET - Obtener servicios del negocio
router.get("/api/business/:identifier/services", async (req, res) => {
  try {
    let business;
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }

    if (!business) {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }

    res.json(business.services || []);
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET - Obtener citas por mes
router.get("/api/business/:identifier/appointments", async (req, res) => {
    try {
        const { identifier } = req.params;
        const { month, year } = req.query;

        let business;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            business = await Business.findById(identifier);
        } else {
            business = await Business.findOne({ slug: identifier });
        }

        if (!business) {
            return res.status(404).json({ error: "Negocio no encontrado" });
        }

        // Calcular rango del mes
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const appointments = await Appointment.find({
            businessId: business._id,
            dateTime: { $gte: startDate, $lte: endDate }
        }).sort({ dateTime: 1 });

        res.json(appointments);
    } catch (error) {
        console.error("Error en API appointments:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// GET - Obtener información completa del negocio (API JSON)
router.get("/api/business/:identifier", async (req, res) => {
  try {
    let business;
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }

    if (!business) {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }

    res.json({
      ...business.toObject(),
      services: business.services || []
    });
  } catch (error) {
    console.error("Error al obtener negocio:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST - Agregar nuevo servicio
router.post("/:identifier/services", async (req, res) => {
  try {
    const { identifier } = req.params;
    const {
      name,
      description = "",
      duration = 30,
      price = 1000,
      active = true,
      category = "general",
      requiresPayment = false,
      commission = 0,
      customService = true,
      basePrice
    } = req.body;

    let business;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      business = await Business.findById(identifier);
    } else {
      business = await Business.findOne({ slug: identifier });
    }

    if (!business) {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }

    const newService = {
      name,
      description,
      duration: parseInt(duration),
      price: parseInt(price),
      active,
      category,
      requiresPayment,
      customService,
      basePrice: parseInt(basePrice || price),
      commission: parseInt(commission || 0),
      timesBooked: 0,
      revenue: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    business.services.push(newService);
    await business.save();

    res.json({
      success: true,
      service: newService,
      services: business.services
    });
  } catch (error) {
    console.error("Error al crear servicio:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT - Actualizar servicio
router.put("/:identifier/services/:serviceId", async (req, res) => {
  try {
    let business;
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }

    if (!business) {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }

    const service = business.services.id(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const {
      name,
      description,
      duration,
      price,
      active,
      category,
      requiresPayment,
      commission,
      basePrice
    } = req.body;

    if (name !== undefined) service.name = name;
    if (category !== undefined) service.category = category;
    if (requiresPayment !== undefined) service.requiresPayment = requiresPayment;
    if (description !== undefined) service.description = description;
    if (duration !== undefined) service.duration = parseInt(duration);
    if (price !== undefined) service.price = parseInt(price);
    if (active !== undefined) service.active = active;
    if (commission !== undefined) service.commission = parseInt(commission || 0);
    if (basePrice !== undefined) service.basePrice = parseInt(basePrice);

    service.updatedAt = new Date();
    await business.save();

    res.json({
      success: true,
      service: service.toObject(),
      services: business.services
    });
  } catch (error) {
    console.error("Error al actualizar servicio:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar servicio
router.delete("/:identifier/services/:serviceId", async (req, res) => {
  try {
    let business;
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }

    if (!business) {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }

    // Forma correcta de eliminar subdocumentos en Mongoose moderno
    business.services.pull({ _id: req.params.serviceId });
    await business.save();

    res.json({
      success: true,
      message: "Servicio eliminado",
      services: business.services
    });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    res.status(500).json({ error: error.message });
  }
});


// =========================================================
// 2. HELPER FUNCTIONS (Para el SSR)
// =========================================================

function getServiceIconClass(service) {
  const category = service.category || "general";
  const colors = {
    consultation: "bg-blue-100 text-blue-600",
    cleaning: "bg-green-100 text-green-600",
    treatment: "bg-purple-100 text-purple-600",
    surgery: "bg-red-100 text-red-600",
    emergency: "bg-orange-100 text-orange-600",
    general: "bg-gray-100 text-gray-600"
  };
  return colors[category] || colors.general;
}

function getServiceIcon(service) {
  const category = service.category || "general";
  const icons = {
    consultation: "fas fa-user-md",
    cleaning: "fas fa-tooth",
    treatment: "fas fa-procedures",
    surgery: "fas fa-syringe",
    emergency: "fas fa-ambulance",
    general: "fas fa-stethoscope"
  };
  return icons[category] || icons.general;
}

// =========================================================
// 3. RUTA PRINCIPAL DASHBOARD (Debe ir AL FINAL)
// =========================================================

router.get('/:identifier', async (req, res) => {
  try {
    let business;

    // Buscar por ID o Slug
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }

    if (!business) {
      return res.status(404).send('Negocio no encontrado');
    }

    const appointments = await Appointment.find({ businessId: business._id })
      .sort({ dateTime: -1 })
      .limit(100);

    // Preparar datos para el calendario
    const calendarData = appointments.reduce((acc, apt) => {
      const date = moment(apt.dateTime).format('YYYY-MM-DD');
      if (!acc[date]) acc[date] = [];
      acc[date].push(apt);
      return acc;
    }, {});

    const businessServices = business.services || [];

    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Pro - ${business.businessName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/min/moment.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/locale/es.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-blue: #0f172a;
            --secondary-blue: #1e293b;
            --accent-gold: #f59e0b;
            --light-gold: #fbbf24;
            --success-green: #10b981;
            --danger-red: #ef4444;
            --warning-orange: #f97316;
        }

        body {
            background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
        }

        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .glass-card-dark {
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .calendar-day {
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .calendar-day:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .calendar-day.has-appointments {
            background: linear-gradient(135deg, var(--accent-gold) 0%, var(--light-gold) 100%);
            color: white;
        }

        .appointment-item {
            transition: all 0.3s ease;
        }

        .appointment-item:hover {
            transform: translateX(5px);
        }

        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .status-confirmed { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .status-urgent { background: #fecaca; color: #dc2626; }

        .service-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .badge-active { background: #d1fae5; color: #065f46; }
        .badge-inactive { background: #f3f4f6; color: #4b5563; }
        .badge-online { background: #e0e7ff; color: #3730a3; }
        .badge-office { background: #fef3c7; color: #92400e; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
            animation: fadeIn 0.5s ease-out;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal-content {
            background: white;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .service-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-right: 16px;
        }

        .service-dentist { background: #dbeafe; color: #1e40af; }
        .service-cleaning { background: #d1fae5; color: #065f46; }
        .service-whitening { background: #fef3c7; color: #92400e; }
        .service-implants { background: #fce7f3; color: #9d174d; }
        .service-general { background: #f3f4f6; color: #4b5563; }

        .stats-card {
            transition: all 0.3s ease;
        }

        .stats-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .input-field {
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            padding: 12px 16px;
            font-size: 14px;
            transition: all 0.3s ease;
            width: 100%;
        }

        .input-field:focus {
            outline: none;
            border-color: var(--accent-gold);
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--accent-gold) 0%, var(--light-gold) 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4);
        }

        .btn-secondary {
            background: white;
            color: var(--primary-blue);
            border: 2px solid #e5e7eb;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-secondary:hover {
            border-color: var(--accent-gold);
            color: var(--accent-gold);
        }

        .btn-danger {
            background: linear-gradient(135deg, var(--danger-red) 0%, #f87171 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-danger:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4);
        }

        .loading-skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }

        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        .pulse-animation {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body class="text-gray-800">
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div class="container mx-auto px-6 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <div class="bg-white/20 p-3 rounded-xl">
                        <span class="text-2xl">🏢</span>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">${business.businessName}</h1>
                        <p class="text-blue-100 text-sm">Dashboard Profesional | Servicios conectados con Onboarding</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="bg-black/20 rounded-full px-4 py-2">
                        <span class="text-yellow-400 font-bold">${business.plan ? business.plan.toUpperCase() : 'STANDARD'}</span>
                    </div>
                    <div class="text-right hidden md:block">
                        <p class="text-white/80 text-sm">Estado del Sistema</p>
                        <div class="flex items-center">
                            <div class="w-2 h-2 bg-green-500 rounded-full mr-2 pulse-animation"></div>
                            <p class="text-green-400 font-bold text-sm">Operativo</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 md:px-6 py-8">
        <!-- Navigation Tabs -->
        <div class="flex flex-wrap gap-2 bg-gray-900/50 p-2 rounded-xl mb-8 border border-white/10">
            <button class="tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-white text-blue-900 shadow-lg flex items-center space-x-2" data-tab="overview">
                <i class="fas fa-chart-line"></i>
                <span>📊 Resumen</span>
            </button>
            <button class="tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-gray-800/50 text-white hover:bg-white/10 flex items-center space-x-2" data-tab="services">
                <i class="fas fa-cogs"></i>
                <span>🛠️ Servicios Onboarding</span>
            </button>
            <button class="tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-gray-800/50 text-white hover:bg-white/10 flex items-center space-x-2" data-tab="calendar">
                <i class="fas fa-calendar-alt"></i>
                <span>📅 Calendario</span>
            </button>
            <button class="tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-gray-800/50 text-white hover:bg-white/10 flex items-center space-x-2" data-tab="appointments">
                <i class="fas fa-users"></i>
                <span>👥 Citas</span>
            </button>
            <button class="tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-gray-800/50 text-white hover:bg-white/10 flex items-center space-x-2" data-tab="settings">
                <i class="fas fa-sliders-h"></i>
                <span>⚙️ Configuración</span>
            </button>
        </div>

        <!-- Contenido de Pestañas -->
        <div id="tab-contents">
            <!-- Pestaña Overview -->
            <div id="overview-tab" class="tab-content active">
                <!-- Stats Compactas - Horizontal -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
                    <!-- Card 1: Servicios -->
                    <div class="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-5 border border-blue-700/30 hover:scale-105 transition-transform duration-300">
                        <div class="flex items-center justify-between mb-2">
                            <div class="bg-blue-700/30 p-2 rounded-lg">
                                <i class="fas fa-cogs text-blue-300 text-xl"></i>
                            </div>
                            <span class="text-blue-300 text-xs font-medium">ACTIVOS</span>
                        </div>
                        <h3 class="text-3xl font-bold text-white mb-1">${businessServices.length}</h3>
                        <p class="text-blue-200 text-sm">Servicios Totales</p>
                    </div>

                    <!-- Card 2: Citas Hoy -->
                    <div class="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-5 border border-green-700/30 hover:scale-105 transition-transform duration-300">
                        <div class="flex items-center justify-between mb-2">
                            <div class="bg-green-700/30 p-2 rounded-lg">
                                <i class="fas fa-calendar-check text-green-300 text-xl"></i>
                            </div>
                            <span class="text-green-300 text-xs font-medium">HOY</span>
                        </div>
                        <h3 class="text-3xl font-bold text-white mb-1" id="today-count">0</h3>
                        <p class="text-green-200 text-sm">${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>

                    <!-- Card 3: Ingresos -->
                    <div class="bg-gradient-to-br from-yellow-900 to-yellow-800 rounded-xl p-5 border border-yellow-700/30 hover:scale-105 transition-transform duration-300">
                        <div class="flex items-center justify-between mb-2">
                            <div class="bg-yellow-700/30 p-2 rounded-lg">
                                <i class="fas fa-dollar-sign text-yellow-300 text-xl"></i>
                            </div>
                            <span class="text-yellow-300 text-xs font-medium">MES</span>
                        </div>
                        <h3 class="text-3xl font-bold text-white mb-1">$${(appointments.length * 500).toLocaleString()}</h3>
                        <p class="text-yellow-200 text-sm">Ingresos Estimados</p>
                    </div>

                    <!-- Card 4: Confirmación -->
                    <div class="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-5 border border-purple-700/30 hover:scale-105 transition-transform duration-300">
                        <div class="flex items-center justify-between mb-2">
                            <div class="bg-purple-700/30 p-2 rounded-lg">
                                <i class="fas fa-check-circle text-purple-300 text-xl"></i>
                            </div>
                            <span class="text-purple-300 text-xs font-medium">TASA</span>
                        </div>
                        <h3 class="text-3xl font-bold text-white mb-1" id="confirmation-rate">0%</h3>
                        <p class="text-purple-200 text-sm">Confirmación</p>
                    </div>
                </div>

                <!-- CALENDARIO GRANDE - PROTAGONISTA -->
                <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700/50 fade-in">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-white flex items-center">
                                <span class="bg-blue-600 w-1 h-8 rounded-full mr-3"></span>
                                📅 Calendario de Citas
                            </h2>
                            <p class="text-gray-400 text-sm mt-1">Vista mensual de todas tus citas programadas</p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="prevMonth()" class="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button onclick="nextMonth()" class="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                            <button onclick="goToToday()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                                Hoy
                            </button>
                        </div>
                    </div>

                    <!-- Calendario Container -->
                    <div class="bg-gray-800/50 rounded-xl p-4" style="min-height: 600px;">
                        <div id="calendar-header" class="text-center mb-4">
                            <h3 class="text-white text-xl font-bold" id="current-month">${moment().format('MMMM YYYY')}</h3>
                        </div>
                        <div id="calendar-grid" class="grid grid-cols-7 gap-2">
                            <!-- El calendario se renderizará aquí con JavaScript -->
                        </div>
                    </div>
                </div>

                <!-- Servicios Más Solicitados - Ancho Completo -->
                <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 fade-in">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-white flex items-center">
                                <span class="bg-green-600 w-1 h-8 rounded-full mr-3"></span>
                                📈 Servicios Más Solicitados
                            </h2>
                            <p class="text-gray-400 text-sm mt-1">Basado en tus citas históricas</p>
                        </div>
                        <div class="bg-gray-800 px-4 py-2 rounded-lg">
                            <span class="text-green-400 font-medium text-sm">● Actualizado</span>
                        </div>
                    </div>
                    <div class="h-80">
                        <canvas id="servicesChart"></canvas>
                    </div>
                </div>
            </div>
            <div id="services-tab" class="tab-content hidden">
                <div class="glass-card rounded-2xl p-6 mb-8">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">🛠️ Servicios del Onboarding</h2>
                            <p class="text-gray-500">Gestión completa de servicios configurados durante el onboarding</p>
                        </div>
                        <div class="flex space-x-3">
                            <button onclick="exportServices()"
                                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center space-x-2">
                                <i class="fas fa-download"></i>
                                <span>Exportar</span>
                            </button>
                            <button onclick="showAddServiceModal()"
                                    class="btn-primary flex items-center space-x-2">
                                <i class="fas fa-plus"></i>
                                <span>Nuevo Servicio</span>
                            </button>
                        </div>
                    </div>

                    <!-- Filtros y Búsqueda -->
                    <div class="flex flex-col md:flex-row gap-4 mb-6">
                        <div class="flex-1">
                            <div class="relative">
                                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                                <input type="text"
                                       id="service-search"
                                       placeholder="Buscar servicios por nombre, categoría o descripción..."
                                       class="input-field pl-10"
                                       onkeyup="filterServices()">
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <select id="category-filter" class="input-field" onchange="filterServices()">
                                <option value="">Todas las categorías</option>
                                <option value="dentist">Dentista General</option>
                                <option value="cleaning">Limpieza</option>
                                <option value="whitening">Blanqueamiento</option>
                                <option value="implants">Implantes</option>
                                <option value="general">General</option>
                            </select>
                            <select id="status-filter" class="input-field" onchange="filterServices()">
                                <option value="">Todos los estados</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                        </div>
                    </div>

                    <!-- Estadísticas de Servicios -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div class="bg-blue-50 p-4 rounded-xl">
                            <p class="text-blue-700 text-sm font-medium">Total Servicios</p>
                            <p class="text-2xl font-bold text-blue-900" id="total-services">0</p>
                        </div>
                        <div class="bg-green-50 p-4 rounded-xl">
                            <p class="text-green-700 text-sm font-medium">Servicios Activos</p>
                            <p class="text-2xl font-bold text-green-900" id="active-services">0</p>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-xl">
                            <p class="text-yellow-700 text-sm font-medium">Con Pago Online</p>
                            <p class="text-2xl font-bold text-yellow-900" id="online-payment">0</p>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-xl">
                            <p class="text-purple-700 text-sm font-medium">Ingreso Promedio</p>
                            <p class="text-2xl font-bold text-purple-900" id="avg-price">$0</p>
                        </div>
                    </div>

                    <!-- Lista de Servicios -->
                    <div id="services-container">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="services-grid">
                            <!-- JS will populate -->
                        </div>
                    </div>


                        <div class="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl hidden" id="no-services-state">
                            <div class="text-gray-400 text-6xl mb-4">
                                <i class="fas fa-cogs"></i>
                            </div>
                            <h3 class="text-xl font-medium text-gray-600 mb-2">No hay servicios configurados</h3>
                            <p class="text-gray-500 mb-6">Comienza agregando tus primeros servicios desde el onboarding</p>
                            <button onclick="showAddServiceModal()"
                                    class="btn-primary px-6 py-3">
                                <i class="fas fa-plus mr-2"></i>
                                Agregar Primer Servicio
                            </button>
                        </div>


                    <!-- Nota de Integración -->
                    <div class="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div class="flex items-start">
                            <div class="mr-4 text-2xl text-blue-600">
                                <i class="fas fa-link"></i>
                            </div>
                            <div>
                                <p class="font-medium text-blue-900 text-lg">Integración Completa con Bot</p>
                                <p class="text-blue-700 mt-1">
                                    Estos servicios están disponibles automáticamente en tu bot de WhatsApp.
                                    Los clientes pueden consultar precios, horarios y agendar citas directamente.
                                </p>
                                <div class="mt-3 flex items-center space-x-4 text-sm">
                                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                        <i class="fas fa-robot mr-1"></i> Bot Conectado
                                    </span>
                                    <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                                        <i class="fas fa-sync-alt mr-1"></i> Sincronización Activa
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pestaña Calendario -->
            <div id="calendar-tab" class="tab-content hidden">
                <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 fade-in">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-white flex items-center">
                                <span class="bg-blue-600 w-1 h-8 rounded-full mr-3"></span>
                                📅 Gestión de Calendario
                            </h2>
                            <p class="text-gray-400 text-sm mt-1">Administra todas tus citas y disponibilidad</p>
                        </div>
                        <button onclick="createNewAppointment()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2">
                            <i class="fas fa-plus"></i>
                            <span>Nueva Cita</span>
                        </button>
                    </div>

                    <!-- Filtros y Vistas -->
                    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                        <div class="lg:col-span-3 flex space-x-2">
                            <button onclick="changeCalendarView('day')" class="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors" id="view-day">
                                Día
                            </button>
                            <button onclick="changeCalendarView('week')" class="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors" id="view-week">
                                Semana
                            </button>
                            <button onclick="changeCalendarView('month')" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors" id="view-month">
                                Mes
                            </button>
                        </div>
                        <input type="date" id="calendar-date-picker" class="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2" onchange="jumpToDate(this.value)">
                    </div>

                    <!-- Calendario Grande (ya renderizado en overview) -->
                    <div class="bg-gray-800/50 rounded-xl p-4" style="min-height: 700px;">
                        <div id="calendar-full-view" class="h-full">
                            <!-- Se renderiza con JavaScript -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pestaña Citas -->
            <div id="appointments-tab" class="tab-content hidden">
                <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 fade-in">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-white flex items-center">
                                <span class="bg-green-600 w-1 h-8 rounded-full mr-3"></span>
                                👥 Gestión de Citas
                            </h2>
                            <p class="text-gray-400 text-sm mt-1">Lista completa de todas las citas programadas</p>
                        </div>
                        <button onclick="createNewAppointment()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2">
                            <i class="fas fa-calendar-plus"></i>
                            <span>Agendar Cita</span>
                        </button>
                    </div>

                    <!-- Filtros -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <input type="text" id="search-appointments" placeholder="🔍 Buscar por nombre o teléfono..." class="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2" onkeyup="filterAppointments()">
                        <select id="status-filter-apt" class="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2" onchange="filterAppointments()">
                            <option value="">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="confirmed">Confirmadas</option>
                            <option value="cancelled">Canceladas</option>
                            <option value="completed">Completadas</option>
                        </select>
                        <select id="service-filter-apt" class="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2" onchange="filterAppointments()">
                            <option value="">Todos los servicios</option>
                        </select>
                        <input type="date" id="date-filter-apt" class="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2" onchange="filterAppointments()">
                    </div>

                    <!-- Stats Rápidas -->
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div class="bg-blue-900/50 border border-blue-700/30 rounded-xl p-4">
                            <p class="text-blue-300 text-sm mb-1">Total Citas</p>
                            <p class="text-3xl font-bold text-white" id="total-appointments">0</p>
                        </div>
                        <div class="bg-yellow-900/50 border border-yellow-700/30 rounded-xl p-4">
                            <p class="text-yellow-300 text-sm mb-1">Pendientes</p>
                            <p class="text-3xl font-bold text-white" id="pending-appointments">0</p>
                        </div>
                        <div class="bg-green-900/50 border border-green-700/30 rounded-xl p-4">
                            <p class="text-green-300 text-sm mb-1">Confirmadas</p>
                            <p class="text-3xl font-bold text-white" id="confirmed-appointments">0</p>
                        </div>
                        <div class="bg-purple-900/50 border border-purple-700/30 rounded-xl p-4">
                            <p class="text-purple-300 text-sm mb-1">Hoy</p>
                            <p class="text-3xl font-bold text-white" id="today-appointments">0</p>
                        </div>
                    </div>

                    <!-- Lista de Citas -->
                    <div id="appointments-list" class="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        <!-- Se renderiza con JavaScript -->
                    </div>
                </div>
            </div>

            <!-- Pestaña Configuración -->
            <div id="settings-tab" class="tab-content hidden">
                <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 fade-in">
                    <div class="mb-6">
                        <h2 class="text-2xl font-bold text-white flex items-center">
                            <span class="bg-purple-600 w-1 h-8 rounded-full mr-3"></span>
                            ⚙️ Configuración
                        </h2>
                        <p class="text-gray-400 text-sm mt-1">Administra la configuración de tu negocio</p>
                    </div>

                    <div class="text-white text-center py-20">
                        <i class="fas fa-tools text-6xl text-gray-600 mb-4"></i>
                        <p class="text-xl text-gray-400">Próximamente: Configuración de usuario, horarios y más...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal para agregar/editar servicio -->
    <div id="service-modal-overlay" class="modal-overlay">
        <div class="modal-content">
            <div class="p-6 border-b border-gray-200">
                <h3 id="modal-title" class="text-xl font-bold text-gray-800">Nuevo Servicio</h3>
                <p id="modal-subtitle" class="text-gray-500 text-sm mt-1">Configura los detalles del servicio</p>
            </div>

            <div class="p-6">
                <form id="service-form" onsubmit="handleServiceSubmit(event)">
                    <input type="hidden" id="service-id">

                    <div class="space-y-4">
                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">Nombre del Servicio *</label>
                            <input type="text"
                                   id="service-name"
                                   class="input-field"
                                   placeholder="Ej: Limpieza dental profesional"
                                   required>
                        </div>

                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">Descripción</label>
                            <textarea id="service-description"
                                     class="input-field h-24"
                                     placeholder="Describe el servicio para los clientes..."></textarea>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-700 text-sm font-medium mb-2">Duración (minutos)</label>
                                <input type="number"
                                       id="service-duration"
                                       class="input-field"
                                       value="30"
                                       min="5"
                                       max="480"
                                       required>
                            </div>

                            <div>
                                <label class="block text-gray-700 text-sm font-medium mb-2">Precio ($)</label>
                                <input type="number"
                                       id="service-price"
                                       class="input-field"
                                       value="1000"
                                       min="0"
                                       required>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-700 text-sm font-medium mb-2">Categoría</label>
                                <select id="service-category" class="input-field">
                                    <option value="general">General</option>
                                    <option value="dentist">Dentista</option>
                                    <option value="cleaning">Limpieza</option>
                                    <option value="whitening">Blanqueamiento</option>
                                    <option value="implants">Implantes</option>
                                    <option value="orthodontics">Ortodoncia</option>
                                    <option value="surgery">Cirugía</option>
                                    <option value="emergency">Emergencia</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-gray-700 text-sm font-medium mb-2">Tipo de Pago</label>
                                <select id="service-payment-type" class="input-field">
                                    <option value="office">Pago en consultorio</option>
                                    <option value="online">Pago online disponible</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex items-center space-x-4">
                            <div class="flex items-center">
                                <input type="checkbox"
                                       id="service-active"
                                       class="h-4 w-4 text-blue-600 border-gray-300 rounded">
                                <label for="service-active" class="ml-2 text-gray-700 text-sm">
                                    Servicio activo y disponible
                                </label>
                            </div>

                            <div class="flex items-center">
                                <input type="checkbox"
                                       id="service-commission"
                                       class="h-4 w-4 text-blue-600 border-gray-300 rounded">
                                <label for="service-commission" class="ml-2 text-gray-700 text-sm">
                                    Incluir comisión (%)
                                </label>
                            </div>
                        </div>

                        <div id="commission-field" class="hidden">
                            <label class="block text-gray-700 text-sm font-medium mb-2">Porcentaje de Comisión</label>
                            <input type="number"
                                   id="service-commission-value"
                                   class="input-field"
                                   value="10"
                                   min="0"
                                   max="50">
                        </div>
                    </div>

                    <div class="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                        <button type="button"
                                onclick="closeServiceModal()"
                                class="btn-secondary px-6">
                            Cancelar
                        </button>
                        <button type="submit"
                                class="btn-primary px-6">
                            <span id="modal-submit-text">Guardar Servicio</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        let businessId = "";
        let businessSlug = "";
        let businessPlan = "";
        
        const appointments = []; 
        const calendarData = {}; 
        let businessServices = []; 
        let filteredServices = [];

        let currentDate = moment();
        let currentView = 'month';
        let loadedMonths = new Set();
        let selectedDate = moment().format('YYYY-MM-DD');
        let selectedAppointment = null;
        let editingServiceId = null;

        // Cargar datos iniciales
        async function loadInitialData() {
            // Extraer slug del URL si es necesario o usar el pathname
            const pathParts = window.location.pathname.split('/');
            // Asumimos que la URL es /dashboard-pro/:slug
            const urlIdentifier = pathParts.pop() || pathParts.pop(); 
            
            console.log('=== DEBUG loadInitialData INICIANDO ===');

            try {
                // Primero obtenemos info básica del negocio
                const businessRes = await fetch('/api/business/' + urlIdentifier);
                if (businessRes.ok) {
                    const businessData = await businessRes.json();
                    businessId = businessData._id;
                    businessSlug = businessData.slug || businessData._id;
                    businessPlan = businessData.plan;
                    console.log('Business data loaded:', {businessId, businessSlug});
                } else {
                    throw new Error('No se pudo cargar la información del negocio');
                }

                showToast('Cargando datos...', 'info');

                // Ahora cargamos servicios y citas usando el slug confirmado
                const [servicesRes, appointmentsRes] = await Promise.all([
                    fetch(\`/api/business/\${businessSlug}/services\`),
                    fetch(\`/api/business/\${businessSlug}/appointments?month=\${currentDate.month()+1}&year=\${currentDate.year()}\`)
                ]);

                if (!servicesRes.ok || !appointmentsRes.ok) {
                    throw new Error('Error en respuesta de API de datos');
                }

                businessServices = await servicesRes.json();
                filteredServices = [...businessServices];
                const appointmentsData = await appointmentsRes.json();

                // Procesar calendarData
                appointmentsData.forEach(apt => {
                    const date = moment(apt.dateTime).format('YYYY-MM-DD');
                    if (!calendarData[date]) calendarData[date] = [];
                    calendarData[date].push(apt);
                    appointments.push(apt);
                });

                // Actualizar UI
                renderServicesGrid();
                renderCalendar();
                updateStats();

                showToast('Datos cargados correctamente', 'success');
            } catch (error) {
                console.error('Error loading initial data:', error);
                showToast('Error al cargar datos: ' + error.message, 'error');
            }
        }

        // Iniciar carga de datos
        setTimeout(() => loadInitialData(), 100);

        // Inicialización
        document.addEventListener('DOMContentLoaded', function() {
            moment.locale('es');
            updateStats();
            initTabs();
            // initChart se llamará cuando tengamos datos
            // renderServicesGrid se llamará cuando tengamos datos
            initMiniCalendar();
            
            // Escuchar cambios en checkboxes
            const commCheck = document.getElementById('service-commission');
            if(commCheck) {
                commCheck.addEventListener('change', function() {
                    document.getElementById('commission-field').classList.toggle('hidden', !this.checked);
                });
            }
        });

        // =============================================
        // FUNCIONES DEL CALENDARIO GRANDE
        // =============================================

        async function renderCalendar() {
            const year = currentDate.year();
            const month = currentDate.month() + 1; 

            // Cargar citas de este mes si no las tenemos
            const monthKey = \`\${year}-\${month.toString().padStart(2, '0')}\`;
            if (!loadedMonths.has(monthKey)) {
                await fetchMonthAppointments(month, year);
                loadedMonths.add(monthKey);
            }

            const firstDay = moment([year, month - 1, 1]);
            const lastDay = moment(firstDay).endOf('month');
            const startDate = moment(firstDay).startOf('week');
            const endDate = moment(lastDay).endOf('week');

            const monthTitle = document.getElementById('current-month');
            if(monthTitle) monthTitle.textContent = currentDate.format('MMMM YYYY');

            const grid = document.getElementById('calendar-grid');
            if(!grid) return;
            grid.innerHTML = '';

            const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            weekDays.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'text-center text-gray-400 font-semibold text-sm py-2';
                dayHeader.textContent = day;
                grid.appendChild(dayHeader);
            });

            let day = startDate.clone();
            while (day.isSameOrBefore(endDate)) {
                const dayStr = day.format('YYYY-MM-DD');
                const isCurrentMonth = day.month() === month - 1; // moment months 0-11
                const isToday = day.isSame(moment(), 'day');
                
                // Filtrar citas del día
                const dayAppointments = (calendarData[dayStr] || []);

                const dayCell = document.createElement('div');
                let classes = 'relative p-3 rounded-lg cursor-pointer transition-all duration-200 ';
                classes += isCurrentMonth ? 'bg-gray-800 hover:bg-gray-700 ' : 'bg-gray-900/50 opacity-50 ';
                classes += isToday ? 'ring-2 ring-blue-500 ' : '';
                classes += dayAppointments.length > 0 ? 'border-l-4 border-green-500' : '';
                dayCell.className = classes;

                const dayNum = document.createElement('div');
                dayNum.className = 'text-white font-semibold mb-1';
                dayNum.textContent = day.date();
                dayCell.appendChild(dayNum);

                if (dayAppointments.length > 0) {
                    const aptsContainer = document.createElement('div');
                    aptsContainer.className = 'space-y-1';

                    dayAppointments.slice(0, 3).forEach(apt => {
                        const aptDiv = document.createElement('div');
                        aptDiv.className = 'text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded truncate';
                        aptDiv.textContent = moment(apt.dateTime).format('HH:mm') + ' - ' + (apt.clientName || 'Cliente');
                        aptsContainer.appendChild(aptDiv);
                    });

                    if (dayAppointments.length > 3) {
                        const moreDiv = document.createElement('div');
                        moreDiv.className = 'text-xs text-gray-400 text-center';
                        moreDiv.textContent = '+' + (dayAppointments.length - 3) + ' más';
                        aptsContainer.appendChild(moreDiv);
                    }

                    dayCell.appendChild(aptsContainer);
                }

                dayCell.onclick = () => showDayDetails(dayStr, dayAppointments);
                grid.appendChild(dayCell);

                day.add(1, 'day');
            }
        }

        function prevMonth() {
            currentDate.subtract(1, 'month');
            renderCalendar();
        }

        function nextMonth() {
            currentDate.add(1, 'month');
            renderCalendar();
        }

        function goToToday() {
            currentDate = moment();
            renderCalendar();
        }
        function changeCalendarView(view) {
            currentView = view;
            renderCalendar();
        }

        function filterAppointments(filter) {
            console.log('Filtrando citas por:', filter);
            // Implementar lógica de filtrado
            showToast('Filtro aplicado (demo)', 'info');
        }

        async function fetchMonthAppointments(month, year) {
            if(!businessSlug) return;
            try {
                // Corrección de sintaxis de template string aquí
                const response = await fetch(\`/api/business/\${businessSlug}/appointments?month=\${month}&year=\${year}\`);
                if (!response.ok) throw new Error('Error fetching appointments');
                const data = await response.json();

                // Actualizar calendarData con las nuevas citas
                data.forEach(apt => {
                    const date = moment(apt.dateTime).format('YYYY-MM-DD');
                    if (!calendarData[date]) calendarData[date] = [];
                    // Evitar duplicados
                    const exists = calendarData[date].some(a => a._id === apt._id);
                    if (!exists) {
                        calendarData[date].push(apt);
                        // También actualizar lista global de appointments si no existe
                        if(!appointments.some(a => a._id === apt._id)) {
                             appointments.push(apt);
                        }
                    }
                });

                return data;
            } catch (error) {
                console.error('Error fetching appointments:', error);
                showToast('Error al cargar citas del mes', 'error');
                return [];
            }
        }

        function showDayDetails(dayStr, dayAppointments) {
            if (!dayAppointments || dayAppointments.length === 0) {
                showToast('No hay citas programadas para este día', 'info');
                return;
            }
            alert('Citas del día: ' + moment(dayStr).format('DD MMMM YYYY') + '\\n\\n' +
                  dayAppointments.map(apt => (apt.clientName || 'Cliente') + ' - ' + moment(apt.dateTime).format('HH:mm')).join('\\n'));
        }


        // =============================================
        // FUNCIONES DE SERVICIOS
        // =============================================

        function renderServiceCard(service) {
            const iconClass = getServiceIconClass(service);
            const icon = getServiceIcon(service);
            const paymentBadge = service.requiresPayment ? 'badge-online' : 'badge-office';
            const paymentText = service.requiresPayment ? '💳 Pago Online' : '🏥 Pago Consultorio';
            const isActive = service.active ? 'badge-active' : 'badge-inactive';
            const statusText = service.active ? 'Activo' : 'Inactivo';

            return \`
                <div class="service-card glass-card rounded-xl p-5 hover:shadow-lg transition-all duration-300" data-service-id="\${service._id}">
                    <div class="flex items-start mb-4">
                        <div class="service-icon \${iconClass} flex-shrink-0">
                            <i class="\${icon}"></i>
                        </div>
                        <div class="flex-1 ml-4">
                            <div class="flex justify-between items-start">
                                <h3 class="font-bold text-lg text-gray-800 truncate">\${service.name}</h3>
                                <span class="text-xl font-bold text-gray-800">$\${service.price}</span>
                            </div>
                            \${service.description ? \`
                                <p class="text-gray-600 text-sm mt-2 line-clamp-2">\${service.description}</p>
                            \` : ''}
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="service-badge \${isActive}">
                            \${statusText}
                        </span>
                        <span class="service-badge \${paymentBadge}">
                            \${paymentText}
                        </span>
                        <span class="service-badge bg-blue-100 text-blue-800">
                            ⏱️ \${service.duration || 30} min
                        </span>
                        <span class="service-badge bg-purple-100 text-purple-800">
                            📁 \${service.category || 'general'}
                        </span>
                        \${service.commission > 0 ? \`
                            <span class="service-badge bg-pink-100 text-pink-800">
                                👑 \${service.commission}%
                            </span>
                        \` : ''}
                    </div>

                    <div class="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div class="text-sm text-gray-500">
                            \${service.createdAt ? \`Creado: \${moment(service.createdAt).format('DD/MM/YY')}\` : 'Sin fecha'}
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="editService('\${service._id}')"
                                    class="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                                <i class="fas fa-edit mr-1"></i> Editar
                            </button>
                            <button onclick="deleteService('\${service._id}')"
                                    class="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium">
                                <i class="fas fa-trash mr-1"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            \`;
        }

        function renderServicesGrid() {
            const container = document.getElementById('services-grid');
            const noServicesState = document.getElementById('no-services-state');
            if (!container) return;

            if (filteredServices.length === 0) {
                 container.innerHTML = '';
                 if(businessServices.length === 0 && noServicesState) {
                    noServicesState.classList.remove('hidden');
                 }
                 return;
            }
            
            if(noServicesState) noServicesState.classList.add('hidden');
            container.innerHTML = filteredServices.map(service => renderServiceCard(service)).join('');

            // Actualizar estadísticas
            document.getElementById('total-services').textContent = businessServices.length;
            document.getElementById('active-services').textContent = businessServices.filter(s => s.active).length;
            document.getElementById('online-payment').textContent = businessServices.filter(s => s.requiresPayment).length;

            const avgPrice = businessServices.length > 0
                ? Math.round(businessServices.reduce((a,b) => a + (b.price || 0), 0) / businessServices.length)
                : 0;
            document.getElementById('avg-price').textContent = '$' + avgPrice;
            
            initChart(); // Actualizar gráfico
        }

        function filterServices() {
            const searchTerm = document.getElementById('service-search').value.toLowerCase();
            const categoryFilter = document.getElementById('category-filter').value;
            const statusFilter = document.getElementById('status-filter').value;

            filteredServices = businessServices.filter(service => {
                const matchesSearch = !searchTerm ||
                    service.name.toLowerCase().includes(searchTerm) ||
                    (service.description && service.description.toLowerCase().includes(searchTerm)) ||
                    (service.category && service.category.toLowerCase().includes(searchTerm));

                const matchesCategory = !categoryFilter || service.category === categoryFilter;
                const matchesStatus = !statusFilter ||
                    (statusFilter === 'active' && service.active) ||
                    (statusFilter === 'inactive' && !service.active);

                return matchesSearch && matchesCategory && matchesStatus;
            });

            renderServicesGrid();
        }

        function showAddServiceModal() {
            editingServiceId = null;
            document.getElementById('modal-title').textContent = 'Nuevo Servicio';
            document.getElementById('modal-subtitle').textContent = 'Configura los detalles del servicio';
            document.getElementById('modal-submit-text').textContent = 'Guardar Servicio';

            // Reset form
            document.getElementById('service-form').reset();
            document.getElementById('service-id').value = '';
            document.getElementById('service-duration').value = '30';
            document.getElementById('service-price').value = '1000';
            document.getElementById('service-category').value = 'general';
            document.getElementById('service-payment-type').value = 'office';
            document.getElementById('service-active').checked = true;
            document.getElementById('service-commission').checked = false;
            document.getElementById('commission-field').classList.add('hidden');

            document.getElementById('service-modal-overlay').classList.add('active');
        }

        function editService(serviceId) {
            const service = businessServices.find(s => s._id === serviceId);
            if (!service) return;

            editingServiceId = serviceId;
            document.getElementById('modal-title').textContent = 'Editar Servicio';
            document.getElementById('modal-subtitle').textContent = 'Modifica los detalles del servicio';
            document.getElementById('modal-submit-text').textContent = 'Actualizar Servicio';

            // Fill form
            document.getElementById('service-id').value = service._id;
            document.getElementById('service-name').value = service.name;
            document.getElementById('service-description').value = service.description || '';
            document.getElementById('service-duration').value = service.duration || 30;
            document.getElementById('service-price').value = service.price || 0;
            document.getElementById('service-category').value = service.category || 'general';
            document.getElementById('service-payment-type').value = service.requiresPayment ? 'online' : 'office';
            document.getElementById('service-active').checked = service.active !== false;
            document.getElementById('service-commission').checked = !!service.commission;
            document.getElementById('service-commission-value').value = service.commission || 10;

            if (service.commission) {
                document.getElementById('commission-field').classList.remove('hidden');
            }

            document.getElementById('service-modal-overlay').classList.add('active');
        }

        async function handleServiceSubmit(event) {
            event.preventDefault();

            const formData = {
                name: document.getElementById('service-name').value,
                description: document.getElementById('service-description').value,
                duration: parseInt(document.getElementById('service-duration').value),
                price: parseInt(document.getElementById('service-price').value),
                category: document.getElementById('service-category').value,
                requiresPayment: document.getElementById('service-payment-type').value === 'online',
                active: document.getElementById('service-active').checked,
                customService: true,
                basePrice: parseInt(document.getElementById('service-price').value)
            };

            const hasCommission = document.getElementById('service-commission').checked;
            if (hasCommission) {
                formData.commission = parseInt(document.getElementById('service-commission-value').value);
            }

            try {
                let url = \`/api/business/\${businessSlug}/services\`;
                let method = 'POST';

                if (editingServiceId) {
                    url += \`/\${editingServiceId}\`;
                    method = 'PUT';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const result = await response.json();

                if (result.success) {
                    closeServiceModal();

                    // Recargar servicios
                    const businessResponse = await fetch(\`/api/business/\${businessSlug}\`);
                    const updatedBusiness = await businessResponse.json();
                    businessServices = updatedBusiness.services || [];
                    filteredServices = [...businessServices];

                    renderServicesGrid();
                    updateStats();
                    initChart();

                    showToast('¡Servicio guardado exitosamente!', 'success');
                } else {
                    throw new Error(result.error || 'Error al guardar');
                }

            } catch (error) {
                console.error('Error al guardar servicio:', error);
                showToast('Error al guardar el servicio', 'error');
            }
        }

        function closeServiceModal() {
            document.getElementById('service-modal-overlay').classList.remove('active');
        }

        async function deleteService(serviceId) {
            if (!confirm('¿Estás seguro de eliminar este servicio? Esta acción no se puede deshacer.')) {
                return;
            }

            try {
                const response = await fetch(\`/api/business/\${businessSlug}/services/\${serviceId}\`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Error al eliminar servicio');
                }

                const result = await response.json();
                if (result.success) {
                    // Actualizar lista local
                    businessServices = businessServices.filter(s => s._id !== serviceId);
                    filteredServices = filteredServices.filter(s => s._id !== serviceId);

                    renderServicesGrid();
                    updateStats();
                    initChart();

                    showToast('Servicio eliminado exitosamente', 'success');
                }

            } catch (error) {
                console.error('Error eliminando servicio:', error);
                showToast('Error al eliminar el servicio', 'error');
            }
        }

        function exportServices() {
            const dataStr = JSON.stringify(businessServices, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

            const exportFileDefaultName = \`servicios-\${businessSlug}-\${moment().format('YYYY-MM-DD')}.json\`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        }

        // =============================================
        // FUNCIONES AUXILIARES
        // =============================================

        function getServiceIconClass(service) {
            const category = service.category || 'general';
            switch(category) {
                case 'dentist': return 'service-dentist';
                case 'cleaning': return 'service-cleaning';
                case 'whitening': return 'service-whitening';
                case 'implants': return 'service-implants';
                case 'orthodontics': return 'service-dentist';
                case 'surgery': return 'service-implants';
                case 'emergency': return 'service-general';
                default: return 'service-general';
            }
        }

        function getServiceIcon(service) {
            const category = service.category || 'general';
            switch(category) {
                case 'dentist': return 'fas fa-tooth';
                case 'cleaning': return 'fas fa-broom';
                case 'whitening': return 'fas fa-star';
                case 'implants': return 'fas fa-teeth';
                case 'orthodontics': return 'fas fa-teeth-open';
                case 'surgery': return 'fas fa-syringe';
                case 'emergency': return 'fas fa-ambulance';
                default: return 'fas fa-stethoscope';
            }
        }

        function showToast(message, type = 'info') {
            // Crear toast
            const toast = document.createElement('div');
            toast.className = \`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium shadow-lg z-50 transform translate-x-full transition-transform duration-300 \${
                type === 'success' ? 'bg-green-500' :
                type === 'error' ? 'bg-red-500' :
                'bg-blue-500'
            }\`;
            toast.textContent = message;
            toast.id = 'toast-' + Date.now();

            document.body.appendChild(toast);

            // Mostrar
            setTimeout(() => {
                toast.classList.remove('translate-x-full');
            }, 10);

            // Ocultar después de 3 segundos
            setTimeout(() => {
                toast.classList.add('translate-x-full');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }

        // =============================================
        // FUNCIONES EXISTENTES (actualizadas)
        // =============================================

        function updateStats() {
            const today = moment().format('YYYY-MM-DD');
            const todayAppointments = appointments.filter(apt =>
                moment(apt.dateTime).format('YYYY-MM-DD') === today
            );
            const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
            const confirmationRate = appointments.length > 0
                ? Math.round((confirmedAppointments.length / appointments.length) * 100)
                : 0;

            const todayEl = document.getElementById('today-count');
            if(todayEl) todayEl.textContent = todayAppointments.length;
            
            const rateEl = document.getElementById('confirmation-rate');
            if(rateEl) rateEl.textContent = confirmationRate + '%';
        }

        function initTabs() {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tab = this.getAttribute('data-tab');
                    switchTab(tab);
                });
            });
        }

        function switchTab(tabName) {
            // Actualizar botones activos
            document.querySelectorAll('.tab-btn').forEach(btn => {
                if (btn.getAttribute('data-tab') === tabName) {
                    btn.classList.remove('bg-gray-800/50', 'text-white', 'hover:bg-white/10');
                    btn.classList.add('bg-white', 'text-blue-900', 'shadow-lg');
                } else {
                    btn.classList.remove('bg-white', 'text-blue-900', 'shadow-lg');
                    btn.classList.add('bg-gray-800/50', 'text-white', 'hover:bg-white/10');
                }
            });

            // Mostrar/ocultar contenido
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });

            const activeTab = document.getElementById(tabName + '-tab');
            if (activeTab) {
                activeTab.classList.remove('hidden');
                activeTab.classList.add('active');

                // Cargar servicios si es la pestaña de servicios y está vacía
                if (tabName === 'services' && filteredServices.length === 0) {
                    renderServicesGrid();
                }
            }
        }

        function initChart() {
            const ctx = document.getElementById('servicesChart');
            if (!ctx) return;

            // Destruir gráfico previo si existe para evitar superposiciones
            const existingChart = Chart.getChart(ctx);
            if(existingChart) existingChart.destroy();

            const categories = {};
            businessServices.forEach(service => {
                const category = service.category || 'general';
                categories[category] = (categories[category] || 0) + 1;
            });

            new Chart(ctx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categories),
                    datasets: [{
                        data: Object.values(categories),
                        backgroundColor: [
                            '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'
                        ],
                        borderWidth: 2,
                        borderColor: 'white'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = businessServices.length;
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return \`\${label}: \${value} servicios (\${percentage}%)\`;
                                }
                            }
                        }
                    }
                }
            });
        }

        function initMiniCalendar() {
            const container = document.getElementById('mini-calendar-container');
            if (!container) return;
            container.innerHTML = ''; // Limpiar

            const today = moment();
            const currentMonth = today.format('MMMM YYYY');
            const startOfMonth = today.clone().startOf('month');
            const startDay = startOfMonth.day();
            const daysInMonth = today.daysInMonth();

            // Días de la semana
            ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.className = 'text-center text-xs font-medium p-2 text-gray-500';
                dayElement.textContent = day;
                container.appendChild(dayElement);
            });

            // Días vacíos al inicio
            for (let i = 0; i < startDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'text-center p-2';
                container.appendChild(emptyDay);
            }

            // Días del mes
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement('div');
                const date = today.clone().date(day);
                const dateStr = date.format('YYYY-MM-DD');
                const dayAppointments = calendarData[dateStr] || [];
                const isToday = dateStr === moment().format('YYYY-MM-DD');

                dayElement.className = \`text-center p-2 rounded-lg text-sm font-medium cursor-pointer transition-all \${
                    dayAppointments.length > 0
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                } \${
                    isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                }\`;

                dayElement.textContent = day;
                dayElement.title = dayAppointments.length > 0
                    ? \`\${dayAppointments.length} citas\`
                    : 'Sin citas';

                dayElement.onclick = () => {
                    selectedDate = dateStr;
                    switchTab('calendar');
                };

                container.appendChild(dayElement);
            }
        }
    </script>
</body>
</html>
    `);
  } catch (error) {
    console.error('Error en dashboard pro:', error);
    res.status(500).send('Error cargando dashboard profesional');
  }
});

module.exports = router;
