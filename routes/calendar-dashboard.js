const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const moment = require('moment');

// GET /calendar-dashboard - Calendario con datos demo
router.get('/', async (req, res) => {
  try {
    const { businessId, clientName, service, phone } = req.query;

    console.log('🔍 CALENDARIO - businessId recibido:', businessId);

    if (!businessId || businessId === 'undefined') {
      return res.status(400).send('❌ Error: businessId es requerido');
    }

    // Intentar cargar negocio real, si no existe usar demo
    let business = await Business.findById(businessId);
    
    if (!business) {
      console.log('⚠️ Negocio no encontrado en BD, usando datos DEMO');
      business = {
        _id: businessId,
        businessName: "🦷 Clínica Dental Demo",
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
        ]
      };
    }

    console.log('✅ Negocio cargado:', business.businessName);

    // Obtener citas existentes (vacío para demo)
    const existingAppointments = [];

    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendario - ${business.businessName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/moment@2.29.4/min/moment.min.js"></script>
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
            <p class="text-green-600 font-bold">🚀 MODO DEMO - FUNCIONANDO</p>
            <p class="text-gray-600">Selecciona fecha y hora para tu cita</p>
        </div>

        <!-- Información del paciente -->
        <div class="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 class="font-bold text-lg mb-2">Resumen de la cita:</h3>
            <div class="grid grid-cols-2 gap-2">
                <p><strong>Paciente:</strong> ${clientName || 'Joel Anchondo'}</p>
                <p><strong>Servicio:</strong> ${service || 'Limpieza Dental'}</p>
                <p><strong>Teléfono:</strong> ${phone || '+5216143718812'}</p>
                <p><strong>Negocio:</strong> ${business.businessName}</p>
            </div>
        </div>

        <!-- Calendario Interactivo -->
        <div id="calendar-section">
            <div class="flex justify-between items-center mb-4">
                <button onclick="previousMonth()" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">←</button>
                <h2 id="current-month" class="text-xl font-bold text-gray-800">Diciembre 2025</h2>
                <button onclick="nextMonth()" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">→</button>
            </div>
            
            <!-- Calendario mensual -->
            <div class="grid grid-cols-7 gap-2 mb-4">
                <!-- Días de la semana -->
                <div class="text-center font-bold p-2">Dom</div>
                <div class="text-center font-bold p-2">Lun</div>
                <div class="text-center font-bold p-2">Mar</div>
                <div class="text-center font-bold p-2">Mié</div>
                <div class="text-center font-bold p-2">Jue</div>
                <div class="text-center font-bold p-2">Vie</div>
                <div class="text-center font-bold p-2">Sáb</div>
                
                <!-- Días del mes (ejemplo) -->
                ${Array.from({length: 35}, (_, i) => {
                  const day = i - 2; // Empezar desde día 1
                  if (day <= 0 || day > 31) {
                    return '<div class="text-center p-2 text-gray-300"> </div>';
                  }
                  const isAvailable = day % 2 === 0; // Días pares disponibles
                  return `
                    <div class="text-center p-2 rounded-lg border ${
                      isAvailable 
                        ? 'calendar-day bg-blue-100 hover:bg-blue-200' 
                        : 'disabled bg-gray-100'
                    }" onclick="${isAvailable ? 'selectDate(' + day + ')' : ''}">
                      ${day}
                    </div>
                  `;
                }).join('')}
            </div>
        </div>

        <!-- Horarios (aparece al seleccionar fecha) -->
        <div id="time-slots-section" class="hidden">
            <h3 class="text-xl font-bold mb-4">Horarios disponibles</h3>
            <div class="grid grid-cols-4 gap-2 mb-4">
                <div class="time-slot text-center p-3 bg-blue-100 rounded-lg border hover:bg-blue-200" onclick="selectTime('09:00')">09:00</div>
                <div class="time-slot text-center p-3 bg-blue-100 rounded-lg border hover:bg-blue-200" onclick="selectTime('10:00')">10:00</div>
                <div class="time-slot text-center p-3 bg-blue-100 rounded-lg border hover:bg-blue-200" onclick="selectTime('11:00')">11:00</div>
                <div class="time-slot text-center p-3 bg-blue-100 rounded-lg border hover:bg-blue-200" onclick="selectTime('12:00')">12:00</div>
            </div>
        </div>

        <!-- Confirmación -->
        <div id="confirmation-section" class="hidden p-4 bg-green-50 rounded-lg">
            <h3 class="text-xl font-bold mb-4">✅ Cita Confirmada</h3>
            <p>Tu cita ha sido agendada exitosamente.</p>
            <p class="text-sm text-gray-600 mt-2">Recibirás un mensaje de confirmación por WhatsApp.</p>
        </div>
    </div>

    <script>
        function selectDate(day) {
            document.getElementById('time-slots-section').classList.remove('hidden');
            document.getElementById('current-month').textContent = \`Seleccionado: Diciembre \${day}, 2025\`;
        }

        function selectTime(time) {
            document.getElementById('time-slots-section').classList.add('hidden');
            document.getElementById('confirmation-section').classList.remove('hidden');
            setTimeout(() => {
                alert('🎉 Cita agendada para: Diciembre 15, 2025 a las ' + time);
            }, 500);
        }

        function previousMonth() {
            alert('← Mes anterior');
        }

        function nextMonth() {
            alert('→ Mes siguiente');
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
