const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const moment = require('moment');

// GET /dashboard-pro/:businessId - DASHBOARD ULTRA PROFESIONAL
router.get('/:businessId', async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);
    if (!business) {
      return res.status(404).send('Negocio no encontrado');
    }

    const appointments = await Appointment.find({ businessId: req.params.businessId })
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

    <script>
        // Datos globales
        const businessId = '${req.params.businessId}';
        const appointments = ${JSON.stringify(appointments)};
        const calendarData = ${JSON.stringify(calendarData)};
        
        let currentDate = moment();
        let currentView = 'month';
        let selectedDate = moment().format('YYYY-MM-DD');
        let selectedAppointment = null;

        // Inicialización
        document.addEventListener('DOMContentLoaded', function() {
            moment.locale('es');
            updateStats();
            renderCalendar();
            renderAppointmentsList();
            initChart();
        });

        // Actualizar estadísticas
        function updateStats() {
            const today = moment().format('YYYY-MM-DD');
            const todayAppointments = appointments.filter(apt => 
                moment(apt.dateTime).format('YYYY-MM-DD') === today
            );
            const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
            
            document.getElementById('today-count').textContent = todayAppointments.length;
            document.getElementById('confirmed-count').textContent = confirmedAppointments.length;
        }

        // Renderizar calendario
        function renderCalendar() {
            const container = document.getElementById('calendar-container');
            const title = document.getElementById('calendar-title');
            
            if (currentView === 'month') {
                renderMonthView(container, title);
            }
            // Aquí se pueden agregar las vistas de semana y día
        }

        function renderMonthView(container, title) {
            // Implementación del calendario mensual
            // (Código completo del calendario interactivo)
            title.textContent = currentDate.format('MMMM YYYY');
            container.innerHTML = '';
            
            // Días de la semana
            ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.className = 'text-center font-bold p-2 text-gray-600';
                dayElement.textContent = day;
                container.appendChild(dayElement);
            });
            
            // Días del mes
            const startOfMonth = currentDate.clone().startOf('month');
            const endOfMonth = currentDate.clone().endOf('month');
            const startDay = startOfMonth.day();
            const daysInMonth = endOfMonth.date();
            
            // Días vacíos al inicio
            for (let i = 0; i < startDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'text-center p-2 text-gray-300';
                container.appendChild(emptyDay);
            }
            
            // Días del mes
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

        // Seleccionar fecha
        function selectDate(date) {
            selectedDate = date;
            renderCalendar();
            renderAppointmentsList();
        }

        // Renderizar lista de citas
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

        // Inicializar gráfica
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

        // Funciones de navegación
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

        // Funciones de gestión
        function selectAppointment(appointmentId) {
            selectedAppointment = appointmentId;
            // Aquí se puede implementar la selección detallada
            console.log('Cita seleccionada:', appointmentId);
        }

        function showQuickAction(action) {
            alert(\`Acción: \${action} - Funcionalidad en desarrollo\`);
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

// Función básica para cargar servicios
async function loadRealServices() {
  try {
    const response = await fetch(`/api/business/${businessId}/services`);
    const services = await response.json();
    console.log('Servicios cargados:', services);
  } catch (error) {
    console.error('Error:', error);
  }
}
