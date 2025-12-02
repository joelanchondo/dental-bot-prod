const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const moment = require('moment');
const mongoose = require('mongoose');

// GET /dashboard-pro/:businessId - DASHBOARD ULTRA PROFESIONAL
router.get('/:identifier', async (req, res) => {
  try {
    let business;

    // Buscar por slug primero, luego por ID
    if (req.params.identifier.match(/^[0-9a-fA-F]{24}$/)) {
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
    <style>
        :root {
            --primary-blue: #0f172a;
            --secondary-blue: #1e293b;
            --accent-gold: #f59e0b;
            --light-gold: #fbbf24;
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
    </style>
</head>
<body class="text-gray-800">
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div class="container mx-auto px-6 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <div class="bg-white/20 p-3 rounded-xl">
                        <span class="text-2xl">🏢</span>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">${business.businessName}</h1>
                        <p class="text-blue-100">Dashboard Profesional</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="bg-yellow-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                        ${business.plan.toUpperCase()}
                    </span>
                    <div class="text-right">
                        <p class="text-white text-sm">Estado</p>
                        <p class="text-green-400 font-bold">● Activo</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="container mx-auto px-6 py-8">
        <!-- Navigation Tabs -->
        <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
            <button class="tab-btn px-4 py-2 rounded-md font-medium transition-all duration-200 bg-white text-blue-600 shadow-sm" data-tab="overview">
                📊 Resumen
            </button>
            <button class="tab-btn px-4 py-2 rounded-md font-medium transition-all duration-200" data-tab="services">
                🛠️ Servicios
            </button>
            <button class="tab-btn px-4 py-2 rounded-md font-medium transition-all duration-200" data-tab="calendar">
                📅 Calendario
            </button>
            <button class="tab-btn px-4 py-2 rounded-md font-medium transition-all duration-200" data-tab="appointments">
                👥 Citas
            </button>
        </div>

        <!-- Contenido de Pestañas -->
        <div id="tab-contents">
            <!-- Pestaña Overview -->
            <div id="overview-tab" class="tab-content active">
                <!-- Stats Overview -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 fade-in">
                    <div class="glass-card rounded-2xl p-6 text-center">
                        <div class="text-3xl mb-2">📅</div>
                        <h3 class="text-gray-600 text-sm">Citas Hoy</h3>
                        <p class="text-2xl font-bold text-gray-800" id="today-count">0</p>
                    </div>

                    <div class="glass-card rounded-2xl p-6 text-center">
                        <div class="text-3xl mb-2">👥</div>
                        <h3 class="text-gray-600 text-sm">Total Citas</h3>
                        <p class="text-2xl font-bold text-gray-800">${appointments.length}</p>
                    </div>

                    <div class="glass-card rounded-2xl p-6 text-center">
                        <div class="text-3xl mb-2">✅</div>
                        <h3 class="text-gray-600 text-sm">Confirmadas</h3>
                        <p class="text-2xl font-bold text-gray-800" id="confirmed-count">0</p>
                    </div>

                    <div class="glass-card rounded-2xl p-6 text-center">
                        <div class="text-3xl mb-2">💰</div>
                        <h3 class="text-gray-600 text-sm">Ingresos Est.</h3>
                        <p class="text-2xl font-bold text-gray-800">$${(appointments.length * 500).toLocaleString()}</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <!-- Calendario Interactivo -->
                    <div class="xl:col-span-2 fade-in">
                        <div class="glass-card rounded-2xl p-6">
                            <div class="flex justify-between items-center mb-6">
                                <h2 class="text-xl font-bold text-gray-800">📅 Calendario de Citas</h2>
                                <div class="flex space-x-2">
                                    <button onclick="changeView('month')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Mes</button>
                                    <button onclick="changeView('week')" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Semana</button>
                                    <button onclick="changeView('day')" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Día</button>
                                </div>
                            </div>

                            <!-- Navegación del Calendario -->
                            <div class="flex justify-between items-center mb-6">
                                <button onclick="previousPeriod()" class="p-2 hover:bg-gray-100 rounded-lg transition">
                                    <span class="text-xl">←</span>
                                </button>
                                <h3 id="calendar-title" class="text-lg font-bold text-gray-800">Cargando...</h3>
                                <button onclick="nextPeriod()" class="p-2 hover:bg-gray-100 rounded-lg transition">
                                    <span class="text-xl">→</span>
                                </button>
                            </div>

                            <!-- Calendario Grid -->
                            <div id="calendar-container" class="grid grid-cols-7 gap-2 mb-4">
                                <!-- Los días se cargan con JavaScript -->
                            </div>

                            <!-- Leyenda -->
                            <div class="flex justify-center space-x-4 text-sm">
                                <div class="flex items-center">
                                    <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                    <span class="text-gray-600">Con citas</span>
                                </div>
                                <div class="flex items-center">
                                    <div class="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
                                    <span class="text-gray-600">Sin citas</span>
                                </div>
                            </div>
                        </div>

                        <!-- Gráfica de Rendimiento -->
                        <div class="glass-card rounded-2xl p-6 mt-6">
                            <h2 class="text-xl font-bold text-gray-800 mb-6">📊 Rendimiento Semanal</h2>
                            <div class="h-64">
                                <canvas id="performanceChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Panel de Citas y Gestión -->
                    <div class="space-y-6 fade-in">
                        <!-- Citas del Día Seleccionado -->
                        <div class="glass-card rounded-2xl p-6">
                            <h2 class="text-xl font-bold text-gray-800 mb-4" id="selected-date-title">📋 Citas de Hoy</h2>
                            <div id="appointments-list" class="space-y-3 max-h-96 overflow-y-auto">
                                <!-- Las citas se cargan dinámicamente -->
                            </div>
                        </div>

                        <!-- Acciones Rápidas -->
                        <div class="glass-card rounded-2xl p-6">
                            <h2 class="text-xl font-bold text-gray-800 mb-4">⚡ Acciones Rápidas</h2>
                            <div class="grid grid-cols-2 gap-3">
                                <button onclick="showQuickAction('accept')" class="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-semibold">
                                    ✅ Aceptar
                                </button>
                                <button onclick="showQuickAction('reject')" class="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold">
                                    ❌ Rechazar
                                </button>
                                <button onclick="showQuickAction('reschedule')" class="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold">
                                    🕒 Reprogramar
                                </button>
                                <button onclick="showQuickAction('urgent')" class="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-semibold">
                                    🚨 Urgencia
                                </button>
                            </div>
                        </div>

                        <!-- Información del Negocio -->
                        <div class="glass-card rounded-2xl p-6">
                            <h2 class="text-xl font-bold text-gray-800 mb-4">🏢 Información</h2>
                            <div class="space-y-3">
                                <div>
                                    <p class="text-sm text-gray-600">WhatsApp Business</p>
                                    <p class="font-bold text-gray-800">${business.whatsappBusiness}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">Tipo de Negocio</p>
                                    <p class="font-bold text-gray-800 capitalize">${business.businessType}</p>
                                </div>
                                <div class="pt-3 border-t border-gray-200">
                                    <p class="text-sm text-gray-600">Citas Totales</p>
                                    <p class="text-2xl font-bold text-yellow-600">${appointments.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Pestaña Servicios -->
            <div id="services-tab" class="tab-content hidden">
                <div class="glass-card rounded-2xl p-6 mb-8">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold text-gray-800">🛠️ Gestión de Servicios</h2>
                        <button onclick="showAddServiceModal()" 
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
                            <span class="mr-2">+</span> Agregar Servicio
                        </button>
                    </div>
                    
                    <!-- Lista de Servicios -->
                    <div id="services-container" class="space-y-4">
                        <div class="text-center py-8 text-gray-500">
                            <div class="animate-pulse">
                                <div class="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-2"></div>
                                <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información Premium -->
                    <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div class="flex items-start">
                            <div class="mr-3 text-blue-600">💡</div>
                            <div>
                                <p class="font-medium text-blue-800">Arquitectura Premium Activada</p>
                                <p class="text-sm text-blue-600 mt-1">
                                    Cada servicio incluye: precio editable, precio sugerido, 
                                    opción de pago online, categoría y analytics.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Otras pestañas (calendar, appointments) se manejarán similarmente -->
        </div>
    </div>

    <script>
        // Datos globales
        const businessId = '${business._id}';
        const businessPlan = '${business.plan}';
        const appointments = ${JSON.stringify(appointments)};
        const calendarData = ${JSON.stringify(calendarData)};

        let currentDate = moment();
        let currentView = 'month';
        let selectedDate = moment().format('YYYY-MM-DD');
        let selectedAppointment = null;
        let businessServices = [];

        // Inicialización
        document.addEventListener('DOMContentLoaded', function() {
            moment.locale('es');
            updateStats();
            renderCalendar();
            renderAppointmentsList();
            initChart();
            initTabs();
            loadBusinessServices();
        });

        // =============================================
        // GESTIÓN DE TABS
        // =============================================
        
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
                    btn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
                    btn.classList.remove('text-gray-600', 'hover:bg-white/50');
                } else {
                    btn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
                    btn.classList.add('text-gray-600', 'hover:bg-white/50');
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
                
                // Cargar servicios si es la pestaña de servicios
                if (tabName === 'services') {
                    loadBusinessServices();
                }
            }
        }
        
        // =============================================
        // GESTIÓN DE SERVICIOS
        // =============================================
        
        async function loadBusinessServices() {
            try {
                const response = await fetch(\`/api/business/\${businessId}/services\`);
                businessServices = await response.json();
                renderServicesList();
            } catch (error) {
                console.error('Error cargando servicios:', error);
                document.getElementById('services-container').innerHTML = \`
                    <div class="text-center py-8 text-red-500">
                        <p>Error cargando servicios</p>
                        <button onclick="loadBusinessServices()" class="mt-2 text-blue-600 hover:underline">
                            Reintentar
                        </button>
                    </div>
                \`;
            }
        }
        
        function renderServicesList() {
            const container = document.getElementById('services-container');
            
            if (!businessServices || businessServices.length === 0) {
                container.innerHTML = \`
                    <div class="text-center py-8 text-gray-500">
                        <p class="mb-4">No hay servicios configurados</p>
                        <button onclick="showAddServiceModal()" 
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            + Agregar primer servicio
                        </button>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = businessServices.map(service => \`
                <div class="service-item glass-card rounded-xl p-4" data-service-id="\${service._id}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-bold text-lg text-gray-800">\${service.name}</h3>
                                <span class="px-2 py-1 text-xs rounded-full \${service.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                    \${service.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            
                            \${service.description ? \`<p class="text-gray-600 mb-3">\${service.description}</p>\` : ''}
                            
                            <div class="flex flex-wrap gap-2">
                                <span class="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                    ⏱️ \${service.duration || 30} min
                                </span>
                                <span class="text-sm \${service.price > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} px-3 py-1 rounded-full">
                                    💰 $\${service.price || 0}
                                    \${service.basePrice > 0 && service.price === 0 ? \` (Sugerido: $\${service.basePrice})\` : ''}
                                </span>
                                <span class="text-sm \${service.requiresPayment ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'} px-3 py-1 rounded-full">
                                    \${service.requiresPayment ? '💳 Pago online' : '🏥 Pago consultorio'}
                                </span>
                                <span class="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                                    📁 \${service.category || 'general'}
                                </span>
                                \${service.commission > 0 ? \`
                                    <span class="text-sm bg-pink-100 text-pink-800 px-3 py-1 rounded-full">
                                        👑 Comisión: \${service.commission}%
                                    </span>
                                \` : ''}
                            </div>
                        </div>
                        <div class="ml-4 flex flex-col space-y-2">
                            <button onclick="editService('\${service._id}')" 
                                    class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                                Editar
                            </button>
                            <button onclick="deleteService('\${service._id}')" 
                                    class="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            \`).join('');
        }
        
        function showAddServiceModal() {
            alert('Funcionalidad de agregar servicio - En desarrollo');
        }
        
        function editService(serviceId) {
            const service = businessServices.find(s => s._id === serviceId);
            if (service) {
                alert(\`Editar servicio: \${service.name}\\nID: \${serviceId}\`);
            }
        }
        
        async function deleteService(serviceId) {
            if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
            
            try {
                const response = await fetch(\`/api/business/\${businessId}/services/\${serviceId}\`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                if (result.success) {
                    loadBusinessServices();
                } else {
                    alert('Error al eliminar servicio');
                }
            } catch (error) {
                console.error('Error eliminando servicio:', error);
                alert('Error al eliminar servicio');
            }
        }

        // =============================================
        // FUNCIONES EXISTENTES DEL CALENDARIO
        // =============================================
        
        function updateStats() {
            const today = moment().format('YYYY-MM-DD');
            const todayAppointments = appointments.filter(apt =>
                moment(apt.dateTime).format('YYYY-MM-DD') === today
            );
            const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');

            document.getElementById('today-count').textContent = todayAppointments.length;
            document.getElementById('confirmed-count').textContent = confirmedAppointments.length;
        }

        function renderCalendar() {
            const container = document.getElementById('calendar-container');
            const title = document.getElementById('calendar-title');

            if (currentView === 'month') {
                renderMonthView(container, title);
            }
        }

        function renderMonthView(container, title) {
            title.textContent = currentDate.format('MMMM YYYY');
            container.innerHTML = '';

            ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.className = 'text-center font-bold p-2 text-gray-600';
                dayElement.textContent = day;
                container.appendChild(dayElement);
            });

            const startOfMonth = currentDate.clone().startOf('month');
            const endOfMonth = currentDate.clone().endOf('month');
            const startDay = startOfMonth.day();
            const daysInMonth = endOfMonth.date();

            for (let i = 0; i < startDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'text-center p-2 text-gray-300';
                container.appendChild(emptyDay);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement('div');
                const date = currentDate.clone().date(day);
                const dateStr = date.format('YYYY-MM-DD');
                const dayAppointments = calendarData[dateStr] || [];
                const isToday = dateStr === moment().format('YYYY-MM-DD');
                const isSelected = dateStr === selectedDate;

                dayElement.className = \`calendar-day text-center p-3 rounded-lg border-2 transition-all \${
                    dayAppointments.length > 0 ? 'has-appointments text-white' : 'bg-white text-gray-700'
                } \${
                    isToday ? 'border-yellow-400' : 'border-transparent'
                } \${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                }\`;

                dayElement.innerHTML = \`
                    <div class="font-bold">\${day}</div>
                    \${dayAppointments.length > 0 ?
                        \`<div class="text-xs mt-1">\${dayAppointments.length} citas</div>\` :
                        '<div class="text-xs mt-1 text-gray-400">-</div>'
                    }
                \`;

                dayElement.onclick = () => selectDate(dateStr);
                container.appendChild(dayElement);
            }
        }

        function selectDate(date) {
            selectedDate = date;
            renderCalendar();
            renderAppointmentsList();
        }

        function renderAppointmentsList() {
            const container = document.getElementById('appointments-list');
            const title = document.getElementById('selected-date-title');

            const dayAppointments = calendarData[selectedDate] || [];
            title.textContent = \`📋 Citas del \${moment(selectedDate).format('DD/MM/YYYY')}\`;

            if (dayAppointments.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay citas para este día</p>';
                return;
            }

            container.innerHTML = dayAppointments.map(apt => \`
                <div class="appointment-item glass-card rounded-lg p-4 cursor-pointer"
                     onclick="selectAppointment('\${apt._id}')">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-bold text-gray-800">\${apt.clientName}</h3>
                            <p class="text-gray-600 text-sm">\${apt.service}</p>
                            <p class="text-gray-500 text-xs">
                                \${moment(apt.dateTime).format('HH:mm')} -
                                <span class="status-badge status-\${apt.status}">\${apt.status}</span>
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-gray-500">\${moment(apt.dateTime).fromNow()}</p>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        function initChart() {
            const ctx = document.getElementById('performanceChart').getContext('2d');
            const last7Days = Array.from({length: 7}, (_, i) =>
                moment().subtract(i, 'days').format('YYYY-MM-DD')
            ).reverse();

            const appointmentsByDay = last7Days.map(date =>
                calendarData[date] ? calendarData[date].length : 0
            );

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: last7Days.map(date => moment(date).format('ddd DD')),
                    datasets: [{
                        label: 'Citas por Día',
                        data: appointmentsByDay,
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        function changeView(view) {
            currentView = view;
            renderCalendar();
        }

        function previousPeriod() {
            currentDate.subtract(1, currentView === 'month' ? 'month' : 'week');
            renderCalendar();
        }

        function nextPeriod() {
            currentDate.add(1, currentView === 'month' ? 'month' : 'week');
            renderCalendar();
        }

        function selectAppointment(appointmentId) {
            selectedAppointment = appointmentId;
            console.log('Cita seleccionada:', appointmentId);
        }

        function showQuickAction(action) {
            alert(\`Acción: \${action} - Funcionalidad en desarrollo\`);
        }
    </script>
</body>
</html>
    \`);
  } catch (error) {
    console.error('Error en dashboard pro:', error);
    res.status(500).send('Error cargando dashboard profesional');
  }
});

// POST - Agregar nuevo servicio
router.post("/:identifier/services", async (req, res) => {
  try {
    const { identifier } = req.params;
    const { name, description = "", duration = 30, price = 1000, active = true, category = "general", requiresPayment = false } = req.body;

    let business;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      business = await Business.findById(identifier);
    } else {
      business = await Business.findOne({ slug: identifier });
    }

    if (!business) {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }

    business.services.push({
      name,
      description,
      duration: parseInt(duration),
      price: parseInt(price),
      active,
      category,
      requiresPayment,
      customService: true,
      basePrice: parseInt(price), // Para custom, basePrice = price
      commission: 0,
      timesBooked: 0,
      revenue: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await business.save();
    res.json({ success: true, services: business.services });
  } catch (error) {
    console.error("Error al crear servicio:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT - Actualizar servicio
router.put("/:identifier/services/:serviceId", async (req, res) => {
  try {
    let business;
    if (req.params.identifier.match(/^[0-9a-fA-F]{24}$/)) {
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

    const { name, description, duration, price, active, category, requiresPayment } = req.body;

    if (name !== undefined) service.name = name;
    if (category !== undefined) service.category = category;
    if (requiresPayment !== undefined) service.requiresPayment = requiresPayment;
    if (description !== undefined) service.description = description;
    if (duration !== undefined) service.duration = duration;
    if (price !== undefined) service.price = price;
    if (active !== undefined) service.active = active;

    service.updatedAt = new Date();
    await business.save();

    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar servicio
router.delete("/:identifier/services/:serviceId", async (req, res) => {
  try {
    let business;
    if (req.params.identifier.match(/^[0-9a-fA-F]{24}$/)) {
      business = await Business.findById(req.params.identifier);
    } else {
      business = await Business.findOne({ slug: req.params.identifier });
    }

    if (!business) {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }

    business.services.id(req.params.serviceId).remove();
    await business.save();

    res.json({ success: true, message: "Servicio eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
}

module.exports = router;

