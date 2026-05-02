const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const moment = require('moment');
const mongoose = require('mongoose');

// =========================================================
// 0. CALENDAR DASHBOARD (PARA CLIENTES) - DEBE IR ANTES DE /:identifier
// =========================================================

// GET - Interfaz del calendario para el cliente
router.get('/calendar-dashboard', async (req, res) => {
    try {
        const { businessId, clientName, service, phone } = req.query;

        if (!businessId || !clientName || !service) {
            return res.status(400).send('Faltan datos para agendar. Vuelve a escribir por WhatsApp.');
        }

        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).send('Negocio no encontrado.');
        }

        const serviceObj = (business.services || []).find(s => s.name === service);
        const serviceDuration = serviceObj?.duration || 30;
        const servicePrice = serviceObj?.price || 0;

        // Obtener citas existentes para bloquear horarios
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 60);

        const existingAppointments = await Appointment.find({
            businessId: business._id,
            dateTime: { $gte: today, $lte: maxDate },
            status: { $in: ['pending', 'confirmed'] }
        }).sort({ dateTime: 1 });

        // Generar mapa de ocupados: { "2026-01-15": ["09:00", "10:00"] }
        const bookedSlots = {};
        existingAppointments.forEach(apt => {
            const dateKey = moment(apt.dateTime).format('YYYY-MM-DD');
            const timeKey = moment(apt.dateTime).format('HH:mm');
            if (!bookedSlots[dateKey]) bookedSlots[dateKey] = [];
            bookedSlots[dateKey].push(timeKey);
        });

        res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agendar Cita - ${business.businessName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg-primary: #0a0a0f;
            --bg-secondary: #12121a;
            --bg-card: #1a1a24;
            --bg-hover: #22222e;
            --border-color: #2a2a3a;
            --text-primary: #ffffff;
            --text-secondary: #8b8b9e;
            --text-muted: #5a5a6e;
            --accent: #f59e0b;
            --accent-light: #fbbf24;
            --success: #10b981;
            --danger: #ef4444;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
        }
        
        /* Header */
        .cal-header {
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .cal-logo {
            width: 48px; height: 48px;
            background: linear-gradient(135deg, var(--accent), var(--accent-light));
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 24px;
            flex-shrink: 0;
        }
        .cal-title { font-size: 20px; font-weight: 700; }
        .cal-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

        /* Progress */
        .progress-bar {
            display: flex;
            padding: 20px;
            gap: 8px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
        }
        .progress-step {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }
        .progress-circle {
            width: 36px; height: 36px;
            border-radius: 50%;
            background: var(--bg-hover);
            border: 2px solid var(--border-color);
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; font-weight: 600;
            color: var(--text-muted);
            transition: all 0.3s;
        }
        .progress-step.active .progress-circle {
            background: var(--accent);
            border-color: var(--accent);
            color: #000;
        }
        .progress-step.done .progress-circle {
            background: var(--success);
            border-color: var(--success);
            color: #fff;
        }
        .progress-label {
            font-size: 11px;
            color: var(--text-muted);
            text-align: center;
            font-weight: 500;
        }
        .progress-step.active .progress-label,
        .progress-step.done .progress-label { color: var(--text-primary); }

        /* Content */
        .cal-content { max-width: 600px; margin: 0 auto; padding: 24px 20px; }

        /* Summary Card */
        .summary-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
        }
        .summary-row:not(:last-child) {
            border-bottom: 1px solid var(--border-color);
        }
        .summary-label {
            font-size: 13px;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .summary-value {
            font-size: 14px;
            font-weight: 600;
        }

        /* Calendar */
        .cal-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .cal-nav-btn {
            width: 40px; height: 40px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }
        .cal-nav-btn:hover { background: var(--accent); color: #000; border-color: var(--accent); }
        .cal-month-label { font-size: 18px; font-weight: 600; }

        .cal-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 6px;
            margin-bottom: 24px;
        }
        .cal-day-name {
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            padding: 8px 0;
        }
        .cal-day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            background: var(--bg-card);
            border: 1px solid transparent;
            color: var(--text-secondary);
        }
        .cal-day:hover { border-color: var(--accent); color: var(--text-primary); }
        .cal-day.disabled {
            opacity: 0.25;
            cursor: not-allowed;
            pointer-events: none;
        }
        .cal-day.selected {
            background: var(--accent);
            color: #000;
            font-weight: 700;
            border-color: var(--accent);
        }
        .cal-day.today {
            border-color: var(--accent);
            color: var(--accent);
        }
        .cal-day.has-slots::after {
            content: '';
            position: absolute;
            bottom: 4px;
            width: 4px; height: 4px;
            background: var(--success);
            border-radius: 50%;
        }
        .cal-day { position: relative; }

        /* Time Slots */
        .slots-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .slots-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 24px;
        }
        .slot-btn {
            padding: 14px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            color: var(--text-primary);
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
        }
        .slot-btn:hover { border-color: var(--accent); background: var(--bg-hover); }
        .slot-btn.selected {
            background: var(--accent);
            color: #000;
            border-color: var(--accent);
        }
        .slot-btn.booked {
            opacity: 0.3;
            cursor: not-allowed;
            text-decoration: line-through;
        }

        /* Buttons */
        .btn-confirm {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, var(--accent), var(--accent-light));
            color: #000;
            border: none;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .btn-confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
        }
        .btn-confirm:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        /* Success */
        .success-screen {
            display: none;
            text-align: center;
            padding: 40px 20px;
        }
        .success-screen.show { display: block; }
        .success-icon {
            width: 100px; height: 100px;
            background: rgba(16, 185, 129, 0.1);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
            font-size: 48px;
            animation: successPop 0.5s ease;
        }
        @keyframes successPop {
            0% { transform: scale(0); }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        .success-title { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
        .success-text { font-size: 14px; color: var(--text-secondary); margin-bottom: 32px; line-height: 1.6; }
        .success-detail {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 14px;
            padding: 20px;
            text-align: left;
            margin-bottom: 24px;
        }

        .hidden { display: none !important; }

        /* Loading */
        .loading-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        .loading-overlay.show { display: flex; }
        .spinner {
            width: 48px; height: 48px;
            border: 4px solid var(--border-color);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 400px) {
            .slots-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>

    <!-- Header -->
    <div class="cal-header">
        <div class="cal-logo">${business.businessType === 'dental' ? '🦷' : '🏢'}</div>
        <div>
            <div class="cal-title">${business.businessName}</div>
            <div class="cal-subtitle">Agenda tu cita en línea</div>
        </div>
    </div>

    <!-- Progress -->
    <div class="progress-bar">
        <div class="progress-step done" id="step-1">
            <div class="progress-circle"><i class="fas fa-check"></i></div>
            <div class="progress-label">Servicio</div>
        </div>
        <div class="progress-step active" id="step-2">
            <div class="progress-circle">2</div>
            <div class="progress-label">Fecha</div>
        </div>
        <div class="progress-step" id="step-3">
            <div class="progress-circle">3</div>
            <div class="progress-label">Hora</div>
        </div>
        <div class="progress-step" id="step-4">
            <div class="progress-circle">4</div>
            <div class="progress-label">Confirmar</div>
        </div>
    </div>

    <!-- Booking Form -->
    <div class="cal-content" id="booking-form">
        <!-- Summary -->
        <div class="summary-card">
            <div class="summary-row">
                <span class="summary-label"><i class="fas fa-user"></i> Cliente</span>
                <span class="summary-value">${clientName}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label"><i class="fas fa-tooth"></i> Servicio</span>
                <span class="summary-value">${service}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label"><i class="fas fa-clock"></i> Duración</span>
                <span class="summary-value">${serviceDuration} min</span>
            </div>
            ${servicePrice > 0 ? `
            <div class="summary-row">
                <span class="summary-label"><i class="fas fa-dollar-sign"></i> Precio</span>
                <span class="summary-value" style="color: var(--accent);">$${servicePrice.toLocaleString()}</span>
            </div>` : ''}
        </div>

        <!-- Calendar -->
        <div id="calendar-section">
            <div class="cal-nav">
                <button class="cal-nav-btn" onclick="changeMonth(-1)"><i class="fas fa-chevron-left"></i></button>
                <span class="cal-month-label" id="month-label"></span>
                <button class="cal-nav-btn" onclick="changeMonth(1)"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="cal-grid" id="cal-grid"></div>
        </div>

        <!-- Time Slots -->
        <div id="slots-section" class="hidden">
            <div class="slots-title" id="slots-date-label">Horarios disponibles</div>
            <div class="slots-grid" id="slots-grid"></div>
            <button class="btn-confirm" id="btn-confirm" disabled onclick="confirmAppointment()">
                <i class="fas fa-calendar-check"></i>
                Confirmar Cita
            </button>
        </div>
    </div>

    <!-- Success Screen -->
    <div class="success-screen" id="success-screen">
        <div class="success-icon">✅</div>
        <div class="success-title">¡Cita Confirmada!</div>
        <div class="success-text">
            Tu cita ha sido agendada correctamente.<br>
            Te enviaremos un recordatorio por WhatsApp.
        </div>
        <div class="success-detail">
            <div class="summary-row">
                <span class="summary-label"><i class="fas fa-calendar"></i> Fecha</span>
                <span class="summary-value" id="final-date"></span>
            </div>
            <div class="summary-row">
                <span class="summary-label"><i class="fas fa-clock"></i> Hora</span>
                <span class="summary-value" id="final-time"></span>
            </div>
            <div class="summary-row">
                <span class="summary-label"><i class="fas fa-tooth"></i> Servicio</span>
                <span class="summary-value" id="final-service"></span>
            </div>
            <div class="summary-row">
                <span class="summary-label"><i class="fas fa-user"></i> Cliente</span>
                <span class="summary-value" id="final-client"></span>
            </div>
        </div>
        <a href="https://wa.me/${phone || ''}" class="btn-confirm" style="text-decoration: none;">
            <i class="fab fa-whatsapp"></i>
            Volver a WhatsApp
        </a>
    </div>

    <!-- Loading -->
    <div class="loading-overlay" id="loading">
        <div class="spinner"></div>
    </div>

    <script>
        // === DATA ===
        const BOOKED = ${JSON.stringify(bookedSlots)};
        const BIZ_ID = "${business._id}";
        const CLIENT = "${clientName.replace(/"/g, "\\'")}";
        const SERVICE = "${service.replace(/"/g, "\\'")}";
        const PHONE = "${phone || ''}";
        const DURATION = ${serviceDuration};
        const PRICE = ${servicePrice};

        let currentMonth = moment();
        let selectedDate = null;
        let selectedTime = null;

        // === BUSINESS HOURS ===
        const BUSINESS_HOURS = { start: 9, end: 19 }; // 9am - 7pm

        // === INIT ===
        renderCalendar();

        function renderCalendar() {
            const label = document.getElementById('month-label');
            const grid = document.getElementById('cal-grid');
            label.textContent = currentMonth.format('MMMM YYYY');

            const start = currentMonth.clone().startOf('month').startOf('week');
            const end = currentMonth.clone().endOf('month').endOf('week');
            const today = moment().startOf('day');
            let day = start.clone();

            let html = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
                .map(d => '<div class="cal-day-name">' + d + '</div>').join('');

            while (day.isSameOrBefore(end)) {
                const isCurrent = day.month() === currentMonth.month();
                const isPast = day.isBefore(today);
                const isSunday = day.day() === 0;
                const isDisabled = !isCurrent || isPast || isSunday;
                const isToday = day.isSame(today, 'day');
                const dateStr = day.format('YYYY-MM-DD');
                const hasSlots = !isDisabled && getAvailableSlots(dateStr).length > 0;

                let cls = 'cal-day';
                if (isDisabled) cls += ' disabled';
                if (isToday) cls += ' today';
                if (selectedDate === dateStr) cls += ' selected';
                if (hasSlots) cls += ' has-slots';

                html += '<div class="' + cls + '" onclick="selectDate(\\'' + dateStr + '\\', this)">' + day.date() + '</div>';
                day.add(1, 'day');
            }
            grid.innerHTML = html;
        }

        function changeMonth(delta) {
            currentMonth.add(delta, 'months');
            renderCalendar();
        }

        function selectDate(dateStr, el) {
            if (el.classList.contains('disabled')) return;
            selectedDate = dateStr;
            selectedTime = null;
            document.getElementById('btn-confirm').disabled = true;
            renderCalendar();
            renderSlots(dateStr);
            document.getElementById('slots-section').classList.remove('hidden');
            document.getElementById('step-2').classList.remove('active');
            document.getElementById('step-2').classList.add('done');
            document.getElementById('step-2').querySelector('.progress-circle').innerHTML = '<i class="fas fa-check"></i>';
            document.getElementById('step-3').classList.add('active');
            document.getElementById('slots-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function getAvailableSlots(dateStr) {
            const booked = BOOKED[dateStr] || [];
            const slots = [];
            for (let h = BUSINESS_HOURS.start; h < BUSINESS_HOURS.end; h++) {
                for (let m = 0; m < 60; m += 30) {
                    const time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                    if (!booked.includes(time)) {
                        slots.push(time);
                    }
                }
            }
            return slots;
        }

        function renderSlots(dateStr) {
            const grid = document.getElementById('slots-grid');
            const label = document.getElementById('slots-date-label');
            const booked = BOOKED[dateStr] || [];
            const allSlots = [];

            for (let h = BUSINESS_HOURS.start; h < BUSINESS_HOURS.end; h++) {
                for (let m = 0; m < 60; m += 30) {
                    const time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                    const isBooked = booked.includes(time);
                    allSlots.push({ time, isBooked });
                }
            }

            label.textContent = 'Horarios para ' + moment(dateStr).format('dddd D [de] MMMM');

            grid.innerHTML = allSlots.map(s => {
                const cls = s.isBooked ? 'slot-btn booked' : 'slot-btn';
                const disabled = s.isBooked ? 'disabled' : '';
                return '<button class="' + cls + '" ' + disabled + ' onclick="selectTime(\\'' + s.time + '\\', this)">' +
                       formatTime12(s.time) + '</button>';
            }).join('');
        }

        function formatTime12(time24) {
            const [h, m] = time24.split(':').map(Number);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
        }

        function selectTime(time, el) {
            if (el.classList.contains('booked')) return;
            selectedTime = time;
            document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
            el.classList.add('selected');
            document.getElementById('btn-confirm').disabled = false;
            document.getElementById('step-3').classList.remove('active');
            document.getElementById('step-3').classList.add('done');
            document.getElementById('step-3').querySelector('.progress-circle').innerHTML = '<i class="fas fa-check"></i>';
            document.getElementById('step-4').classList.add('active');
            document.getElementById('btn-confirm').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        async function confirmAppointment() {
            if (!selectedDate || !selectedTime) return;

            document.getElementById('loading').classList.add('show');
            document.getElementById('btn-confirm').disabled = true;

            try {
                const dateTime = moment(selectedDate + ' ' + selectedTime, 'YYYY-MM-DD HH:mm').toDate();

                const res = await fetch('/calendar-dashboard/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessId: BIZ_ID,
                        clientName: CLIENT,
                        clientPhone: PHONE,
                        service: SERVICE,
                        servicePrice: PRICE,
                        serviceDuration: DURATION,
                        dateTime: dateTime.toISOString()
                    })
                });

                const data = await res.json();

                if (data.success) {
                    // Show success
                    document.getElementById('booking-form').classList.add('hidden');
                    document.getElementById('success-screen').classList.add('show');
                    document.getElementById('final-date').textContent = moment(selectedDate).format('dddd D [de] MMMM, YYYY');
                    document.getElementById('final-time').textContent = formatTime12(selectedTime);
                    document.getElementById('final-service').textContent = SERVICE;
                    document.getElementById('final-client').textContent = CLIENT;
                    document.getElementById('step-4').classList.remove('active');
                    document.getElementById('step-4').classList.add('done');
                    document.getElementById('step-4').querySelector('.progress-circle').innerHTML = '<i class="fas fa-check"></i>';
                } else {
                    throw new Error(data.error || 'Error al confirmar');
                }
            } catch (err) {
                alert('Error: ' + err.message);
                document.getElementById('btn-confirm').disabled = false;
            } finally {
                document.getElementById('loading').classList.remove('show');
            }
        }
    </script>
