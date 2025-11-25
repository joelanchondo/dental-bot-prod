const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment'); 
const moment = require('moment-timezone'); 

// Middleware para parsear JSON
router.use(express.json());

// POST /api/save-appointment
// Endpoint para guardar una cita agendada desde el dashboard
router.post('/save-appointment', async (req, res) => {
    const { businessId, clientName, phone, service, dateTime } = req.body;

    if (!businessId || !clientName || !phone || !dateTime) {
        return res.status(400).json({ success: false, error: "Datos de cita incompletos." });
    }

    try {
        const requestedDateTime = new Date(dateTime); 
        const startHour = moment(requestedDateTime).startOf('hour').toDate();
        const endHour = moment(requestedDateTime).endOf('hour').toDate();
        
        // 1. Verificación de Disponibilidad (Doble check antes de guardar)
        const existingAppointment = await Appointment.findOne({
            businessId: businessId,
            dateTime: {
                $gte: startHour,
                $lt: endHour
            },
            status: { $ne: 'CANCELLED' }
        });

        if (existingAppointment) {
            return res.status(409).json({ success: false, error: "Esa hora ya está reservada. Por favor, selecciona otro slot." });
        }

        // 2. Guardar la nueva cita
        const newAppointment = new Appointment({
            businessId,
            clientName,
            phone,
            service,
            dateTime: requestedDateTime,
            status: 'CONFIRMED'
        });

        await newAppointment.save();
        
        // [PENDIENTE] Aquí se integraría la sincronización con Google Calendar
        // if (business.googleCalendarEnabled) {
        //     const appointmentSync = require('../services/appointmentSync');
        //     await appointmentSync.addToGoogleCalendar(newAppointment); 
        // }

        res.json({ 
            success: true, 
            message: "Cita agendada correctamente.", 
            appointmentId: newAppointment._id 
        });

    } catch (error) {
        console.error('Error al guardar la cita:', error);
        res.status(500).json({ success: false, error: "Error interno del servidor al procesar la cita." });
    }
});


// GET /api/available-slots
// Endpoint para consultar las horas ocupadas (requerido para la lógica dinámica)
router.get('/available-slots', async (req, res) => {
    const { businessId, date } = req.query;

    if (!businessId || !date) {
        return res.status(400).json({ success: false, error: "Business ID y fecha requeridos." });
    }

    try {
        const startOfDay = moment.tz(date, 'America/Mexico_City').startOf('day').toDate(); // Asumiendo zona horaria
        const endOfDay = moment.tz(date, 'America/Mexico_City').endOf('day').toDate();

        const occupiedSlots = await Appointment.find({
            businessId: businessId,
            dateTime: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: { $ne: 'CANCELLED' } // No contar las citas canceladas
        }).select('dateTime');

        // Retorna un array de timestamps de las horas ocupadas (ISO String)
        const occupiedTimes = occupiedSlots.map(app => 
            moment(app.dateTime).tz('America/Mexico_City').format('HH:mm')
        ); 

        res.json({ success: true, occupiedTimes });

    } catch (error) {
        console.error('Error al obtener slots:', error);
        res.status(500).json({ success: false, error: "Error al consultar disponibilidad." });
    }
});

module.exports = router;
