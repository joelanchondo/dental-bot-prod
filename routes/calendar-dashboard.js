const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const moment = require('moment-timezone');

// GET /calendar-dashboard - Calendario interactivo completo
router.get('/', async (req, res) => {
  try {
    const { businessId, clientName, service, phone } = req.query;

    if (!businessId || businessId === 'undefined') {
      return res.status(400).send('Error: businessId es requerido');
    }

    // Obtener datos del negocio
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).send('Negocio no encontrado');
    }

    // Obtener citas existentes para los próximos 30 días
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    const existingAppointments = await Appointment.find({
      businessId: businessId,
      datetime: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'pending'] }
    });

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
        .calendar-day { 
            cursor: pointer; 
            transition: all 0.2s;
        }
        .calendar-day:hover:not(.disabled) { 
            background-color: #3b82f6; 
            color: white;
        }
        .calendar-day.selected { 
            background-color: #2563eb; 
            color: white;
        }
        .calendar-day.disabled { 
            background-color: #f3f4f6; 
            color: #9ca3af; 
            cursor: not-allowed;
        }
        .calendar-day.occupied { 
            background-color: #fef2f2; 
            color: #dc2626;
        }
        .time-slot {
            cursor: pointer;
            transition: all 0.2s;
        }
        .time-slot:hover:not(.disabled) {
            background-color: #3b82f6;
            color: white;
        }
        .time-slot.selected {
            background-color: #2563eb;
            color: white;
        }
        .time-slot.disabled {
            background-color: #f3f4f6;
            color: #9ca3af;
            cursor: not-allowed;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen py-8">
    <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800">📅 ${business.businessName}</h1>
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

        <!-- Calendario -->
        <div id="calendar-section" class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <button onclick="previousMonth()" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">←</button>
                <h2 id="current-month" class="text-xl font-bold text-gray-800"></h2>
                <button onclick="nextMonth()" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">→</button>
            </div>
            <div id="calendar" class="grid grid-cols-7 gap-2 mb-4"></div>
        </div>

        <!-- Horarios -->
        <div id="time-slots-section" class="hidden">
            <h3 class="text-xl font-bold mb-4">Horarios disponibles para <span id="selected-date"></span></h3>
            <div id="time-slots" class="grid grid-cols-4 gap-2 mb-4"></div>
            <button onclick="backToCalendar()" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">← Volver al calendario</button>
        </div>

        <!-- Confirmación -->
        <div id="confirmation-section" class="hidden">
            <h3 class="text-xl font-bold mb-4">Confirmar cita</h3>
            <div id="appointment-details" class="mb-4 p-4 bg-green-50 rounded-lg"></div>
            <button onclick="confirmAppointment()" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2">✅ Confirmar cita</button>
            <button onclick="backToTimeSlots()" class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600">↶ Cambiar horario</button>
        </div>

        <!-- Loading -->
        <div id="loading" class="hidden text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-gray-600">Procesando...</p>
        </div>
    </div>

    <script>
        // Datos del negocio y paciente
        const businessData = {
            id: '${businessId}',
            name: '${business.businessName}',
            hours: ${JSON.stringify(business.businessHours)},
            timezone: 'America/Mexico_City'
        };

        const patientData = {
            name: '${clientName}',
            service: '${service}',
            phone: '${phone}'
        };

        const existingAppointments = ${JSON.stringify(existingAppointments.map(apt => ({
            datetime: apt.datetime,
            service: apt.service
        })))};

        let currentDate = moment();
        let selectedDate = null;
        let selectedTime = null;

        // Inicializar calendario
        function initCalendar() {
            renderCalendar();
        }

        // Renderizar calendario mensual
        function renderCalendar() {
            const calendarEl = document.getElementById('calendar');
            const monthYearEl = document.getElementById('current-month');
            
            monthYearEl.textContent = currentDate.format('MMMM YYYY');
            calendarEl.innerHTML = '';

            // Días de la semana
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            days.forEach(day => {
                const dayEl = document.createElement('div');
                dayEl.className = 'text-center font-bold text-gray-600';
                dayEl.textContent = day;
                calendarEl.appendChild(dayEl);
            });

            // Primer día del mes
            const startDate = currentDate.clone().startOf('month').startOf('week');
            // Último día del mes
            const endDate = currentDate.clone().endOf('month').endOf('week');

            let date = startDate.clone();
            while (date.isBefore(endDate)) {
                const dayEl = document.createElement('div');
                dayEl.className = 'calendar-day text-center p-2 rounded-lg border';
                
                if (!date.isSame(currentDate, 'month')) {
                    dayEl.classList.add('disabled');
                } else {
                    const isPast = date.isBefore(moment(), 'day');
                    const isAvailable = isDayAvailable(date);
                    const isOccupied = isDayOccupied(date);

                    if (isPast) {
                        dayEl.classList.add('disabled');
                    } else if (isOccupied) {
                        dayEl.classList.add('occupied');
                    } else if (isAvailable) {
                        dayEl.addEventListener('click', () => selectDate(date));
                    } else {
                        dayEl.classList.add('disabled');
                    }

                    if (selectedDate && date.isSame(selectedDate, 'day')) {
                        dayEl.classList.add('selected');
                    }
                }

                dayEl.textContent = date.date();
                calendarEl.appendChild(dayEl);
                date.add(1, 'day');
            }
        }

        // Verificar si un día está disponible según horarios del negocio
        function isDayAvailable(date) {
            const dayName = date.format('dddd').toLowerCase();
            const dayHours = businessData.hours[dayName];
            
            if (!dayHours || !dayHours.active) {
                return false;
            }
            return true;
        }

        // Verificar si un día tiene citas ocupadas
        function isDayOccupied(date) {
            return existingAppointments.some(apt => 
                moment(apt.datetime).isSame(date, 'day')
            );
        }

        // Seleccionar fecha
        function selectDate(date) {
            selectedDate = date.clone();
            renderCalendar();
            showTimeSlots();
        }

        // Mostrar horarios disponibles
        function showTimeSlots() {
            document.getElementById('calendar-section').classList.add('hidden');
            document.getElementById('time-slots-section').classList.remove('hidden');
            
            const selectedDateEl = document.getElementById('selected-date');
            selectedDateEl.textContent = selectedDate.format('dddd, D [de] MMMM [de] YYYY');
            
            const timeSlotsEl = document.getElementById('time-slots');
            timeSlotsEl.innerHTML = '';

            const dayName = selectedDate.format('dddd').toLowerCase();
            const dayHours = businessData.hours[dayName];
            
            if (!dayHours || !dayHours.active) {
                timeSlotsEl.innerHTML = '<p class="col-span-4 text-red-600">No hay horarios disponibles este día</p>';
                return;
            }

            const startTime = moment(dayHours.open, 'HH:mm');
            const endTime = moment(dayHours.close, 'HH:mm');
            const timeSlots = [];

            // Generar horarios cada 30 minutos
            let currentTime = startTime.clone();
            while (currentTime.isBefore(endTime)) {
                timeSlots.push(currentTime.format('HH:mm'));
                currentTime.add(30, 'minutes');
            }

            timeSlots.forEach(time => {
                const timeSlotEl = document.createElement('div');
                timeSlotEl.className = 'time-slot text-center p-3 rounded-lg border';
                
                const slotDateTime = selectedDate.clone().set({
                    hour: parseInt(time.split(':')[0]),
                    minute: parseInt(time.split(':')[1]),
                    second: 0
                });

                const isPast = slotDateTime.isBefore(moment());
                const isOccupied = existingAppointments.some(apt =>
                    moment(apt.datetime).isSame(slotDateTime)
                );

                if (isPast || isOccupied) {
                    timeSlotEl.classList.add('disabled');
                } else {
                    timeSlotEl.addEventListener('click', () => selectTime(time, slotDateTime));
                }

                timeSlotEl.textContent = time;
                timeSlotsEl.appendChild(timeSlotEl);
            });
        }

        // Seleccionar hora
        function selectTime(time, dateTime) {
            selectedTime = time;
            showConfirmation(dateTime);
        }

        // Mostrar confirmación
        function showConfirmation(dateTime) {
            document.getElementById('time-slots-section').classList.add('hidden');
            document.getElementById('confirmation-section').classList.remove('hidden');
            
            const detailsEl = document.getElementById('appointment-details');
            detailsEl.innerHTML = \`
                <p><strong>📅 Fecha:</strong> \${selectedDate.format('dddd, D [de] MMMM [de] YYYY')}</p>
                <p><strong>⏰ Hora:</strong> \${selectedTime}</p>
                <p><strong>👤 Paciente:</strong> \${patientData.name}</p>
                <p><strong>🦷 Servicio:</strong> \${patientData.service}</p>
                <p><strong>📞 Teléfono:</strong> \${patientData.phone}</p>
                <p><strong>🏢 Negocio:</strong> \${businessData.name}</p>
            \`;
        }

        // Navegación del calendario
        function previousMonth() {
            currentDate.subtract(1, 'month');
            renderCalendar();
        }

        function nextMonth() {
            currentDate.add(1, 'month');
            renderCalendar();
        }

        function backToCalendar() {
            document.getElementById('time-slots-section').classList.add('hidden');
            document.getElementById('confirmation-section').classList.add('hidden');
            document.getElementById('calendar-section').classList.remove('hidden');
        }

        function backToTimeSlots() {
            document.getElementById('confirmation-section').classList.add('hidden');
            document.getElementById('time-slots-section').classList.remove('hidden');
        }

        // Confirmar cita
        async function confirmAppointment() {
            document.getElementById('confirmation-section').classList.add('hidden');
            document.getElementById('loading').classList.remove('hidden');

            const appointmentData = {
                businessId: businessData.id,
                clientName: patientData.name,
                clientPhone: patientData.phone,
                service: patientData.service,
                dateTime: selectedDate.clone().set({
                    hour: parseInt(selectedTime.split(':')[0]),
                    minute: parseInt(selectedTime.split(':')[1]),
                    second: 0
                }).toISOString(),
                status: 'confirmed',
                source: 'web_calendar'
            };

            try {
                const response = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(appointmentData)
                });

                const result = await response.json();

                if (result.success) {
                    document.getElementById('loading').classList.add('hidden');
                    alert('✅ Cita confirmada exitosamente! Recibirás un mensaje de confirmación por WhatsApp.');
                    // Opcional: redirigir o cerrar
                } else {
                    throw new Error(result.error || 'Error al agendar cita');
                }
            } catch (error) {
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('confirmation-section').classList.remove('hidden');
                alert('❌ Error: ' + error.message);
            }
        }

        // Inicializar
        document.addEventListener('DOMContentLoaded', initCalendar);
    </script>
</body>
</html>
    `);
  } catch (error) {
    console.error('Error en calendario:', error);
    res.status(500).send('Error cargando el calendario');
  }
});

module.exports = router;