</body>
</html>
        `);
    } catch (error) {
        console.error('Error en calendar-dashboard:', error);
        res.status(500).send('Error cargando calendario');
    }
});

// POST - Confirmar cita desde el calendario
router.post('/calendar-dashboard/confirm', async (req, res) => {
    try {
        const { businessId, clientName, clientPhone, service, servicePrice, serviceDuration, dateTime } = req.body;

        if (!businessId || !clientName || !service || !dateTime) {
            return res.status(400).json({ success: false, error: 'Faltan datos obligatorios' });
        }

        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ success: false, error: 'Negocio no encontrado' });
        }

        // Verificar que el horario no esté ocupado
        const existingAppointment = await Appointment.findOne({
            businessId: business._id,
            dateTime: new Date(dateTime),
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingAppointment) {
            return res.status(409).json({ success: false, error: 'Este horario ya fue reservado. Por favor elige otro.' });
        }

        // Crear la cita con TODOS los campos que el dashboard necesita
        const newAppointment = new Appointment({
            businessId: business._id,
            clientName: clientName,
            clientPhone: clientPhone || '',
            service: service,
            serviceName: service,
            servicePrice: servicePrice || 0,
            serviceDuration: serviceDuration || 30,
            totalAmount: servicePrice || 0,
            dateTime: new Date(dateTime),
            status: 'confirmed',
            source: 'whatsapp-bot',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newAppointment.save();

        res.json({ success: true, appointment: newAppointment });

    } catch (error) {
        console.error('Error al confirmar cita:', error);
        res.status(500).json({ success: false, error: 'Error al guardar la cita' });
    }
});

// =========================================================
// 1. API ROUTES
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

// GET - Citas (mejorado con más filtros)
router.get("/:identifier/data/appointments", async (req, res) => {
    try {
        const { identifier } = req.params;
        const { month, year, status, limit } = req.query;
        let business;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            business = await Business.findById(identifier);
        } else {
            business = await Business.findOne({ slug: identifier });
        }
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const query = {
            businessId: business._id,
            dateTime: { $gte: startDate, $lte: endDate }
        };

        if (status && status !== 'all') {
            query.status = status;
        }

        let findQuery = Appointment.find(query).sort({ dateTime: 1 });
        if (limit) findQuery = findQuery.limit(parseInt(limit));

        const appointments = await findQuery;
        res.json(appointments);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET - Analytics
router.get("/:identifier/data/analytics", async (req, res) => {
    try {
        const { identifier } = req.params;
        let business;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            business = await Business.findById(identifier);
        } else {
            business = await Business.findOne({ slug: identifier });
        }
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const appointments = await Appointment.find({
            businessId: business._id,
            dateTime: { $gte: thirtyDaysAgo }
        });

        const dailyData = {};
        appointments.forEach(apt => {
            const day = moment(apt.dateTime).format('YYYY-MM-DD');
            if (!dailyData[day]) dailyData[day] = { count: 0, revenue: 0 };
            dailyData[day].count++;
            dailyData[day].revenue += apt.totalAmount || 0;
        });

        res.json({
            totalAppointments: appointments.length,
            completedAppointments: appointments.filter(a => a.status === 'completed').length,
            cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
            totalRevenue: appointments.reduce((sum, a) => sum + (a.totalAmount || 0), 0),
            dailyData
        });
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

// PUT - Update appointment status
router.put("/:identifier/data/appointments/:appointmentId", async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.appointmentId,
            { status, updatedAt: new Date() },
            { new: true }
        );
        if (!appointment) return res.status(404).json({ error: "Cita no encontrada" });
        res.json({ success: true, appointment });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST - Add Location
router.post("/:identifier/data/locations", async (req, res) => {
    try {
        let business = mongoose.Types.ObjectId.isValid(req.params.identifier)
            ? await Business.findById(req.params.identifier)
            : await Business.findOne({ slug: req.params.identifier });
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

        const { name, address, phone } = req.body;
        business.locations.push({ name, address, phone });
        await business.save();
        res.json({ success: true, locations: business.locations });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST - Update Logo
router.post("/:identifier/data/logo", express.json({ limit: '5mb' }), async (req, res) => {
    try {
        let business;
        if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
            business = await Business.findById(req.params.identifier);
        } else {
            business = await Business.findOne({ slug: req.params.identifier });
        }
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

        business.logoUrl = req.body.logoUrl;
        await business.save();
        res.json({ success: true, logoUrl: business.logoUrl });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// =========================================================
// 2. DASHBOARD PRO - ENTERPRISE EDITION
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = await Appointment.countDocuments({
            businessId: business._id,
            dateTime: { $gte: today, $lt: tomorrow }
        });

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const monthAppointments = await Appointment.find({
            businessId: business._id,
            dateTime: { $gte: monthStart, $lte: monthEnd }
        });

        const monthRevenue = monthAppointments.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
        const completedCount = monthAppointments.filter(a => a.status === 'completed').length;

        let locTermPlural = 'Sucursales';
        let locTermSingular = 'Sucursal';
        if (['medical', 'dental'].includes(business.businessType)) {
            locTermPlural = 'Consultorios / Doctores';
            locTermSingular = 'Consultorio o Doctor';
        } else if (business.businessType === 'automotive') {
            locTermPlural = 'Talleres / Mecánicos';
            locTermSingular = 'Taller o Mecánico';
        } else if (['barbershop', 'spa', 'nails'].includes(business.businessType)) {
            locTermPlural = 'Sucursales / Especialistas';
            locTermSingular = 'Sucursal o Especialista';
        }

        res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Pro - ${business.businessName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/min/moment.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/locale/es.js"></script>
    <style>
        :root {
            --bg-primary: #0a0a0f;
            --bg-secondary: #12121a;
            --bg-card: #1a1a24;
            --bg-hover: #22222e;
            --border-color: #2a2a3a;
            --text-primary: #ffffff;
            --text-secondary: #8b8b9e;
            --text-muted: #5a5a6e;
            --accent: #f59e0b;
            --accent-light: #fbbf24;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --info: #3b82f6;
            --purple: #8b5cf6;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
        }

        .sidebar {
            width: 260px;
            background: var(--bg-secondary);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            position: fixed;
            height: 100vh;
            z-index: 100;
        }

        .sidebar-header {
            padding: 24px;
            border-bottom: 1px solid var(--border-color);
        }

        .sidebar-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: var(--text-primary);
        }

        .sidebar-logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--accent), var(--accent-light));
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .sidebar-logo-text {
            font-size: 18px;
            font-weight: 700;
        }

        .sidebar-logo-text span {
            color: var(--accent);
        }

        .sidebar-nav {
            flex: 1;
            padding: 16px 12px;
            overflow-y: auto;
        }

        .nav-section {
            margin-bottom: 24px;
        }

        .nav-section-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            padding: 0 12px;
            margin-bottom: 8px;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 10px;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 4px;
        }

        .nav-item:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
        }

        .nav-item.active {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
            color: var(--accent);
            border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .nav-item i {
            width: 20px;
            text-align: center;
            font-size: 16px;
        }

        .nav-item .badge {
            margin-left: auto;
            background: var(--accent);
            color: #000;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
        }

        .sidebar-footer {
            padding: 16px;
            border-top: 1px solid var(--border-color);
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: var(--bg-card);
            border-radius: 12px;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--purple), var(--info));
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }

        .user-details {
            flex: 1;
            min-width: 0;
        }

        .user-name {
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .user-plan {
            font-size: 11px;
            color: var(--accent);
            font-weight: 500;
        }

        .main-content {
            flex: 1;
            margin-left: 260px;
            min-height: 100vh;
        }

        .topbar {
            height: 70px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
            position: sticky;
            top: 0;
            z-index: 50;
        }

        .topbar-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .page-title {
            font-size: 20px;
            font-weight: 700;
        }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .status-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 20px;
            font-size: 13px;
            color: var(--success);
            font-weight: 500;
        }

        .status-badge .dot {
            width: 8px;
            height: 8px;
            background: var(--success);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .topbar-btn {
            width: 40px;
            height: 40px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }

        .topbar-btn:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
        }

        .page-content {
            padding: 32px;
        }

        .section {
            display: none;
        }

        .section.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.3s;
        }

        .stat-card:hover {
            border-color: rgba(245, 158, 11, 0.3);
            transform: translateY(-2px);
        }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .stat-icon.blue { background: rgba(59, 130, 246, 0.1); color: var(--info); }
        .stat-icon.green { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .stat-icon.yellow { background: rgba(245, 158, 11, 0.1); color: var(--accent); }
        .stat-icon.purple { background: rgba(139, 92, 246, 0.1); color: var(--purple); }

        .stat-trend {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 500;
            padding: 4px 8px;
            border-radius: 6px;
        }

        .stat-trend.up {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .stat-value {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 4px;
            letter-spacing: -0.02em;
        }

        .stat-label {
            font-size: 14px;
            color: var(--text-secondary);
        }

        .card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            overflow: hidden;
        }

        .card-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .card-title {
            font-size: 16px;
            font-weight: 600;
        }

        .card-body {
            padding: 24px;
        }

        .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
        }

        .grid-3 {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
        }

        .chart-container {
            height: 300px;
            position: relative;
        }

        /* ============================================
           APPOINTMENT ITEM - MEJORADO
           ============================================ */
        .appointments-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .appointment-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 18px 20px;
            background: var(--bg-hover);
            border-radius: 14px;
            border: 1px solid var(--border-color);
            transition: all 0.2s;
        }

        .appointment-item:hover {
            border-color: rgba(245, 158, 11, 0.3);
            background: var(--bg-card);
        }

        .appointment-time-block {
            min-width: 72px;
            text-align: center;
            background: var(--bg-secondary);
            padding: 10px 8px;
            border-radius: 10px;
            border: 1px solid var(--border-color);
        }

        .appointment-time-value {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.02em;
        }

        .appointment-time-label {
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 2px;
        }

        .appointment-divider {
            width: 3px;
            height: 44px;
            background: linear-gradient(to bottom, var(--accent), var(--accent-light));
            border-radius: 2px;
            flex-shrink: 0;
        }

        .appointment-info {
            flex: 1;
            min-width: 0;
        }

        .appointment-client {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .appointment-client-icon {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, var(--purple), var(--info));
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            flex-shrink: 0;
            color: #fff;
        }

        .appointment-service-row {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .appointment-service {
            font-size: 13px;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .appointment-phone {
            font-size: 12px;
            color: var(--text-muted);
            font-family: 'SF Mono', 'Fira Code', monospace;
        }

        .appointment-price {
            font-size: 13px;
            font-weight: 600;
            color: var(--accent);
        }

        .appointment-duration {
            font-size: 11px;
            color: var(--text-muted);
            background: var(--bg-secondary);
            padding: 2px 8px;
            border-radius: 6px;
        }

        .appointment-source {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .appointment-source.whatsapp-bot {
            background: rgba(37, 211, 102, 0.1);
            color: #25d366;
        }

        .appointment-source.manual {
            background: rgba(59, 130, 246, 0.1);
            color: var(--info);
        }

        .appointment-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
            flex-shrink: 0;
        }

        .appointment-status {
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
        }

        .appointment-status.pending {
            background: rgba(245, 158, 11, 0.1);
            color: var(--accent);
            border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .appointment-status.confirmed {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .appointment-status.completed {
            background: rgba(59, 130, 246, 0.1);
            color: var(--info);
            border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .appointment-status.cancelled {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .appointment-status.rescheduled {
            background: rgba(139, 92, 246, 0.1);
            color: var(--purple);
            border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .appointment-actions-select {
            padding: 6px 10px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 12px;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }

        .appointment-actions-select:hover {
            border-color: var(--accent);
        }

        .appointment-actions-select:focus {
            outline: none;
            border-color: var(--accent);
        }

        /* Calendar */
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .calendar-nav {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .calendar-nav-btn {
            width: 36px;
            height: 36px;
            background: var(--bg-hover);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }

        .calendar-nav-btn:hover {
            background: var(--accent);
            color: #000;
            border-color: var(--accent);
        }

        .calendar-month {
            font-size: 18px;
            font-weight: 600;
            min-width: 160px;
            text-align: center;
        }

        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 8px;
        }

        .calendar-day-header {
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-muted);
            padding: 8px;
        }

        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            background: var(--bg-hover);
            border: 1px solid transparent;
        }

        .calendar-day:hover {
            border-color: var(--accent);
        }

        .calendar-day.other-month {
            opacity: 0.3;
        }

        .calendar-day.today {
            background: linear-gradient(135deg, var(--accent), var(--accent-light));
            color: #000;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }

        .calendar-day.today.has-appointments::after {
            background: #000;
            box-shadow: none;
        }

        /* Tooltip de Citas */
        .calendar-tooltip {
            position: fixed;
            background: var(--bg-card);
            border: 1px solid var(--accent);
            border-radius: 12px;
            padding: 12px;
            z-index: 2000;
            pointer-events: none;
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
            display: none;
            min-width: 180px;
        }

        .tooltip-item {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            padding: 4px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .tooltip-item:last-child { border: none; }
        .tooltip-time { color: var(--accent); font-weight: 700; margin-right: 8px; }
        .tooltip-name { color: var(--text-primary); }

        /* Day Detail Popup */
        .day-detail-popup {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            width: 90%;
            max-width: 480px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1001;
            box-shadow: 0 25px 60px rgba(0,0,0,0.5);
        }

        .day-detail-popup.show { display: block; }

        .day-detail-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            z-index: 1000;
        }

        .day-detail-overlay.show { display: block; }

        .day-detail-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .day-detail-body {
            padding: 16px 24px;
        }

        /* Services Grid */
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        .service-card {
            background: var(--bg-hover);
            border: 1px solid var(--border-color);
            border-radius: 14px;
            padding: 20px;
            transition: all 0.3s;
        }

        .service-card:hover {
            border-color: rgba(245, 158, 11, 0.3);
            transform: translateY(-2px);
        }

        .service-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }

        .service-icon {
            width: 48px;
            height: 48px;
            background: rgba(245, 158, 11, 0.1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }

        .service-price {
            font-size: 20px;
            font-weight: 700;
            color: var(--accent);
        }

        .service-name {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .service-duration {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 16px;
        }

        .service-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 16px;
            border-top: 1px solid var(--border-color);
        }

        .service-status {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
        }

        .service-status .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .service-status.active .dot { background: var(--success); }
        .service-status.active { color: var(--success); }
        .service-status.inactive .dot { background: var(--text-muted); }
        .service-status.inactive { color: var(--text-muted); }

        .service-actions {
            display: flex;
            gap: 8px;
        }

        .service-btn {
            width: 32px;
            height: 32px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }

        .service-btn:hover {
            background: var(--accent);
            color: #000;
            border-color: var(--accent);
        }

        .service-btn.delete:hover {
            background: var(--danger);
            border-color: var(--danger);
            color: #fff;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            text-decoration: none;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--accent), var(--accent-light));
            color: #000;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
        }

        .btn-secondary {
            background: var(--bg-hover);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
        }

        .btn-secondary:hover {
            background: var(--bg-card);
            border-color: var(--accent);
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 8px;
        }

        .form-input {
            width: 100%;
            padding: 12px 16px;
            background: var(--bg-hover);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            font-size: 14px;
            color: var(--text-primary);
            transition: all 0.2s;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--accent);
            background: var(--bg-card);
        }

        .form-input::placeholder {
            color: var(--text-muted);
        }

        .modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            width: 100%;
            max-width: 480px;
            max-height: 90vh;
            overflow-y: auto;
        }

        .modal-header {
            padding: 24px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-title {
            font-size: 18px;
            font-weight: 700;
        }

        .modal-close {
            width: 36px;
            height: 36px;
            background: var(--bg-hover);
            border: none;
            border-radius: 8px;
            color: var(--text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .modal-close:hover {
            background: var(--danger);
            color: #fff;
        }

        .modal-body {
            padding: 24px;
        }

        .modal-footer {
            padding: 20px 24px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .bot-status-card {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02));
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
        }

        .bot-status-card.inactive {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02));
            border-color: rgba(245, 158, 11, 0.2);
        }

        .bot-status-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .bot-status-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .bot-status-icon {
            width: 48px;
            height: 48px;
            background: rgba(16, 185, 129, 0.15);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: var(--success);
        }

        .bot-status-card.inactive .bot-status-icon {
            background: rgba(245, 158, 11, 0.15);
            color: var(--accent);
        }

        .bot-number {
            font-size: 24px;
            font-weight: 700;
            font-family: 'SF Mono', monospace;
        }

        .bot-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-top: 20px;
        }

        .bot-stat {
            text-align: center;
            padding: 16px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
        }

        .bot-stat-value {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .bot-stat-label {
            font-size: 12px;
            color: var(--text-secondary);
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .empty-state-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .empty-state-text {
            font-size: 14px;
            color: var(--text-secondary);
            margin-bottom: 24px;
        }

        .search-box {
            position: relative;
            margin-bottom: 24px;
        }

        .search-box i {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
        }

        .search-box input {
            width: 100%;
            padding: 12px 16px 12px 44px;
            background: var(--bg-hover);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            font-size: 14px;
            color: var(--text-primary);
        }

        .search-box input:focus {
            outline: none;
            border-color: var(--accent);
        }

        @media (max-width: 1200px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .grid-3 { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s;
            }
            .sidebar.open { transform: translateX(0); }
            .main-content { margin-left: 0; }
            .stats-grid { grid-template-columns: 1fr; }
            .page-content { padding: 16px; }
            .appointment-item {
                flex-wrap: wrap;
            }
            .appointment-right {
                flex-direction: row;
                width: 100%;
                justify-content: space-between;
                padding-top: 12px;
                border-top: 1px solid var(--border-color);
            }
        }
    </style>
</head>
<body>
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <a href="/" class="sidebar-logo">
                <div class="sidebar-logo-icon">🤖</div>
                <div class="sidebar-logo-text">Bot<span>SaaS</span></div>
            </a>
        </div>

        <nav class="sidebar-nav">
            <div class="nav-section">
                <div class="nav-section-title">Principal</div>
                <div class="nav-item active" data-section="overview">
                    <i class="fas fa-chart-pie"></i>
                    <span>Dashboard</span>
                </div>
                <div class="nav-item" data-section="appointments">
                    <i class="fas fa-calendar-check"></i>
                    <span>Citas</span>
                    <span class="badge" id="today-badge">${todayAppointments}</span>
                </div>
                <div class="nav-item" data-section="calendar">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Calendario</span>
                </div>
            </div>

            <div class="nav-section">
                <div class="nav-section-title">Gestión</div>
                <div class="nav-item" data-section="services">
                    <i class="fas fa-concierge-bell"></i>
                    <span>Servicios</span>
                </div>
                ${['ultra', 'premium'].includes((business.plan || '').toLowerCase()) ? `
                <div class="nav-item" data-section="locations">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${locTermPlural}</span>
                    <span class="badge" style="background:#8b5cf6; color:white;">ULTRA</span>
                </div>
                ` : ''}
                <div class="nav-item" data-section="clients">
                    <i class="fas fa-users"></i>
                    <span>Clientes</span>
                </div>
            </div>

            <div class="nav-section">
                <div class="nav-section-title">Bot & Config</div>
                <div class="nav-item" data-section="bot">
                    <i class="fab fa-whatsapp"></i>
                    <span>WhatsApp Bot</span>
                </div>
                <div class="nav-item" data-section="settings">
                    <i class="fas fa-cog"></i>
                    <span>Configuración</span>
                </div>
            </div>
        </nav>

        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar" style="${business.logoUrl ? 'background: url(' + "'" + business.logoUrl + "'" + ') center/cover;' : ''}">
                    ${business.logoUrl ? '' : '🏢'}
                </div>
                <div class="user-details">
                    <div class="user-name">${business.businessName}</div>
                    <div class="user-plan">${(business.plan || 'free-trial').toUpperCase()}</div>
                </div>
            </div>
        </div>
    </aside>

    <main class="main-content">
        <header class="topbar">
            <div class="topbar-left">
                <button class="topbar-btn" id="menu-toggle" style="display: none;">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title" id="page-title">Dashboard</h1>
            </div>
            <div class="topbar-right">
                <div class="status-badge">
                    <span class="dot"></span>
                    Bot Activo
                </div>
                <button class="topbar-btn" onclick="loadAppointments()" title="Refrescar datos">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="topbar-btn" onclick="window.location.href='/'">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </header>

        <div class="page-content">
            <!-- Overview -->
            <section class="section active" id="overview-section">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon blue"><i class="fas fa-calendar-day"></i></div>
                        </div>
                        <div class="stat-value" id="stat-today">${todayAppointments}</div>
                        <div class="stat-label">Citas Hoy</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
                        </div>
                        <div class="stat-value" id="stat-completed">${completedCount}</div>
                        <div class="stat-label">Completadas (Mes)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon yellow"><i class="fas fa-dollar-sign"></i></div>
                        </div>
                        <div class="stat-value" id="stat-revenue">$${monthRevenue.toLocaleString()}</div>
                        <div class="stat-label">Ingresos (Mes)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon purple"><i class="fas fa-calendar-alt"></i></div>
                        </div>
                        <div class="stat-value" id="stat-month">0</div>
                        <div class="stat-label">Citas del Mes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon orange"><i class="fas fa-concierge-bell"></i></div>
                        </div>
                        <div class="stat-value" id="stat-services">${business.services?.length || 0}</div>
                        <div class="stat-label">Servicios Activos</div>
                    </div>
                </div>

                <div class="grid-3" style="margin-bottom: 32px;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Ingresos (Últimos 7 días)</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-container"><canvas id="revenueChart"></canvas></div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Servicios</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-container"><canvas id="servicesChart"></canvas></div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Citas de Hoy</h3>
                        <button class="btn btn-secondary" onclick="navigateToSection('appointments')">Ver Todas</button>
                    </div>
                    <div class="card-body">
                        <div class="appointments-list" id="today-appointments">
                            <div class="empty-state">
                                <div class="empty-state-icon">📅</div>
                                <div class="empty-state-title">Sin citas para hoy</div>
                                <div class="empty-state-text">Las próximas citas aparecerán aquí</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Appointments -->
            <section class="section" id="appointments-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Todas las Citas</h3>
                        <select class="form-input" id="apt-status-filter" style="width: auto; padding: 8px 12px;">
                            <option value="all">Todos</option>
                            <option value="pending">Pendientes</option>
                            <option value="confirmed">Confirmadas</option>
                            <option value="completed">Completadas</option>
                            <option value="cancelled">Canceladas</option>
                        </select>
                    </div>
                    <div class="card-body">
                        <div class="appointments-list" id="all-appointments">
                            <p style="color: var(--text-secondary);">Cargando...</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Calendar -->
            <section class="section" id="calendar-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Calendario</h3>
                        <div class="calendar-nav">
                            <button class="calendar-nav-btn" onclick="changeMonth(-1)"><i class="fas fa-chevron-left"></i></button>
                            <span class="calendar-month" id="calendar-month"></span>
                            <button class="calendar-nav-btn" onclick="changeMonth(1)"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="calendar-grid" id="calendar-grid"></div>
                    </div>
                </div>
            </section>

            <!-- Services -->
            <section class="section" id="services-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="font-size: 24px; font-weight: 700;">Mis Servicios</h2>
                    <button class="btn btn-primary" onclick="showServiceModal()"><i class="fas fa-plus"></i> Nuevo Servicio</button>
                </div>
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="service-search" placeholder="Buscar servicios..." oninput="filterServices()">
                </div>
                <div class="services-grid" id="services-grid"></div>
            </section>

            <!-- Clients -->
            <section class="section" id="clients-section">
                <div class="card">
                    <div class="card-header"><h3 class="card-title">Base de Clientes</h3></div>
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="empty-state-icon">👥</div>
                            <div class="empty-state-title">Clientes</div>
                            <div class="empty-state-text">Los clientes aparecerán aquí automáticamente</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Bot -->
            <section class="section" id="bot-section">
                <div class="bot-status-card ${business.whatsapp?.status === 'active' ? '' : 'inactive'}">
                    <div class="bot-status-header">
                        <div class="bot-status-info">
                            <div class="bot-status-icon"><i class="fab fa-whatsapp"></i></div>
                            <div>
                                <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">
                                    ${business.whatsapp?.status === 'active' ? 'WhatsApp Conectado' : 'WhatsApp Pendiente'}
                                </div>
                                <div class="bot-number">${business.whatsapp?.number || 'Sin número'}</div>
                            </div>
                        </div>
                        ${business.whatsapp?.status !== 'active' ? '<button class="btn btn-primary" onclick="activateBot()"><i class="fas fa-bolt"></i> Activar Bot</button>' : ''}
                    </div>
                </div>
            </section>

            <!-- Locations -->
            ${['ultra', 'premium'].includes((business.plan || '').toLowerCase()) ? `
            <section class="section" id="locations-section">
                <div class="card">
                    <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                        <h3 class="card-title">${locTermPlural} (Plan Ultra)</h3>
                        <button class="btn btn-primary" onclick="openLocationModal()"><i class="fas fa-plus"></i> Nuevo(a) ${locTermSingular}</button>
                    </div>
                    <div class="card-body">
                        ${business.locations && business.locations.length > 0 ? business.locations.map(loc => '<div style="background:var(--bg-hover);padding:16px;border-radius:12px;border:1px solid var(--border-color);margin-bottom:12px;"><strong>' + loc.name + '</strong><br><span style="color:var(--text-muted);font-size:13px;">' + (loc.address || '') + ' • ' + (loc.phone || '') + '</span></div>').join('') : '<div class="empty-state"><div class="empty-state-icon">🏢</div><div class="empty-state-title">Sin registros</div></div>'}
                    </div>
                </div>
            </section>
            ` : ''}

            <!-- Settings -->
            <section class="section" id="settings-section">
                <div class="card">
                    <div class="card-header"><h3 class="card-title">Configuración</h3></div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">Logo</label>
                            <div style="display: flex; gap: 20px; align-items: flex-end;">
                                <div style="width: 100px; height: 100px; border-radius: 12px; background: var(--bg-hover) ${business.logoUrl ? "url('" + business.logoUrl + "') center/cover" : ''}; border: 1px dashed var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">
                                    ${business.logoUrl ? '' : '<i class="fas fa-image" style="color:var(--text-muted)"></i>'}
                                </div>
                                <div style="flex: 1;">
                                    <input type="file" id="logo-input" accept="image/*" class="form-input" style="padding: 10px;">
                                    <button class="btn btn-secondary" style="margin-top: 8px;" onclick="uploadLogo()">Actualizar Logo</button>
                                </div>
                            </div>
                        </div>
                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label">Nombre</label>
                                <input type="text" class="form-input" value="${business.businessName}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Teléfono</label>
                                <input type="text" class="form-input" value="${business.phone || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dirección</label>
                            <input type="text" class="form-input" value="${business.address || ''}">
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <!-- Day Detail Popup -->
    <div class="day-detail-overlay" id="day-overlay" onclick="closeDayDetail()"></div>
    <div class="day-detail-popup" id="day-popup">
        <div class="day-detail-header">
            <h3 id="day-popup-title" style="font-size: 16px; font-weight: 700;"></h3>
            <button class="modal-close" onclick="closeDayDetail()"><i class="fas fa-times"></i></button>
        </div>
        <div class="day-detail-body" id="day-popup-body"></div>
    </div>

    <!-- Service Modal -->
    <div class="modal-overlay" id="service-modal">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title" id="modal-title">Nuevo Servicio</h3>
                <button class="modal-close" onclick="closeServiceModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="service-form" onsubmit="handleServiceSubmit(event)">
                    <input type="hidden" id="service-id">
                    <div class="form-group">
                        <label class="form-label">Nombre *</label>
                        <input type="text" class="form-input" id="service-name" required>
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Precio ($)</label>
                            <input type="number" class="form-input" id="service-price" value="0" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Duración (min)</label>
                            <input type="number" class="form-input" id="service-duration" value="30" min="5">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoría</label>
                        <select class="form-input" id="service-category">
                            <option value="general">General</option>
                            <option value="consulta">Consulta</option>
                            <option value="tratamiento">Tratamiento</option>
                            <option value="estetico">Estético</option>
                            <option value="urgencia">Urgencia</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeServiceModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="document.getElementById('service-form').requestSubmit()">Guardar</button>
            </div>
        </div>
    </div>

    <div class="calendar-tooltip" id="calendar-tooltip"></div>
    <div class="modal-overlay" id="location-modal">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Nuevo(a) ${locTermSingular}</h3>
                <button class="modal-close" onclick="closeLocationModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="location-form" onsubmit="handleLocationSubmit(event)">
                    <div class="form-group">
                        <label class="form-label">Nombre *</label>
                        <input type="text" class="form-input" id="loc-name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Dirección</label>
                        <input type="text" class="form-input" id="loc-address">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Teléfono</label>
                        <input type="text" class="form-input" id="loc-phone">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeLocationModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="document.getElementById('location-form').requestSubmit()">Guardar</button>
            </div>
        </div>
    </div>

    <script>
        const Q = String.fromCharCode(39);
        const businessId = "${business._id}";
        const baseUrl = window.location.pathname.replace(/\\/$/, '');
        let servicesData = ${JSON.stringify(business.services || [])};
        let appointmentsData = [];
        let calendarData = {};
        let currentDate = moment();

        document.addEventListener('DOMContentLoaded', () => {
            moment.locale('es');
            initNavigation();
            loadAppointments();
            renderServices();
            renderCalendar();
            initCharts();
        });

        function initNavigation() {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => navigateToSection(item.dataset.section));
            });
        }

        function navigateToSection(section) {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelector('[data-section="' + section + '"]')?.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(section + '-section')?.classList.add('active');
            const titles = { overview:'Dashboard', appointments:'Citas', calendar:'Calendario', services:'Servicios', clients:'Clientes', bot:'WhatsApp Bot', settings:'Configuración', locations:'Sucursales' };
            document.getElementById('page-title').textContent = titles[section] || 'Dashboard';
        }

        // ============================================
        // APPOINTMENTS - MEJORADO
        // ============================================
        async function loadAppointments() {
            try {
                const res = await fetch(baseUrl + '/data/appointments?month=' + (currentDate.month() + 1) + '&year=' + currentDate.year());
                if (res.ok) {
                    appointmentsData = await res.json();
                    processAppointments();
                    updateOverviewStats();
                    renderTodayAppointments();
                    renderAllAppointments();
                    renderCalendar();
                }
            } catch (err) {
                console.error('Error loading appointments:', err);
            }
        }

        function processAppointments() {
            calendarData = {};
            appointmentsData.forEach(apt => {
                const date = moment(apt.dateTime).format('YYYY-MM-DD');
                if (!calendarData[date]) calendarData[date] = [];
                calendarData[date].push(apt);
            });
        }

        function updateOverviewStats() {
            const today = moment().format('YYYY-MM-DD');
            const todayApts = appointmentsData.filter(a => moment(a.dateTime).format('YYYY-MM-DD') === today);
            const completedApts = appointmentsData.filter(a => a.status === 'completed');
            const revenue = appointmentsData.reduce((sum, a) => sum + (a.totalAmount || a.servicePrice || 0), 0);

            document.getElementById('stat-today').textContent = todayApts.length;
            document.getElementById('stat-month').textContent = appointmentsData.length;
            document.getElementById('stat-completed').textContent = completedApts.length;
            document.getElementById('stat-revenue').textContent = '$' + revenue.toLocaleString();
            
            // Pestaña lateral: mostrar total del mes para mayor control
            document.getElementById('today-badge').textContent = appointmentsData.length;
        }

        function renderTodayAppointments() {
            const container = document.getElementById('today-appointments');
            const today = moment().format('YYYY-MM-DD');
            const todayApts = appointmentsData.filter(a => moment(a.dateTime).format('YYYY-MM-DD') === today);

            if (todayApts.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-title">Sin citas para hoy</div><div class="empty-state-text">Las próximas citas aparecerán aquí</div></div>';
                return;
            }

            container.innerHTML = todayApts.sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime)).map(apt => renderAppointmentItem(apt)).join('');
        }

        function renderAllAppointments() {
            const container = document.getElementById('all-appointments');
            const filter = document.getElementById('apt-status-filter')?.value || 'all';

            let filtered = appointmentsData;
            if (filter !== 'all') filtered = appointmentsData.filter(a => a.status === filter);

            if (filtered.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">Sin citas</div><div class="empty-state-text">No hay citas para este filtro</div></div>';
                return;
            }

            container.innerHTML = filtered.sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime)).map(apt => renderAppointmentItem(apt)).join('');
        }

        function renderAppointmentItem(apt) {
            const status = apt.status || 'pending';
            const statusLabels = { pending:'Pendiente', confirmed:'Confirmada', completed:'Completada', cancelled:'Cancelada', rescheduled:'Reagendada' };
            const clientName = apt.clientName || 'Sin nombre';
            const serviceName = apt.service || apt.serviceName || 'Servicio';
            const phone = apt.clientPhone || '';
            const price = apt.totalAmount || apt.servicePrice || 0;
            const duration = apt.serviceDuration || 0;
            const source = apt.source || 'manual';
            const initials = clientName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

            return '<div class="appointment-item">' +
                '<div class="appointment-time-block">' +
                    '<div class="appointment-time-value">' + moment(apt.dateTime).format('HH:mm') + '</div>' +
                    '<div class="appointment-time-label">' + moment(apt.dateTime).format('DD MMM') + '</div>' +
                '</div>' +
                '<div class="appointment-divider"></div>' +
                '<div class="appointment-info">' +
                    '<div class="appointment-client">' +
                        '<div class="appointment-client-icon">' + initials + '</div>' +
                        '<span>' + clientName + '</span>' +
                    '</div>' +
                    '<div class="appointment-service-row">' +
                        '<span class="appointment-service"><i class="fas fa-tooth" style="margin-right:4px;font-size:11px;"></i>' + serviceName + '</span>' +
                        (duration > 0 ? '<span class="appointment-duration">' + duration + ' min</span>' : '') +
                        (price > 0 ? '<span class="appointment-price">$' + price.toLocaleString() + '</span>' : '') +
                    '</div>' +
                    (phone ? '<div class="appointment-phone"><i class="fab fa-whatsapp" style="margin-right:4px;color:#25d366;"></i>' + phone + '</div>' : '') +
                '</div>' +
                '<div class="appointment-right">' +
                    '<span class="appointment-status ' + status + '">' + statusLabels[status] + '</span>' +
                    '<select class="appointment-actions-select" onchange="updateAppointmentStatus(\\'' + apt._id + '\\', this.value)">' +
                        '<option value="pending"' + (status==='pending'?' selected':'') + '>Pendiente</option>' +
                        '<option value="confirmed"' + (status==='confirmed'?' selected':'') + '>Confirmada</option>' +
                        '<option value="completed"' + (status==='completed'?' selected':'') + '>Completada</option>' +
                        '<option value="cancelled"' + (status==='cancelled'?' selected':'') + '>Cancelada</option>' +
                        '<option value="rescheduled"' + (status==='rescheduled'?' selected':'') + '>Reagendada</option>' +
                    '</select>' +
                '</div>' +
            '</div>';
        }

        async function updateAppointmentStatus(id, newStatus) {
            try {
                const res = await fetch(baseUrl + '/data/appointments/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                const data = await res.json();
                if (data.success) {
                    const apt = appointmentsData.find(a => a._id === id);
                    if (apt) apt.status = newStatus;
                    renderTodayAppointments();
                    renderAllAppointments();
                } else {
                    throw new Error(data.error);
                }
            } catch (err) {
                alert('Error: ' + err.message);
                loadAppointments();
            }
        }

        document.getElementById('apt-status-filter')?.addEventListener('change', renderAllAppointments);

        // ============================================
        // CALENDAR - Con popup de detalle por día
        // ============================================
        function renderCalendar() {
            const grid = document.getElementById('calendar-grid');
            if (!grid) return;
            document.getElementById('calendar-month').textContent = currentDate.format('MMMM YYYY');

            const start = currentDate.clone().startOf('month').startOf('week');
            const end = currentDate.clone().endOf('month').endOf('week');
            const day = start.clone();

            let html = ['Dom','Lun','Mar','Mi\u00E9','Jue','Vie','S\u00E1b'].map(d => '<div class="calendar-day-header">' + d + '</div>').join('');

            while (day.isSameOrBefore(end)) {
                const dateStr = day.format('YYYY-MM-DD');
                const isCurrentMonth = day.month() === currentDate.month();
                const isToday = day.isSame(moment(), 'day');
                const hasApts = calendarData[dateStr]?.length > 0;
                const aptCount = calendarData[dateStr]?.length || 0;

                let classes = 'calendar-day';
                if (!isCurrentMonth) classes += ' other-month';
                if (isToday) classes += ' today';
                if (hasApts) classes += ' has-appointments';

                html += '<div class="' + classes + '" data-date="' + dateStr + '" ' +
                    'onclick="openDayDetail(' + Q + dateStr + Q + ')" ' +
                    'onmousemove="showTooltip(event, ' + Q + dateStr + Q + ')" ' +
                    'onmouseleave="hideTooltip()">' +
                    day.date() +
                    (hasApts ? '<span style="position:absolute;top:4px;right:4px;font-size:9px;background:' + (isToday ? '#000' : 'var(--accent)') + ';color:' + (isToday ? 'var(--accent)' : '#000') + ';width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;box-shadow:0 2px 4px rgba(0,0,0,0.2);">' + aptCount + '</span>' : '') +
                '</div>';
                day.add(1, 'day');
            }

            grid.innerHTML = html;
        }

        function showTooltip(e, date) {
            const apts = calendarData[date];
            if (!apts || apts.length === 0) return;

            const tooltip = document.getElementById('calendar-tooltip');
            let content = '<div style="font-weight:700;margin-bottom:8px;font-size:12px;color:var(--accent)">' + moment(date).format('DD [de] MMMM') + '</div>';
            
            apts.slice(0, 5).forEach(a => {
                content += '<div class="tooltip-item">' +
                        '<span class="tooltip-time">' + moment(a.dateTime).format('HH:mm') + '</span>' +
                        '<span class="tooltip-name">' + a.clientName.split(' ')[0] + '</span>' +
                    '</div>';
            });
            
            if (apts.length > 5) content += '<div style="font-size:10px;margin-top:4px;opacity:0.6">+ ' + (apts.length - 5) + ' más...</div>';

            tooltip.innerHTML = content;
            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY + 15) + 'px';
        }

        function hideTooltip() {
            document.getElementById('calendar-tooltip').style.display = 'none';
        }

        function changeMonth(delta) {
            currentDate.add(delta, 'months');
            loadAppointments();
        }

        function openDayDetail(dateStr) {
            const apts = calendarData[dateStr] || [];
            const popup = document.getElementById('day-popup');
            const overlay = document.getElementById('day-overlay');
            const title = document.getElementById('day-popup-title');
            const body = document.getElementById('day-popup-body');

            title.textContent = moment(dateStr).format('dddd D [de] MMMM, YYYY');

            if (apts.length === 0) {
                body.innerHTML = '<div class="empty-state" style="padding:30px;"><div class="empty-state-icon">📭</div><div class="empty-state-title">Sin citas este día</div></div>';
            } else {
                body.innerHTML = '<div class="appointments-list">' +
                    apts.sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime)).map(apt => renderAppointmentItem(apt)).join('') +
                '</div>';
            }

            popup.classList.add('show');
            overlay.classList.add('show');
        }

        function closeDayDetail() {
            document.getElementById('day-popup').classList.remove('show');
            document.getElementById('day-overlay').classList.remove('show');
        }

        // ============================================
        // SERVICES
        // ============================================
        function renderServices() {
            const container = document.getElementById('services-grid');
            const search = document.getElementById('service-search')?.value.toLowerCase() || '';
            const filtered = servicesData.filter(s => s.name.toLowerCase().includes(search));

            if (filtered.length === 0) {
                container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🛠️</div><div class="empty-state-title">Sin servicios</div><button class="btn btn-primary" onclick="showServiceModal()"><i class="fas fa-plus"></i> Agregar</button></div>';
                return;
            }

            container.innerHTML = filtered.map(s => {
                const isActive = s.active !== false;
                return '<div class="service-card">' +
                    '<div class="service-header">' +
                        '<div class="service-icon">' + (getCategoryIcon(s.category)) + '</div>' +
                        '<div class="service-price">$' + (s.price || 0).toLocaleString() + '</div>' +
                    '</div>' +
                    '<div class="service-name">' + s.name + '</div>' +
                    '<div class="service-duration"><i class="far fa-clock"></i> ' + (s.duration || 30) + ' min</div>' +
                    '<div class="service-footer">' +
                        '<div class="service-status ' + (isActive ? 'active' : 'inactive') + '"><span class="dot"></span>' + (isActive ? 'Activo' : 'Inactivo') + '</div>' +
                        '<div class="service-actions">' +
                            '<button class="service-btn" onclick="editService(\\'' + s._id + '\\')"><i class="fas fa-pen"></i></button>' +
                            '<button class="service-btn delete" onclick="deleteService(\\'' + s._id + '\\')"><i class="fas fa-trash"></i></button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        function getCategoryIcon(cat) {
            return { general:'📋', consulta:'🩺', tratamiento:'💉', estetico:'✨', urgencia:'🚨', dentist:'🦷' }[cat] || '📋';
        }

        function filterServices() { renderServices(); }

        function showServiceModal(id) {
            const modal = document.getElementById('service-modal');
            const title = document.getElementById('modal-title');
            if (id) {
                const s = servicesData.find(x => x._id === id);
                if (s) {
                    title.textContent = 'Editar Servicio';
                    document.getElementById('service-id').value = s._id;
                    document.getElementById('service-name').value = s.name;
                    document.getElementById('service-price').value = s.price || 0;
                    document.getElementById('service-duration').value = s.duration || 30;
                    document.getElementById('service-category').value = s.category || 'general';
                }
            } else {
                title.textContent = 'Nuevo Servicio';
                document.getElementById('service-form').reset();
                document.getElementById('service-id').value = '';
            }
            modal.classList.add('active');
        }

        function editService(id) { showServiceModal(id); }
        function closeServiceModal() { document.getElementById('service-modal').classList.remove('active'); }

        async function handleServiceSubmit(e) {
            e.preventDefault();
            const id = document.getElementById('service-id').value;
            const url = id ? baseUrl + '/data/services/' + id : baseUrl + '/data/services';
            const body = {
                name: document.getElementById('service-name').value,
                price: parseInt(document.getElementById('service-price').value) || 0,
                duration: parseInt(document.getElementById('service-duration').value) || 30,
                category: document.getElementById('service-category').value,
                active: true
            };
            try {
                const res = await fetch(url, { method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
                if (res.ok) { const data = await res.json(); servicesData = data.services; renderServices(); closeServiceModal(); initCharts(); }
            } catch (err) { alert('Error de conexión'); }
        }

        async function deleteService(id) {
            if (!confirm('¿Eliminar este servicio?')) return;
            try {
                const res = await fetch(baseUrl + '/data/services/' + id, { method: 'DELETE' });
                if (res.ok) { const data = await res.json(); servicesData = data.services; renderServices(); initCharts(); }
            } catch (err) { console.error(err); }
        }

        // ============================================
        // CHARTS
        // ============================================
        let revenueChart = null, servicesChart = null;

        function initCharts() { initRevenueChart(); initServicesChart(); }

        function initRevenueChart() {
            const ctx = document.getElementById('revenueChart');
            if (!ctx) return;
            if (revenueChart) revenueChart.destroy();
            const last7 = [];
            const labels = [];
            for (let i = 6; i >= 0; i--) {
                const date = moment().subtract(i, 'days');
                labels.push(date.format('ddd D'));
                const apts = appointmentsData.filter(a => moment(a.dateTime).format('YYYY-MM-DD') === date.format('YYYY-MM-DD'));
                last7.push(apts.reduce((sum, a) => sum + (a.totalAmount || a.servicePrice || 0), 0));
            }
            revenueChart = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets: [{ label: 'Ingresos', data: last7, backgroundColor: 'rgba(245, 158, 11, 0.8)', borderRadius: 8 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b8b9e' } }, x: { grid: { display: false }, ticks: { color: '#8b8b9e', font: { size: 11 } } } } }
            });
        }

        function initServicesChart() {
            const ctx = document.getElementById('servicesChart');
            if (!ctx) return;
            if (servicesChart) servicesChart.destroy();
            const cats = {};
            servicesData.forEach(s => { const c = s.category || 'general'; cats[c] = (cats[c] || 0) + 1; });
            servicesChart = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: Object.keys(cats), datasets: [{ data: Object.values(cats), backgroundColor: ['#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444'], borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#8b8b9e', padding: 16 } } } }
            });
        }

        async function activateBot() {
            if (!confirm('¿Activar el bot?')) return;
            try {
                const res = await fetch('/api/twilio/activate-bot', { method: 'POST', headers: {'Content-Type':'application/json'} });
                const data = await res.json();
                if (data.success) { alert('¡Bot activado!'); window.location.reload(); }
                else throw new Error(data.error);
            } catch (err) { alert('Error: ' + err.message); }
        }

        function uploadLogo() {
            const input = document.getElementById('logo-input');
            if (!input.files || !input.files.length) { alert('Selecciona una imagen.'); return; }
            const file = input.files[0];
            if (file.size > 2 * 1024 * 1024) { alert('Máximo 2MB.'); return; }
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const res = await fetch(baseUrl + '/data/logo', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ logoUrl: e.target.result }) });
                    if (res.ok) { alert('Logo actualizado'); window.location.reload(); }
                } catch(err) { alert('Error: ' + err.message); }
            };
            reader.readAsDataURL(file);
        }

        function openLocationModal() { document.getElementById('location-modal').classList.add('active'); }
        function closeLocationModal() { document.getElementById('location-modal').classList.remove('active'); document.getElementById('location-form').reset(); }
        async function handleLocationSubmit(e) {
            e.preventDefault();
            try {
                const res = await fetch(baseUrl + '/data/locations', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: document.getElementById('loc-name').value, address: document.getElementById('loc-address').value, phone: document.getElementById('loc-phone').value }) });
                if (res.ok) { alert('Guardado'); window.location.reload(); }
            } catch(err) { alert('Error: ' + err.message); }
        }
    </script>
</body>
</html>
        `);
    } catch (error) {
        console.error('Error en dashboard pro:', error);
        res.status(500).send('Error cargando dashboard');
    }
});

module.exports = router;