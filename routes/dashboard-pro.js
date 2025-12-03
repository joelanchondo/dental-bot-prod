const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const moment = require('moment');
const mongoose = require('mongoose');

// =========================================================
// 1. RUTAS DE DATOS (Relativas al identificador)
// =========================================================

// GET - Info del negocio (JSON)
// URL resultante: /dashboard-pro/:identifier/data/info
router.get("/:identifier/data/info", async (req, res) => {
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

// GET - Servicios (JSON)
// URL resultante: /dashboard-pro/:identifier/data/services
router.get("/:identifier/data/services", async (req, res) => {
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

// GET - Citas (JSON)
// URL resultante: /dashboard-pro/:identifier/data/appointments
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

// POST - Agregar servicio
router.post("/:identifier/data/services", async (req, res) => {
  try {
    const { identifier } = req.params;
    const {
      name, description = "", duration = 30, price = 1000, active = true,
      category = "general", requiresPayment = false, commission = 0,
      customService = true, basePrice
    } = req.body;

    let business;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      business = await Business.findById(identifier);
    } else {
      business = await Business.findOne({ slug: identifier });
    }

    if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

    const newService = {
      name, description, duration: parseInt(duration), price: parseInt(price),
      active, category, requiresPayment, customService,
      basePrice: parseInt(basePrice || price), commission: parseInt(commission || 0),
      timesBooked: 0, revenue: 0, createdAt: new Date(), updatedAt: new Date()
    };

    business.services.push(newService);
    await business.save();

    res.json({ success: true, service: newService, services: business.services });
  } catch (error) {
    console.error("Error al crear servicio:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT - Actualizar servicio
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

    // Actualizar campos
    const fields = ['name', 'description', 'category', 'requiresPayment', 'active', 'duration', 'price', 'commission', 'basePrice'];
    fields.forEach(f => {
        if (req.body[f] !== undefined) service[f] = req.body[f];
    });
    service.updatedAt = new Date();
    await business.save();

    res.json({ success: true, service: service.toObject(), services: business.services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar servicio
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

    res.json({ success: true, message: "Servicio eliminado", services: business.services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// 2. RUTA PRINCIPAL (VISTA HTML)
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

    // Datos iniciales para SSR (Server Side Rendering)
    const appointments = await Appointment.find({ businessId: business._id })
      .sort({ dateTime: -1 })
      .limit(50);
    
    const businessServices = business.services || [];

    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Pro - ${business.businessName}</title>
    <!-- Tailwind CSS via CDN (Development only warning is normal) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/min/moment.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/locale/es.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --primary-blue: #0f172a; --secondary-blue: #1e293b; --accent-gold: #f59e0b; }
        body { background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%); min-height: 100vh; font-family: 'Inter', sans-serif; }
        .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; align-items: center; justify-content: center; }
        .modal-overlay.active { display: flex; }
        .modal-content { background: white; border-radius: 20px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; }
        
        /* Badges */
        .service-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
        .badge-active { background: #d1fae5; color: #065f46; }
        .badge-inactive { background: #f3f4f6; color: #4b5563; }
        .badge-online { background: #e0e7ff; color: #3730a3; }
        .badge-office { background: #fef3c7; color: #92400e; }
        .service-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-right: 16px; }
        .service-dentist { background: #dbeafe; color: #1e40af; }
        .service-general { background: #f3f4f6; color: #4b5563; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease-out; }
    </style>
</head>
<body class="text-gray-800">
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
            <div class="flex items-center space-x-4">
                <div class="bg-white/20 p-3 rounded-xl"><span class="text-2xl">🏢</span></div>
                <div>
                    <h1 class="text-2xl font-bold text-white">${business.businessName}</h1>
                    <p class="text-blue-100 text-sm">Dashboard Profesional</p>
                </div>
            </div>
             <div class="bg-black/20 rounded-full px-4 py-2 text-yellow-400 font-bold">
                ${business.plan ? business.plan.toUpperCase() : 'STANDARD'}
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 md:px-6 py-8">
        <!-- Navigation Tabs -->
        <div class="flex flex-wrap gap-2 bg-gray-900/50 p-2 rounded-xl mb-8 border border-white/10">
            <button class="tab-btn px-5 py-3 rounded-lg font-medium bg-white text-blue-900 shadow-lg" data-tab="overview">📊 Resumen</button>
            <button class="tab-btn px-5 py-3 rounded-lg font-medium bg-gray-800/50 text-white hover:bg-white/10" data-tab="services">🛠️ Servicios</button>
            <button class="tab-btn px-5 py-3 rounded-lg font-medium bg-gray-800/50 text-white hover:bg-white/10" data-tab="calendar">📅 Calendario</button>
        </div>

        <div id="tab-contents">
            <!-- Pestaña Overview -->
            <div id="overview-tab" class="tab-content active fade-in">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div class="bg-blue-900 rounded-xl p-5 border border-blue-700/30">
                        <h3 class="text-3xl font-bold text-white mb-1" id="stat-total-services">0</h3>
                        <p class="text-blue-200 text-sm">Servicios Activos</p>
                    </div>
                    <div class="bg-green-900 rounded-xl p-5 border border-green-700/30">
                        <h3 class="text-3xl font-bold text-white mb-1" id="stat-today-apts">0</h3>
                        <p class="text-green-200 text-sm">Citas Hoy</p>
                    </div>
                </div>
                <!-- Calendario Grande -->
                <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700/50">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-white">📅 Calendario de Citas</h2>
                        <div>
                            <button onclick="changeMonth(-1)" class="text-white px-3 py-1 bg-gray-700 rounded"><i class="fas fa-chevron-left"></i></button>
                            <span id="calendar-header-title" class="text-white font-bold mx-3"></span>
                            <button onclick="changeMonth(1)" class="text-white px-3 py-1 bg-gray-700 rounded"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                    <div id="calendar-grid" class="grid grid-cols-7 gap-2"></div>
                </div>
                <!-- Chart -->
                <div class="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50" style="height: 400px;">
                    <h2 class="text-xl font-bold text-white mb-4">📈 Distribución de Servicios</h2>
                    <canvas id="servicesChart"></canvas>
                </div>
            </div>

            <!-- Pestaña Servicios -->
            <div id="services-tab" class="tab-content hidden fade-in">
                <div class="glass-card rounded-2xl p-6 mb-8">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-800">Servicios</h2>
                        <button onclick="showAddServiceModal()" class="btn-primary px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            <i class="fas fa-plus"></i> Nuevo
                        </button>
                    </div>
                    <input type="text" id="service-search" placeholder="Buscar..." class="w-full p-3 border rounded-lg mb-4" onkeyup="filterServices()">
                    <div id="services-grid" class="grid grid-cols-1 lg:grid-cols-2 gap-6"></div>
                </div>
            </div>

            <!-- Pestaña Calendario (Vista detallada) -->
            <div id="calendar-tab" class="tab-content hidden fade-in">
                <div class="bg-gray-900/80 rounded-2xl p-6 border border-gray-700/50 text-white text-center py-20">
                    <i class="fas fa-calendar-alt text-6xl text-gray-600 mb-4"></i>
                    <p>Usa la vista de Resumen para gestionar el calendario por ahora.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Servicio -->
    <div id="service-modal-overlay" class="modal-overlay">
        <div class="modal-content p-6">
            <h3 id="modal-title" class="text-xl font-bold mb-4">Servicio</h3>
            <form id="service-form" onsubmit="handleServiceSubmit(event)" class="space-y-4">
                <input type="hidden" id="service-id">
                <div>
                    <label class="block text-sm font-medium">Nombre</label>
                    <input type="text" id="service-name" class="w-full p-2 border rounded" required>
                </div>
                <div>
                    <label class="block text-sm font-medium">Precio ($)</label>
                    <input type="number" id="service-price" class="w-full p-2 border rounded" required>
                </div>
                 <div>
                    <label class="block text-sm font-medium">Categoría</label>
                    <select id="service-category" class="w-full p-2 border rounded">
                        <option value="general">General</option>
                        <option value="dentist">Dentista</option>
                        <option value="cleaning">Limpieza</option>
                    </select>
                </div>
                <div class="flex space-x-3 justify-end mt-4">
                    <button type="button" onclick="closeServiceModal()" class="px-4 py-2 border rounded">Cancelar</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Variables Globales
        let businessId = "${business._id}";
        let businessSlug = "${business.slug || business._id}";
        let servicesData = [];
        let appointmentsData = [];
        let calendarData = {};
        let currentDate = moment();

        // -----------------------------------------------------
        // INICIALIZACIÓN
        // -----------------------------------------------------
        document.addEventListener('DOMContentLoaded', () => {
            moment.locale('es');
            initTabs();
            loadInitialData();
        });

        // Carga de Datos (Usando rutas relativas inteligentes)
        async function loadInitialData() {
            try {
                // Truco: Usamos window.location.pathname para construir la URL base
                // Si estamos en /dashboard-pro/verena, esto llama a /dashboard-pro/verena/data/...
                const baseUrl = window.location.pathname.replace(/\\/$/, ''); 
                
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
                renderCalendar();
                updateStats();
                initChart();

            } catch (err) {
                console.error("Error cargando datos:", err);
                alert("Error de conexión. Revisa la consola.");
            }
        }

        // -----------------------------------------------------
        // SERVICIOS
        // -----------------------------------------------------
        function renderServices() {
            const container = document.getElementById('services-grid');
            const search = document.getElementById('service-search').value.toLowerCase();
            
            const filtered = servicesData.filter(s => s.name.toLowerCase().includes(search));
            
            container.innerHTML = filtered.map(s => \`
                <div class="glass-card p-5 rounded-xl flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-lg">\${s.name}</h3>
                        <p class="text-blue-600 font-bold">$\${s.price}</p>
                        <span class="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">\${s.category || 'General'}</span>
                    </div>
                    <div class="space-x-2">
                        <button onclick="editService('\${s._id}')" class="text-blue-600"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteService('\${s._id}')" class="text-red-600"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            \`).join('');
            
            document.getElementById('stat-total-services').textContent = servicesData.length;
        }

        function filterServices() { renderServices(); }

        function showAddServiceModal() {
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
            document.getElementById('service-id').value = s._id;
            document.getElementById('service-name').value = s.name;
            document.getElementById('service-price').value = s.price;
            document.getElementById('service-category').value = s.category || 'general';
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
                category: document.getElementById('service-category').value
            };

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if(res.ok) {
                const data = await res.json();
                servicesData = data.services; // La API devuelve la lista actualizada
                renderServices();
                closeServiceModal();
                updateStats();
                initChart(); // Refrescar gráfico
            }
        }

        async function deleteService(id) {
            if(!confirm('¿Eliminar?')) return;
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

        // -----------------------------------------------------
        // CALENDARIO
        // -----------------------------------------------------
        function processAppointments(apts) {
            calendarData = {};
            appointmentsData = apts;
            apts.forEach(apt => {
                const date = moment(apt.dateTime).format('YYYY-MM-DD');
                if(!calendarData[date]) calendarData[date] = [];
                calendarData[date].push(apt);
            });
        }

        function renderCalendar() {
            const grid = document.getElementById('calendar-grid');
            grid.innerHTML = '';
            document.getElementById('calendar-header-title').textContent = currentDate.format('MMMM YYYY');

            const start = currentDate.clone().startOf('month').startOf('week');
            const end = currentDate.clone().endOf('month').endOf('week');
            const day = start.clone();

            // Headers
            ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'].forEach(d => {
                grid.innerHTML += \`<div class="text-center text-gray-400 text-sm">\${d}</div>\`;
            });

            while(day.isSameOrBefore(end)) {
                const dateStr = day.format('YYYY-MM-DD');
                const isCurrentMonth = day.month() === currentDate.month();
                const hasApts = calendarData[dateStr]?.length > 0;
                
                const cell = document.createElement('div');
                cell.className = \`p-2 rounded min-h-[60px] cursor-pointer \${isCurrentMonth ? 'bg-gray-800' : 'bg-gray-900 opacity-50'} \${hasApts ? 'border-l-2 border-green-500' : ''}\`;
                cell.innerHTML = \`<div class="text-white font-bold">\${day.date()}</div>\`;
                
                if(hasApts) {
                    cell.innerHTML += \`<div class="text-xs text-green-400 mt-1">\${calendarData[dateStr].length} citas</div>\`;
                }

                cell.onclick = () => {
                    if(hasApts) {
                        alert(\`Citas el \${dateStr}:\\n\` + calendarData[dateStr].map(a => moment(a.dateTime).format('HH:mm') + ' - Cliente').join('\\n'));
                    }
                };

                grid.appendChild(cell);
                day.add(1, 'day');
            }
        }

        async function changeMonth(delta) {
            currentDate.add(delta, 'months');
            // Recargar citas del nuevo mes
            const baseUrl = window.location.pathname.replace(/\\/$/, '');
            const res = await fetch(baseUrl + '/data/appointments?month=' + (currentDate.month() + 1) + '&year=' + currentDate.year());
            if(res.ok) {
                processAppointments(await res.json());
                renderCalendar();
            }
        }

        // -----------------------------------------------------
        // ESTADISTICAS & CHART
        // -----------------------------------------------------
        function updateStats() {
            const today = moment().format('YYYY-MM-DD');
            const todayCount = appointmentsData.filter(a => moment(a.dateTime).format('YYYY-MM-DD') === today).length;
            document.getElementById('stat-today-apts').textContent = todayCount;
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
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { color: 'white' } } }
                }
            });
        }

        // -----------------------------------------------------
        // TABS
        // -----------------------------------------------------
        function initTabs() {
            const btns = document.querySelectorAll('.tab-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
                    
                    btns.forEach(b => b.classList.remove('bg-white', 'text-blue-900'));
                    btns.forEach(b => b.classList.add('text-white'));
                    
                    btn.classList.remove('text-white');
                    btn.classList.add('bg-white', 'text-blue-900');
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
