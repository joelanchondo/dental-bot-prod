const express = require('express');
const router = express.Router();

// GET /calendar-dashboard - Dashboard de selección de fecha y hora
router.get('/', (req, res) => {
    // Parámetros recibidos del bot
    const { businessId, clientName, service, phone } = req.query;
    // La URL de API de guardado es relativa, ya montada en /api/save-appointment
    const API_URL_APPOINTMENT = '/api/save-appointment'; 
    const API_URL_AVAILABILITY = '/api/available-slots'; 

    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agendar Cita - Dental Bot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .time-slot {
            padding: 10px 15px;
            margin: 5px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
            user-select: none;
        }
        .time-slot:hover:not(.disabled) {
            background-color: #dbeafe; /* blue-100 */
        }
        .time-slot.selected {
            background-color: #3b82f6; /* blue-500 */
            color: white;
            transform: scale(1.05);
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
        }
        .time-slot.disabled {
            background-color: #f3f4f6; /* gray-100 */
            color: #9ca3af; /* gray-400 */
            cursor: not-allowed;
            text-decoration: line-through;
            opacity: 0.7;
            transform: none;
            box-shadow: none;
        }
        .day-header {
            background-color: #1d4ed8; /* blue-700 */
            color: white;
            padding: 10px;
            border-radius: 8px 8px 0 0;
            font-size: 1.25rem;
            font-weight: 700;
        }
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr); /* 6 días: L-S */
            gap: 15px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-left-color: #3b82f6;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 10px;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen p-8">
    <div class="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <div class="p-8">
            <h1 class="text-4xl font-extrabold text-blue-900 mb-2 text-center">📆 Agenda tu Cita</h1>
            <p class="text-xl text-gray-600 mb-8 text-center">Selecciona el día y la hora de tu preferencia</p>

            <div id="appointment-summary" class="bg-blue-50 p-4 rounded-lg mb-8 border border-blue-200">
                <h3 class="font-bold text-lg text-blue-800">Resumen:</h3>
                <p><strong>Paciente:</strong> <span id="clientNameDisplay">${clientName || 'N/A'}</span></p>
                <p><strong>Servicio:</strong> <span id="serviceDisplay">${service || 'N/A'}</span></p>
            </div>

            <div class="flex justify-between items-center mb-6">
                <button id="prevWeek" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300">
                    &larr; Anterior
                </button>
                <h2 id="currentWeekRange" class="text-2xl font-semibold text-gray-800 flex items-center">
                    <span id="loadingSpinner" class="hidden spinner"></span>
                    <span id="weekText"></span>
                </h2>
                <button id="nextWeek" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300">
                    Siguiente &rarr;
                </button>
            </div>

            <div id="calendar-grid" class="calendar-grid">
                </div>

            <div id="selection-status" class="mt-8 p-4 text-center border-t-2 border-gray-200">
                <p class="text-lg font-medium text-gray-700">Selecciona una hora para habilitar el botón de confirmación.</p>
                <button id="confirmBtn" class="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                    ✅ Confirmar Cita
                </button>
                <div id="message" class="mt-4 text-lg font-semibold"></div>
            </div>
        </div>
    </div>

    <script>
        const BUSINESS_ID = '${businessId || ''}';
        const CLIENT_NAME = '${clientName || 'N/A'}';
        const SERVICE = '${service || 'N/A'}';
        const PHONE = '${phone || 'N/A'}';
        const API_APPOINTMENT = '${API_URL_APPOINTMENT}';
        const API_AVAILABILITY = '${API_URL_AVAILABILITY}';
        
        // HORARIOS DEFINIDOS (Formato 'H:mm')
        const WEEKDAY_HOURS = Array.from({ length: 18 - 9 }, (_, i) => \`\${9 + i}:00\`); // 9:00 a 17:00
        const SATURDAY_HOURS = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00']; // 9:00 a 14:00 (hasta antes de las 15:00)

        const calendarGrid = document.getElementById('calendar-grid');
        const currentWeekRange = document.getElementById('weekText');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const confirmBtn = document.getElementById('confirmBtn');
        const messageDiv = document.getElementById('message');
        const today = new Date();
        
        let currentDate = new Date();
        let selectedSlot = null;
        let occupiedSlotsCache = {}; // Cache para disponibilidad { 'YYYY-MM-DD': ['HH:mm', 'HH:mm', ...] }

        function getStartOfWeek(date) {
            const start = new Date(date);
            const day = start.getDay(); // 0 = Domingo, 1 = Lunes, ...
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Ajuste a Lunes
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            return start;
        }

        async function fetchAvailabilityForWeek(startOfWeek) {
            loadingSpinner.classList.remove('hidden');
            occupiedSlotsCache = {};
            
            const dayPromises = [];
            
            for (let i = 1; i <= 6; i++) { // Lunes (1) a Sábado (6)
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + (i - 1));
                const dateString = dayDate.toISOString().split('T')[0];

                dayPromises.push(
                    fetch(\`\${API_AVAILABILITY}?businessId=\${BUSINESS_ID}&date=\${dateString}\`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                occupiedSlotsCache[dateString] = data.occupiedTimes;
                            } else {
                                console.error('Error fetching availability:', data.error);
                                occupiedSlotsCache[dateString] = [];
                            }
                        })
                        .catch(err => {
                            console.error('Network Error fetching availability:', err);
                            occupiedSlotsCache[dateString] = [];
                        })
                );
            }
            
            await Promise.all(dayPromises);
            loadingSpinner.classList.add('hidden');
        }


        function generateTimeSlots(dayIndex, dateString) {
            const dayDate = new Date(dateString);
            const isSaturday = dayIndex === 6; 
            const isToday = dayDate.toDateString() === today.toDateString();
            const isPastDay = dayDate < today && !isToday;

            if (dayIndex === 0 || isPastDay) {
                return '<div class="text-center text-gray-400 mt-4">Día no disponible/Pasado</div>';
            }

            const hours = isSaturday ? SATURDAY_HOURS : WEEKDAY_HOURS;
            const occupied = occupiedSlotsCache[dateString] || [];
            let html = '<div class="flex flex-wrap">';
            
            hours.forEach(time => {
                const isOccupied = occupied.includes(time);
                
                // Chequeo de hora pasada (solo para hoy)
                const [h, m] = time.split(':').map(Number);
                const slotTime = new Date(dayDate);
                slotTime.setHours(h, m, 0, 0);
                
                const isPastTime = isToday && slotTime < today;

                const isDisabled = isOccupied || isPastTime;
                const cssClass = isDisabled ? 'disabled' : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
                const handler = isDisabled ? '' : 'onclick="selectSlot(this)"';

                html += `<div 
                            class="time-slot ${cssClass}" 
                            data-datetime="${dateString}T${time}:00"
                            data-date="${dateString}"
                            data-time="${time}"
                            data-disabled="${isDisabled}"
                            ${handler}>
                            ${time}
                         </div>`;
            });
            
            html += '</div>';
            return html;
        }

        async function renderCalendar() {
            const startOfWeek = getStartOfWeek(currentDate);

            // 1. Obtener disponibilidad de la API
            await fetchAvailabilityForWeek(startOfWeek);

            // 2. Renderizar rango de semana
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 5); // Sábado
            const options = { month: 'short', day: 'numeric' };
            const startStr = startOfWeek.toLocaleDateString('es-MX', options);
            const endStr = endOfWeek.toLocaleDateString('es-MX', options);
            currentWeekRange.textContent = \`Semana del \${startStr} al \${endStr}\`;
            
            // Habilitar/Deshabilitar botón de semana anterior
            const startOfCurrentWeek = getStartOfWeek(new Date());
            document.getElementById('prevWeek').disabled = startOfWeek.getTime() <= startOfCurrentWeek.getTime();
            
            // 3. Generar la cuadrícula
            calendarGrid.innerHTML = '';
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            
            for (let i = 1; i <= 6; i++) { // Renderizar de Lunes (1) a Sábado (6)
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + (i - 1));
                
                const dayDateString = dayDate.toISOString().split('T')[0]; // YYYY-MM-DD
                const dayName = dayNames[i];

                const dayBlock = document.createElement('div');
                dayBlock.className = 'bg-white rounded-xl shadow-lg';
                dayBlock.innerHTML = \`
                    <div class="day-header \${i === 6 ? 'bg-purple-700' : ''}">
                        \${dayName} \${dayDate.getDate()}
                    </div>
                    <div class="p-3">
                        \${generateTimeSlots(i, dayDateString)}
                    </div>
                \`;
                calendarGrid.appendChild(dayBlock);
            }

            // 4. Re-seleccionar el slot si existe
            if (selectedSlot) {
                const currentSlotElement = document.querySelector(\`[data-datetime="\${selectedSlot.dateTime}"]\`);
                if (currentSlotElement && currentSlotElement.dataset.disabled === 'false') {
                    currentSlotElement.classList.add('selected');
                    confirmBtn.disabled = false;
                } else {
                    selectedSlot = null;
                    confirmBtn.disabled = true;
                }
            } else {
                confirmBtn.disabled = true;
            }
        }

        function selectSlot(element) {
            if (element.dataset.disabled === 'true') return;

            document.querySelectorAll('.time-slot.selected').forEach(e => e.classList.remove('selected'));
            
            element.classList.add('selected');
            selectedSlot = {
                dateTime: element.dataset.datetime,
                date: element.dataset.date,
                time: element.dataset.time
            };
            
            confirmBtn.disabled = false;
            messageDiv.textContent = \`Cita seleccionada: \${selectedSlot.date} a las \${selectedSlot.time}\`;
            messageDiv.className = 'mt-4 text-lg font-semibold text-blue-600';
        }

        async function confirmAppointment() {
            if (!selectedSlot || confirmBtn.disabled) return;
            
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Enviando...';
            messageDiv.textContent = 'Procesando la cita...';
            messageDiv.className = 'mt-4 text-lg font-semibold text-orange-500';

            const appointmentData = {
                businessId: BUSINESS_ID,
                clientName: CLIENT_NAME,
                phone: PHONE,
                service: SERVICE,
                dateTime: selectedSlot.dateTime
            };

            try {
                const response = await fetch(API_APPOINTMENT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appointmentData)
                });

                const result = await response.json();
                
                if (result.success) {
                    messageDiv.textContent = \`✅ ¡Cita Confirmada! Fecha: \${selectedSlot.date}, Hora: \${selectedSlot.time}.\`;
                    messageDiv.className = 'mt-4 text-xl font-bold text-green-700';
                    
                    confirmBtn.style.display = 'none'; 
                    document.querySelector('.calendar-grid').innerHTML = '<div class="col-span-full text-center p-10 text-2xl text-green-600">¡Cita Agendada! Recibirás la confirmación por WhatsApp.</div>';
                } else {
                    messageDiv.textContent = \`❌ Error al agendar: \${result.error || 'Intente de nuevo.'}\`;
                    messageDiv.className = 'mt-4 text-lg font-semibold text-red-600';
                    confirmBtn.disabled = false;
                    renderCalendar(); // Recargar el calendario si la reserva falló por disponibilidad
                }

            } catch (error) {
                messageDiv.textContent = \`❌ Error de red: \${error.message}\`;
                messageDiv.className = 'mt-4 text-lg font-semibold text-red-600';
                confirmBtn.disabled = false;
            }
            confirmBtn.textContent = '✅ Confirmar Cita';
        }

        // Navegación de semanas
        document.getElementById('prevWeek').addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() - 7);
            selectedSlot = null; // Limpiar selección al cambiar de semana
            renderCalendar();
        });

        document.getElementById('nextWeek').addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() + 7);
            selectedSlot = null; // Limpiar selección al cambiar de semana
            renderCalendar();
        });

        confirmBtn.addEventListener('click', confirmAppointment);

        // Inicialización
        document.addEventListener('DOMContentLoaded', () => {
            currentDate = getStartOfWeek(currentDate);
            renderCalendar();
        });
        
    </script>
</body>
</html>
    `);
});

module.exports = router;
