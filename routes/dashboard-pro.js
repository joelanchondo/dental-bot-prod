const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const moment = require('moment');
const mongoose = require('mongoose');

// =========================================================
// 1. API ROUTES (Relativas al Dashboard para evitar 404)
// =========================================================

// GET - Info del negocio
router.get("/:identifier/data/info", async (req, res) => {
  try {
    let business;
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }
    if (!business) return res.status(404).json({ error: "Negocio no encontrado" });
    res.json({ ...business.toObject(), services: business.services || [] });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET - Servicios
router.get("/:identifier/data/services", async (req, res) => {
  try {
    let business;
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }
    if (!business) return res.status(404).json({ error: "Negocio no encontrado" });
    res.json(business.services || []);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET - Citas
router.get("/:identifier/data/appointments", async (req, res) => {
    try {
        const { identifier } = req.params;
        const { month, year } = req.query;
        let business;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            business = await Business.findById(identifier);
        } else {
            business = await Business.findOne({ slug: identifier });
        }
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const appointments = await Appointment.find({
            businessId: business._id,
            dateTime: { $gte: startDate, $lte: endDate }
        }).sort({ dateTime: 1 });

        res.json(appointments);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST - Crear Servicio
router.post("/:identifier/data/services", async (req, res) => {
  try {
    let business;
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }
    if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

    const { name, description, duration, price, category, active, requiresPayment, commission } = req.body;
    
    const newService = {
      name, description, duration: parseInt(duration || 30), price: parseInt(price || 0),
      category: category || 'general', active: active !== false,
      requiresPayment: requiresPayment === true, commission: parseInt(commission || 0),
      createdAt: new Date(), updatedAt: new Date()
    };

    business.services.push(newService);
    await business.save();
    res.json({ success: true, service: newService, services: business.services });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// PUT - Actualizar Servicio
router.put("/:identifier/data/services/:serviceId", async (req, res) => {
  try {
    let business;
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }
    if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

    const service = business.services.id(req.params.serviceId);
    if (!service) return res.status(404).json({ error: "Servicio no encontrado" });

    Object.assign(service, req.body);
    service.updatedAt = new Date();
    
    await business.save();
    res.json({ success: true, service, services: business.services });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE - Eliminar Servicio
router.delete("/:identifier/data/services/:serviceId", async (req, res) => {
  try {
    let business;
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }
    if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

    business.services.pull({ _id: req.params.serviceId });
    await business.save();
    res.json({ success: true, services: business.services });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =========================================================
// 2. VISTA DASHBOARD (SSR Inicial + Diseño Completo)
// =========================================================

router.get('/:identifier', async (req, res) => {
  try {
    let business;
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }

    if (!business) return res.status(404).send('Negocio no encontrado');

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
            --primary-blue: #0f172a; --secondary-blue: #1e293b; --accent-gold: #f59e0b;
            --light-gold: #fbbf24; --success-green: #10b981; --danger-red: #ef4444;
        }
        body { background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%); min-height: 100vh; font-family: 'Inter', sans-serif; }
        
        .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
        .tab-content { display: none; }
        .tab-content.active { display: block; animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Badges */
        .service-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
        .badge-active { background: #d1fae5; color: #065f46; }
        .badge-inactive { background: #f3f4f6; color: #4b5563; }
        .badge-online { background: #e0e7ff; color: #3730a3; }
        .badge-office { background: #fef3c7; color: #92400e; }
        
        /* Icons */
        .service-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-right: 16px; }
        .service-dentist { background: #dbeafe; color: #1e40af; }
        .service-cleaning { background: #d1fae5; color: #065f46; }
        .service-general { background: #f3f4f6; color: #4b5563; }

        /* Modal */
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal-overlay.active { display: flex; }
        .modal-content { background: white; border-radius: 20px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        
        .input-field { border: 2px solid #e5e7eb; border-radius: 10px; padding: 12px 16px; font-size: 14px; width: 100%; transition: all 0.3s ease; }
        .input-field:focus { outline: none; border-color: var(--accent-gold); }
    </style>
</head>
<body class="text-gray-800">
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div class="container mx-auto px-6 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <div class="bg-white/20 p-3 rounded-xl"><span class="text-2xl">🏢</span></div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">${business.businessName}</h1>
                        <p class="text-blue-100 text-sm">Dashboard Profesional | ${business.slug}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="bg-black/20 rounded-full px-4 py-2">
                        <span class="text-yellow-400 font-bold">${business.plan ? business.plan.toUpperCase() : 'STANDARD'}</span>
                    </div>
                    <div class="text-right hidden md:block">
                        <div class="flex items-center">
                            <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <p class="text-green-400 font-bold text-sm">Online</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 md:px-6 py-8">
        <!-- Navigation Tabs (5 Pestañas) -->
        <div class="flex flex-wrap gap-2 bg-gray-900/50 p-2 rounded-xl mb-8 border border-white/10">
            <button class="tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-white text-blue-900 shadow-lg flex items-center space-x-2" data-tab="overview">
                <i class="fas fa-chart-line"></i><span>📊 Resumen</span>
            </button>
            <button class="tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-gray-800/50 text-white hover:bg-white/10 flex items-center space-x-2" data-tab="services">
                <i class="fas fa-cogs"></i><span>🛠️ Servicios Onboarding</span>
            </button>
            <button class="tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-gray-800/50 text-white hover:bg-white/10 flex items-center space-x-2" data-tab="calendar">
                <i class="fas fa-calendar-alt"></i><span>📅 Calendario</span>
            </button>
            <button class="tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-gray-800/50 text-white hover:bg-white/10 flex items-center space-x-2" data-tab="appointments">
                <i class="fas fa-users"></i><span>👥 Citas</span>
            </button>
            <button class="tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-gray-800/50 text-white hover:bg-white/10 flex items-center space-x-2" data-tab="settings">
                <i class="fas fa-sliders-h"></i><span>⚙️ Configuración</span>
            </button>
        </div>

        <!-- Contenido de Pestañas -->
        <div id="tab-contents">
            
            <!-- 1. Pestaña Overview -->
            <div id="overview-tab" class="tab-content active">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div class="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-5 border border-blue-700/30">
                        <h3 class="text-3xl font-bold text-white mb-1" id="stat-total-services">0</h3>
                        <p class="text-blue-200 text-sm">Servicios Activos</p>
                    </div>
                    <div class="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-5 border border-green-700/30">
                        <h3 class="text-3xl font-bold text-white mb-1" id="stat-today-apts">0</h3>
                        <p class="text-green-200 text-sm">Citas Hoy</p>
                    </div>
                    <div class="bg-gradient-to-br from-yellow-900 to-yellow-800 rounded-xl p-5 border border-yellow-700/30">
                        <h3 class="text-3xl font-bold text-white mb-1" id="stat-revenue">$0</h3>
                        <p class="text-yellow-200 text-sm">Ingresos Estimados</p>
                    </div>
                    <div class="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-5 border border-purple-700/30">
                         <h3 class="text-3xl font-bold text-white mb-1">100%</h3>
                        <p class="text-purple-200 text-sm">Estado Sistema</p>
                    </div>
                </div>

                <!-- Gráfico y Calendario Mini -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                        <h2 class="text-2xl font-bold text-white mb-4">📅 Vista Rápida</h2>
                        <div id="calendar-grid-mini" class="grid grid-cols-7 gap-2"></div>
                    </div>
                    <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                        <h2 class="text-2xl font-bold text-white mb-4">📈 Servicios</h2>
                        <div class="h-64">
                            <canvas id="servicesChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. Pestaña Servicios -->
            <div id="services-tab" class="tab-content hidden">
                <div class="glass-card rounded-2xl p-6 mb-8">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">🛠️ Servicios del Onboarding</h2>
                            <p class="text-gray-500">Gestión completa de tus servicios</p>
                        </div>
                        <button onclick="showAddServiceModal()" class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold shadow-lg">
                            <i class="fas fa-plus mr-2"></i>Nuevo Servicio
                        </button>
                    </div>

                    <input type="text" id="service-search" placeholder="Buscar servicios..." class="input-field mb-6" onkeyup="filterServices()">

                    <div id="services-container">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="services-grid">
                            <!-- JS Populates this -->
                        </div>
                    </div>
                    
                    <div id="no-services-state" class="hidden text-center py-10">
                        <p class="text-gray-500">No hay servicios configurados.</p>
                    </div>
                </div>
            </div>

            <!-- 3. Pestaña Calendario -->
            <div id="calendar-tab" class="tab-content hidden">
                <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-white">📅 Calendario Completo</h2>
                        <div class="flex space-x-2">
                             <button onclick="changeMonth(-1)" class="bg-gray-700 text-white px-3 py-1 rounded">Anterior</button>
                             <span id="calendar-month-title" class="text-white font-bold text-xl px-4"></span>
                             <button onclick="changeMonth(1)" class="bg-gray-700 text-white px-3 py-1 rounded">Siguiente</button>
                        </div>
                    </div>
                    <div id="calendar-grid-full" class="grid grid-cols-7 gap-2"></div>
                </div>
            </div>

            <!-- 4. Pestaña Citas -->
            <div id="appointments-tab" class="tab-content hidden">
                <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h2 class="text-2xl font-bold text-white mb-6">👥 Gestión de Citas</h2>
                    <div id="appointments-list" class="space-y-3 text-white">
                        <p class="text-gray-400">Cargando citas...</p>
                    </div>
                </div>
            </div>

            <!-- 5. Pestaña Configuración -->
            <div id="settings-tab" class="tab-content hidden">
                <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 text-center py-20">
                    <i class="fas fa-tools text-6xl text-gray-600 mb-4"></i>
                    <h2 class="text-2xl font-bold text-white">Configuración</h2>
                    <p class="text-gray-400 mt-2">Próximamente: Horarios, Perfil y Notificaciones.</p>
                </div>
            </div>

        </div>
    </div>

    <!-- Modal Servicio -->
    <div id="service-modal-overlay" class="modal-overlay">
        <div class="modal-content">
            <div class="p-6 border-b border-gray-200">
                <h3 id="modal-title" class="text-xl font-bold text-gray-800">Nuevo Servicio</h3>
            </div>
            <div class="p-6">
                <form id="service-form" onsubmit="handleServiceSubmit(event)" class="space-y-4">
                    <input type="hidden" id="service-id">
                    <div>
                        <label class="block text-gray-700 text-sm font-bold mb-2">Nombre *</label>
                        <input type="text" id="service-name" class="input-field" required placeholder="Ej: Limpieza Dental">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2">Precio ($)</label>
                            <input type="number" id="service-price" class="input-field" required value="0">
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2">Duración (min)</label>
                            <input type="number" id="service-duration" class="input-field" required value="30">
                        </div>
                    </div>
                    <div>
                        <label class="block text-gray-700 text-sm font-bold mb-2">Categoría</label>
                        <select id="service-category" class="input-field">
                            <option value="general">General</option>
                            <option value="dentist">Dentista</option>
                            <option value="cleaning">Limpieza</option>
                            <option value="whitening">Blanqueamiento</option>
                            <option value="implants">Implantes</option>
                        </select>
                    </div>
                    <div class="flex items-center mt-4">
                        <input type="checkbox" id="service-active" class="h-4 w-4" checked>
                        <label for="service-active" class="ml-2 text-gray-700">Servicio Activo</label>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
                        <button type="button" onclick="closeServiceModal()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">Cancelar</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        // --- Variables Globales ---
        let businessId = "${business._id}";
        let servicesData = [];
        let appointmentsData = [];
        let calendarData = {};
        let currentDate = moment();
        
        // --- Inicialización ---
        document.addEventListener('DOMContentLoaded', () => {
            moment.locale('es');
            initTabs();
            loadInitialData();
        });

        // --- Carga de Datos (Con Rutas Relativas REPARADAS) ---
        async function loadInitialData() {
            try {
                // Truco para evitar 404: Usar la URL actual como base
                // Si la URL es /dashboard-pro/verena, esto llama a /dashboard-pro/verena/data/...
                const baseUrl = window.location.pathname.replace(/\\/$/, ''); 
                console.log("Cargando datos desde:", baseUrl);

                const [servicesRes, aptRes] = await Promise.all([
                    fetch(baseUrl + '/data/services'),
                    fetch(baseUrl + '/data/appointments?month=' + (currentDate.month() + 1) + '&year=' + currentDate.year())
                ]);

                if (servicesRes.ok) servicesData = await servicesRes.json();
                if (aptRes.ok) {
                    const apts = await aptRes.json();
                    processAppointments(apts);
                }

                renderServices();
                renderCalendarFull();
                renderCalendarMini();
                renderAppointmentsList();
                updateStats();
                initChart();

            } catch (err) {
                console.error("Error cargando datos:", err);
            }
        }

        // --- Lógica de Servicios ---
        function renderServices() {
            const container = document.getElementById('services-grid');
            const search = document.getElementById('service-search').value.toLowerCase();
            const filtered = servicesData.filter(s => s.name.toLowerCase().includes(search));
            
            if (filtered.length === 0) {
                container.innerHTML = '';
                document.getElementById('no-services-state').classList.remove('hidden');
                return;
            }
            document.getElementById('no-services-state').classList.add('hidden');

            container.innerHTML = filtered.map(s => {
                // Manejo de valores undefined/null que mencionaste en Mongo
                const price = s.price !== undefined ? s.price : 0;
                const duration = s.duration !== undefined ? s.duration : 30;
                const category = s.category || 'general';
                const iconClass = category === 'dentist' ? 'service-dentist' : (category === 'cleaning' ? 'service-cleaning' : 'service-general');
                const icon = category === 'dentist' ? 'fa-tooth' : (category === 'cleaning' ? 'fa-broom' : 'fa-stethoscope');
                const activeClass = s.active !== false ? 'badge-active' : 'badge-inactive';
                const activeText = s.active !== false ? 'Activo' : 'Inactivo';

                return \`
                <div class="service-card glass-card rounded-xl p-5 hover:shadow-lg transition-all duration-300">
                    <div class="flex items-start mb-4">
                        <div class="service-icon \${iconClass} flex-shrink-0">
                            <i class="fas \${icon}"></i>
                        </div>
                        <div class="flex-1 ml-4">
                            <div class="flex justify-between items-start">
                                <h3 class="font-bold text-lg text-gray-800 truncate">\${s.name}</h3>
                                <span class="text-xl font-bold text-gray-800">$\${price}</span>
                            </div>
                            <p class="text-gray-500 text-sm mt-1">\${duration} min</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="service-badge \${activeClass}">\${activeText}</span>
                        <span class="service-badge bg-blue-100 text-blue-800">\${category}</span>
                    </div>
                    <div class="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                        <button onclick="editService('\${s._id}')" class="px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm">Editar</button>
                        <button onclick="deleteService('\${s._id}')" class="px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm">Eliminar</button>
                    </div>
                </div>
                \`;
            }).join('');
            
            document.getElementById('stat-total-services').textContent = servicesData.length;
        }

        function filterServices() { renderServices(); }

        function showAddServiceModal() {
            document.getElementById('modal-title').textContent = 'Nuevo Servicio';
            document.getElementById('service-form').reset();
            document.getElementById('service-id').value = '';
            document.getElementById('service-modal-overlay').classList.add('active');
        }

        function closeServiceModal() {
            document.getElementById('service-modal-overlay').classList.remove('active');
        }

        function editService(id) {
            const s = servicesData.find(x => x._id === id);
            if(!s) return;
            document.getElementById('modal-title').textContent = 'Editar Servicio';
            document.getElementById('service-id').value = s._id;
            document.getElementById('service-name').value = s.name;
            document.getElementById('service-price').value = s.price || 0;
            document.getElementById('service-duration').value = s.duration || 30;
            document.getElementById('service-category').value = s.category || 'general';
            document.getElementById('service-active').checked = s.active !== false;
            document.getElementById('service-modal-overlay').classList.add('active');
        }

        async function handleServiceSubmit(e) {
            e.preventDefault();
            const id = document.getElementById('service-id').value;
            const baseUrl = window.location.pathname.replace(/\\/$/, '');
            const url = id ? \`\${baseUrl}/data/services/\${id}\` : \`\${baseUrl}/data/services\`;
            const method = id ? 'PUT' : 'POST';

            const body = {
                name: document.getElementById('service-name').value,
                price: document.getElementById('service-price').value,
                duration: document.getElementById('service-duration').value,
                category: document.getElementById('service-category').value,
                active: document.getElementById('service-active').checked
            };

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if(res.ok) {
                const data = await res.json();
                servicesData = data.services;
                renderServices();
                closeServiceModal();
                updateStats();
                initChart();
            } else {
                alert("Error al guardar el servicio");
            }
        }

        async function deleteService(id) {
            if(!confirm('¿Seguro que deseas eliminar este servicio?')) return;
            const baseUrl = window.location.pathname.replace(/\\/$/, '');
            const res = await fetch(\`\${baseUrl}/data/services/\${id}\`, { method: 'DELETE' });
            if(res.ok) {
                const data = await res.json();
                servicesData = data.services;
                renderServices();
                updateStats();
                initChart();
            }
        }

        // --- Lógica de Calendario y Citas ---
        function processAppointments(apts) {
            calendarData = {};
            appointmentsData = apts;
            apts.forEach(apt => {
                const date = moment(apt.dateTime).format('YYYY-MM-DD');
                if(!calendarData[date]) calendarData[date] = [];
                calendarData[date].push(apt);
            });
        }

        function renderCalendarCommon(containerId, isMini = false) {
            const grid = document.getElementById(containerId);
            if(!grid) return;
            grid.innerHTML = '';
            
            if(!isMini) {
                document.getElementById('calendar-month-title').textContent = currentDate.format('MMMM YYYY');
            }

            const start = currentDate.clone().startOf('month').startOf('week');
            const end = currentDate.clone().endOf('month').endOf('week');
            const day = start.clone();

            const daysHeader = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
            daysHeader.forEach(d => {
                grid.innerHTML += \`<div class="text-center text-gray-400 text-sm font-bold py-2">\${d}</div>\`;
            });

            while(day.isSameOrBefore(end)) {
                const dateStr = day.format('YYYY-MM-DD');
                const isCurrentMonth = day.month() === currentDate.month();
                const isToday = day.isSame(moment(), 'day');
                const apts = calendarData[dateStr] || [];
                const hasApts = apts.length > 0;
                
                let cellClass = isMini 
                    ? \`text-center p-2 text-sm rounded cursor-pointer transition-all \`
                    : \`p-2 min-h-[80px] rounded cursor-pointer transition-all border border-gray-700/30 relative \`;
                
                if (isCurrentMonth) {
                    cellClass += isMini ? 'text-white ' : 'bg-gray-800 text-white hover:bg-gray-700 ';
                } else {
                    cellClass += 'text-gray-500 opacity-50 ';
                }

                if (isToday) cellClass += 'ring-2 ring-blue-500 ';
                if (hasApts && isMini) cellClass += 'bg-green-600 font-bold ';

                const cell = document.createElement('div');
                cell.className = cellClass;
                
                if (isMini) {
                    cell.textContent = day.date();
                } else {
                    cell.innerHTML = \`<div class="font-bold">\${day.date()}</div>\`;
                    if(hasApts) {
                        cell.innerHTML += \`
                            <div class="mt-1 space-y-1">
                                \${apts.slice(0, 2).map(a => \`<div class="text-xs bg-blue-900/50 text-blue-200 px-1 rounded truncate">\${moment(a.dateTime).format('HH:mm')}</div>\`).join('')}
                                \${apts.length > 2 ? \`<div class="text-xs text-gray-400">+\${apts.length-2} más</div>\` : ''}
                            </div>
                        \`;
                    }
                }
                
                cell.onclick = () => {
                    if(hasApts) {
                        alert(\`Citas el \${dateStr}:\\n\` + apts.map(a => moment(a.dateTime).format('HH:mm') + ' - Cliente').join('\\n'));
                    }
                };

                grid.appendChild(cell);
                day.add(1, 'day');
            }
        }

        function renderCalendarFull() { renderCalendarCommon('calendar-grid-full', false); }
        function renderCalendarMini() { renderCalendarCommon('calendar-grid-mini', true); }

        async function changeMonth(delta) {
            currentDate.add(delta, 'months');
            const baseUrl = window.location.pathname.replace(/\\/$/, '');
            const res = await fetch(baseUrl + '/data/appointments?month=' + (currentDate.month() + 1) + '&year=' + currentDate.year());
            if(res.ok) {
                processAppointments(await res.json());
                renderCalendarFull();
                renderCalendarMini();
                renderAppointmentsList();
                updateStats();
            }
        }

        function renderAppointmentsList() {
            const list = document.getElementById('appointments-list');
            if(appointmentsData.length === 0) {
                list.innerHTML = '<p class="text-gray-400 italic">No hay citas este mes.</p>';
                return;
            }
            list.innerHTML = appointmentsData.map(apt => \`
                <div class="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div>
                        <p class="font-bold text-white">\${moment(apt.dateTime).format('DD/MM/YYYY HH:mm')}</p>
                        <p class="text-sm text-gray-400">\${apt.clientName || 'Cliente'} - \${apt.clientPhone || 'Sin teléfono'}</p>
                    </div>
                    <span class="px-2 py-1 rounded text-xs \${apt.status === 'confirmed' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'}">
                        \${apt.status || 'Pendiente'}
                    </span>
                </div>
            \`).join('');
        }

        // --- Estadísticas y Gráficos ---
        function updateStats() {
            const today = moment().format('YYYY-MM-DD');
            const todayCount = appointmentsData.filter(a => moment(a.dateTime).format('YYYY-MM-DD') === today).length;
            document.getElementById('stat-today-apts').textContent = todayCount;
            
            // Calculo estimado simple de ingresos
            const revenue = appointmentsData.length * 500; 
            document.getElementById('stat-revenue').textContent = '$' + revenue.toLocaleString();
        }

        let myChart = null;
        function initChart() {
            const ctx = document.getElementById('servicesChart');
            if(!ctx) return;
            if(myChart) myChart.destroy();

            const cats = {};
            servicesData.forEach(s => {
                const c = s.category || 'General';
                cats[c] = (cats[c] || 0) + 1;
            });

            myChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(cats),
                    datasets: [{
                        data: Object.values(cats),
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { position: 'right', labels: { color: 'white' } } 
                    }
                }
            });
        }

        // --- Pestañas ---
        function initTabs() {
            const btns = document.querySelectorAll('.tab-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Ocultar contenidos
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active', 'fade-in'));
                    // Mostrar seleccionado
                    const target = document.getElementById(btn.dataset.tab + '-tab');
                    target.classList.add('active');
                    
                    // Resetear botones
                    btns.forEach(b => {
                        b.className = 'tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-gray-800/50 text-white hover:bg-white/10 flex items-center space-x-2';
                    });
                    
                    // Activar botón actual
                    btn.className = 'tab-btn px-5 py-3 rounded-lg font-medium transition-all duration-300 bg-white text-blue-900 shadow-lg flex items-center space-x-2';
                    
                    // Si entra en servicios, forzar render
                    if(btn.dataset.tab === 'services') renderServices();
                });
            });
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
