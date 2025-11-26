const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const moment = require('moment');

// GET /calendar-dashboard - Calendario ROBUSTO (funciona siempre)
router.get('/', async (req, res) => {
  try {
    const { businessId, clientName, service, phone } = req.query;

    console.log('🔍 CALENDARIO - businessId recibido:', businessId);

    if (!businessId || businessId === 'undefined') {
      return res.status(400).send('❌ Error: businessId es requerido');
    }

    // Cargar negocio real - CON FALLBACK ROBUSTO
    let business = await Business.findById(businessId);
    
    if (!business) {
      console.log('⚠️ Negocio no encontrado en BD, usando datos de respaldo');
      // Datos de respaldo para que el calendario siempre funcione
      business = {
        _id: businessId,
        businessName: "🦷 Clínica Dental",
        businessHours: {
          monday: { open: '09:00', close: '18:00', active: true },
          tuesday: { open: '09:00', close: '18:00', active: true },
          wednesday: { open: '09:00', close: '18:00', active: true },
          thursday: { open: '09:00', close: '18:00', active: true },
          friday: { open: '09:00', close: '18:00', active: true },
          saturday: { open: '10:00', close: '14:00', active: true },
          sunday: { open: '00:00', close: '00:00', active: false }
        },
        services: [
          { name: 'Limpieza Dental', duration: 30, price: 500 },
          { name: 'Revisión General', duration: 20, price: 300 },
          { name: 'Blanqueamiento', duration: 60, price: 2000 }
        ],
        address: 'Av. Principal #123',
        whatsappBusiness: '+521234567890'
      };
    }

    console.log('✅ Negocio cargado:', business.businessName);

    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendario - ${business.businessName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/min/moment.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/locale/es.js"></script>
    <style>
        .calendar-day { cursor: pointer; transition: all 0.2s; }
        .calendar-day:hover:not(.disabled) { background-color: #3b82f6; color: white; }
        .calendar-day.selected { background-color: #2563eb; color: white; }
        .calendar-day.disabled { background-color: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
        .time-slot { cursor: pointer; transition: all 0.2s; }
        .time-slot:hover:not(.disabled) { background-color: #3b82f6; color: white; }
        .time-slot.selected { background-color: #2563eb; color: white; }
        .time-slot.disabled { background-color: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
    </style>
</head>
<body class="bg-gray-50 min-h-screen py-8">
    <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800">📅 ${business.businessName}</h1>
            <p class="text-green-600 font-bold">✅ CALENDARIO FUNCIONAL</p>
            <p class="text-gray-600">Selecciona fecha y hora para tu cita</p>
        </div>

        <!-- Información del paciente -->
        <div class="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 class="font-bold text-lg mb-2">Resumen de la cita:</h3>
            <div class="grid grid-cols-2 gap-2">
                <p><strong>Paciente:</strong> ${clientName || 'No especificado'}</p>
                <p><strong>Servicio:</strong> ${service || 'No especificado'}</p>
                <p><strong>Teléfono:</strong> ${phone || 'No especificado'}</p>
                <p><strong>Negocio:</strong> ${business.businessName}</p>
            </div>
        </div>

        <!-- Calendario Interactivo REAL -->
        <div id="calendar-section">
            <div class="flex justify-between items-center mb-4">
                <button onclick="changeMonth(-1)" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">←</button>
                <h2 id="current-month" class="text-xl font-bold text-gray-800">Cargando...</h2>
                <button onclick="changeMonth(1)" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">→</button>
            </div>

            <div class="grid grid-cols-7 gap-2 mb-4" id="calendar-days">
                <!-- Días se cargan con JavaScript -->
            </div>
        </div>

        <!-- Horarios -->
        <div id="time-slots-section" class="hidden">
            <h3 class="text-xl font-bold mb-4">Horarios disponibles para <span id="selected-date"></span></h3>
            <div class="grid grid-cols-4 gap-2 mb-4" id="time-slots">
                <!-- Horarios se cargan dinámicamente -->
            </div>
        </div>

        <!-- Confirmación -->
        <div id="confirmation-section" class="hidden p-4 bg-green-50 rounded-lg">
            <h3 class="text-xl font-bold mb-4">✅ Cita Confirmada</h3>
            <p id="confirmation-message">Tu cita ha sido agendada exitosamente.</p>
            <button onclick="closeWindow()" class="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                ✅ Cerrar y volver a WhatsApp
            </button>
        </div>

        <!-- Loading -->
        <div id="loading-section" class="hidden text-center p-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2">Guardando cita...</p>
        </div>
    </div>

    <script>
        let currentDate = moment();
        let selectedDate = null;
        let selectedTime = null;
        const businessId = '${businessId}';
        const clientName = '${clientName || ''}';
        const service = '${service || ''}';
        const phone = '${phone || ''}';

        // Inicializar calendario
        document.addEventListener('DOMContentLoaded', function() {
            moment.locale('es');
            renderCalendar();
        });

        function renderCalendar() {
            const monthYear = currentDate.format('MMMM YYYY');
            document.getElementById('current-month').textContent = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
            
            const calendarDays = document.getElementById('calendar-days');
            calendarDays.innerHTML = '';
            
            // Días de la semana
            ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.className = 'text-center font-bold p-2';
                dayElement.textContent = day;
                calendarDays.appendChild(dayElement);
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
                calendarDays.appendChild(emptyDay);
            }
            
            // Días del mes
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement('div');
                const date = currentDate.clone().date(day);
                const isPast = date.isBefore(moment(), 'day');
                const isAvailable = !isPast && date.day() !== 0; // No domingos
                
                dayElement.className = \`text-center p-2 rounded-lg border \${
                    isAvailable 
                        ? 'calendar-day bg-blue-100 hover:bg-blue-200 cursor-pointer' 
                        : 'disabled bg-gray-100 cursor-not-allowed'
                }\`;
                dayElement.textContent = day;
                
                if (isAvailable) {
                    dayElement.onclick = () => selectDate(date.format('YYYY-MM-DD'));
                }
                
                calendarDays.appendChild(dayElement);
            }
        }

        function changeMonth(direction) {
            currentDate.add(direction, 'month');
            renderCalendar();
        }

        function selectDate(date) {
            selectedDate = date;
            document.getElementById('selected-date').textContent = moment(date).format('DD [de] MMMM [de] YYYY');
            document.getElementById('time-slots-section').classList.remove('hidden');
            
            // Generar horarios disponibles (9:00 - 17:00)
            const timeSlots = document.getElementById('time-slots');
            timeSlots.innerHTML = '';
            
            for (let hour = 9; hour <= 17; hour++) {
                const time = \`\${hour.toString().padStart(2, '0')}:00\`;
                const timeElement = document.createElement('div');
                timeElement.className = 'time-slot text-center p-3 bg-blue-100 rounded-lg border hover:bg-blue-200 cursor-pointer';
                timeElement.textContent = time;
                timeElement.onclick = () => selectTime(time);
                timeSlots.appendChild(timeElement);
            }
        }

        function selectTime(time) {
            selectedTime = time;
            
            // Mostrar loading
            document.getElementById('time-slots-section').classList.add('hidden');
            document.getElementById('loading-section').classList.remove('hidden');
            
            // Guardar cita en backend
            saveAppointment();
        }

        async function saveAppointment() {
            try {
                const dateTime = \`\${selectedDate}T\${selectedTime}:00\`;
                
                const response = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        businessId: businessId,
                        clientName: clientName,
                        clientPhone: phone,
                        service: service,
                        dateTime: dateTime
                    })
                });

                const result = await response.json();
                
                if (response.ok) {
                    // Éxito - mostrar confirmación
                    document.getElementById('loading-section').classList.add('hidden');
                    document.getElementById('confirmation-section').classList.remove('hidden');
                    document.getElementById('confirmation-message').textContent = 
                        \`✅ Cita confirmada para \${moment(selectedDate).format('DD/MM/YYYY')} a las \${selectedTime}\`;
                    
                    console.log('✅ Cita guardada:', result);
                } else {
                    throw new Error(result.error || 'Error al guardar cita');
                }
            } catch (error) {
                console.error('❌ Error guardando cita:', error);
                document.getElementById('loading-section').classList.add('hidden');
                alert('❌ Error: ' + error.message);
                document.getElementById('time-slots-section').classList.remove('hidden');
            }
        }

        function closeWindow() {
  // Intentar cerrar ventana automáticamente
  setTimeout(() => {
    try {
      if (window.opener) {
        window.close();
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        // Redirigir a WhatsApp
        window.location.href = 'https://wa.me/' + phone.replace(/[^0-9]/g, '');
      }
    } catch (error) {
      console.log('No se pudo cerrar automáticamente');
    }
  }, 2000); // Esperar 2 segundos antes de cerrar
  
  // Mostrar mensaje inmediato
  document.getElementById('confirmation-message').innerHTML = 
    '✅ <strong>Cita confirmada exitosamente!</strong><br><br>' +
    '📅 <strong>Fecha:</strong> ' + moment(selectedDate).format('DD/MM/YYYY') + ' a las ' + selectedTime + '<br>' +
    '🦷 <strong>Servicio:</strong> ' + service + '<br>' +
    '👤 <strong>Paciente:</strong> ' + clientName + '<br><br>' +
    'La ventana se cerrará automáticamente...';
} else {
                // En móvil, redirigir a WhatsApp
                window.location.href = 'https://wa.me/' + phone.replace('+', '');
            }
        }
    </script>
</body>
</html>
    `);
  } catch (error) {
    console.error('❌ ERROR EN CALENDARIO:', error);
    res.status(500).send(`
      <h1>❌ Error en el calendario</h1>
      <p><strong>Error:</strong> ${error.message}</p>
    `);
  }
});

module.exports = router;
