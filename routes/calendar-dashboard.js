const express = require('express');
const router = express.Router();

// GET / - Dashboard de selección de fecha y hora
router.get('/', (req, res) => {
    // Parámetros recibidos del bot (opcional pero bueno para pruebas)
    const { businessId, clientName, service, phone } = req.query;
    console.log('[CALENDAR] Params received:', { businessId, clientName, service, phone });

    // URL de API de su bot/servidor para guardar la cita
    const API_URL_APPOINTMENT = '/api/save-appointment'; // Ajuste esto a su endpoint de guardado

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
        .time-slot:hover {
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
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen p-8">
    <div class="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <div class="p-8">
            <h1 class="text-4xl font-extrabold text-blue-900 mb-2 text-center">📆 Agenda tu Cita Dental</h1>
            <p class="text-xl text-gray-600 mb-8 text-center">Selecciona el día y la hora de tu preferencia</p>

            <div id="appointment-summary" class="bg-blue-50 p-4 rounded-lg mb-8 border border-blue-200">
                <h3 class="font-bold text-lg text-blue-800">Resumen de la cita:</h3>
                <p><strong>Paciente:</strong> <span id="clientNameDisplay">${clientName || 'N/A'}</span></p>
                <p><strong>Servicio:</strong> <span id="serviceDisplay">${service || 'N/A'}</span></p>
                <p><strong>Teléfono:</strong> <span id="phoneDisplay">${phone || 'N/A'}</span></p>
                <p class="text-sm text-gray-500 mt-2">ID Negocio: ${businessId || 'N/A'}</p>
            </div>

            <div class="flex justify-between items-center mb-6">
                <button id="prevWeek" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300">
                    &larr; Semana Anterior
                </button>
                <h2 id="currentWeekRange" class="text-2xl font-semibold text-gray-800"></h2>
                <button id="nextWeek" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300">
                    Semana Siguiente &rarr;
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
        const BUSINESS_ID = '${businessId || 'N/A'}';
        const CLIENT_NAME = '${clientName || 'N/A'}';
        const SERVICE = '${service || 'N/A'}';
        const PHONE = '${phone || 'N/A'}';
        const API_ENDPOINT = '${API_URL_APPOINTMENT}';
        
        // HORARIOS DEFINIDOS
        const WEEKDAY_HOURS = Array.from({ length: 18 - 9 }, (_, i) => \`\${9 + i}:00\`); // 9:00 a 17:00 (hasta antes de las 18:00)
        const SATURDAY_HOURS = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00']; // 9:00 a 14:00 (hasta antes de las 15:00)

        const calendarGrid = document.getElementById('calendar-grid');
        const currentWeekRange = document.getElementById('currentWeekRange');
        const confirmBtn = document.getElementById('confirmBtn');
        const messageDiv = document.getElementById('message');
        
        let currentDate = new Date();
        let selectedSlot = null;

        function getStartOfWeek(date) {
            const start = new Date(date);
            const day = start.getDay(); // 0 = Domingo, 1 = Lunes, ...
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Ajuste a Lunes
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            return start;
        }

        function generateTimeSlots(dayIndex, dateString) {
            const isSaturday = dayIndex === 6; // 6 = Sábado
            const isSunday = dayIndex === 0; // 0 = Domingo
            
            if (isSunday) {
                return '<div class="text-center text-gray-400 mt-4">Día no disponible</div>';
            }

            const hours = isSaturday ? SATURDAY_HOURS : WEEKDAY_HOURS;
            let html = '<div class="flex flex-wrap">';
            
            hours.forEach(time => {
                const dateTime = \`\${dateString}T\${time}:00\`;
                html += \`<div 
                            class="time-slot bg-gray-200 hover:bg-gray-300 text-gray-800" 
                            data-datetime="\${dateTime}"
                            data-date="\${dateString}"
                            data-time="\${time}"
                            onclick="selectSlot(this)">
                            \${time}
                         </div>\`;
            });
            
            html += '</div>';
            return html;
        }

        function renderCalendar() {
            const startOfWeek = getStartOfWeek(currentDate);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 4); // Viernes

            // Mostrar el rango
            const options = { month: 'short', day: 'numeric' };
            const startStr = startOfWeek.toLocaleDateString('es-MX', options);
            const endStr = endOfWeek.toLocaleDateString('es-MX', options);
            currentWeekRange.textContent = \`Semana del \${startStr} al \${endStr}\`;

            // Generar la cuadrícula
            calendarGrid.innerHTML = '';
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            
            // Renderizar de Lunes a Sábado
            for (let i = 1; i <= 6; i++) {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + (i - 1)); // Lunes es i=1
                
                const dayDateString = dayDate.toISOString().split('T')[0]; // YYYY-MM-DD
                const dayName = dayNames[i];

                const dayBlock = document.createElement('div');
                dayBlock.className = 'bg-white rounded-xl shadow-lg';
                dayBlock.innerHTML = \`
                    <div class="day-header text-center \${i === 6 ? 'bg-purple-700' : ''}">\${dayName} \${dayDate.getDate()}</div>
                    <div class="p-3">
                        \${generateTimeSlots(i, dayDateString)}
                    </div>
                \`;
                calendarGrid.appendChild(dayBlock);
            }

            // Seleccionar el slot actual si existe
            if (selectedSlot) {
                const currentSlotElement = document.querySelector(\`[data-datetime="\${selectedSlot.dateTime}"]\`);
                if (currentSlotElement) {
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
            // Limpiar selección previa
            document.querySelectorAll('.time-slot.selected').forEach(e => e.classList.remove('selected'));
            
            // Seleccionar nuevo slot
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
                dateTime: selectedSlot.dateTime // Formato ISO 8601
            };

            console.log('Datos a enviar:', appointmentData);

            try {
                // Simulación de envío a la API
                /*
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appointmentData)
                });

                const result = await response.json();
                */
                
                // Simulación de respuesta exitosa
                await new Promise(resolve => setTimeout(resolve, 1500));
                const result = { success: true, message: 'Cita agendada correctamente.' };


                if (result.success) {
                    messageDiv.textContent = \`✅ ¡Cita Confirmada! Fecha: \${selectedSlot.date}, Hora: \${selectedSlot.time}\`;
                    messageDiv.className = 'mt-4 text-xl font-bold text-green-700';
                    
                    // Aquí es donde puede redirigir al usuario de vuelta al bot o mostrar un mensaje final.
                    confirmBtn.style.display = 'none'; 
                    document.querySelector('.calendar-grid').innerHTML = '<div class="col-span-full text-center p-10 text-2xl text-green-600">¡Cita Agendada! Recibirás la confirmación por WhatsApp.</div>';
                } else {
                    messageDiv.textContent = \`❌ Error al agendar: \${result.message || 'Intente de nuevo.'}\`;
                    messageDiv.className = 'mt-4 text-lg font-semibold text-red-600';
                    confirmBtn.disabled = false;
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
            const today = new Date();
            const startOfNextWeek = new Date(getStartOfWeek(currentDate));
            // Previene ir a semanas pasadas.
            if (startOfNextWeek.getTime() > getStartOfWeek(today).getTime()) {
                currentDate.setDate(currentDate.getDate() - 7);
                renderCalendar();
            } else {
                alert('No se pueden agendar citas en el pasado.');
            }
        });

        document.getElementById('nextWeek').addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() + 7);
            renderCalendar();
        });

        confirmBtn.addEventListener('click', confirmAppointment);

        // Inicialización
        document.addEventListener('DOMContentLoaded', () => {
            // Asegurar que empezamos en el lunes de la semana actual
            currentDate = getStartOfWeek(currentDate);
            renderCalendar();
        });
        
    </script>
</body>
</html>
    `);
});

module.exports = router;
