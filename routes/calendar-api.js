// routes/calendar-api.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const moment = require('moment');

// 📅 Obtener detalles completos de una cita
router.get('/appointment/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('businessId', 'businessName services');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    res.json({
      success: true,
      appointment: {
        id: appointment._id,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        clientEmail: appointment.clientEmail,
        service: appointment.service,
        dateTime: appointment.dateTime,
        duration: appointment.duration,
        status: appointment.status,
        notes: appointment.notes,
        internalNotes: appointment.internalNotes,
        payment: appointment.payment,
        history: appointment.history,
        createdAt: appointment.createdAt,
        confirmedAt: appointment.confirmedAt,
        source: appointment.source
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✏️ Actualizar estado de cita
router.patch('/appointment/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    const oldStatus = appointment.status;
    
    // Actualizar según el nuevo estado
    switch(status) {
      case 'confirmed':
        await appointment.confirm();
        break;
      case 'completed':
        await appointment.complete();
        break;
      case 'cancelled':
        await appointment.cancel(notes || 'Cancelada desde dashboard', 'business');
        break;
      case 'no-show':
        appointment.status = 'no-show';
        appointment.history.push({
          action: 'no_show',
          performedBy: 'business',
          note: 'El paciente no asistió'
        });
        await appointment.save();
        break;
      default:
        appointment.status = status;
        await appointment.save();
    }
    
    res.json({
      success: true,
      message: `Estado actualizado de ${oldStatus} a ${status}`,
      appointment: {
        id: appointment._id,
        status: appointment.status,
        history: appointment.history
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📝 Agregar nota interna a una cita
router.patch('/appointment/:id/notes', async (req, res) => {
  try {
    const { internalNotes } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    appointment.internalNotes = internalNotes;
    appointment.history.push({
      action: 'note_added',
      performedBy: 'business',
      note: 'Se agregó nota interna'
    });
    
    await appointment.save();
    
    res.json({
      success: true,
      message: 'Nota guardada',
      internalNotes: appointment.internalNotes
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🆕 Crear nueva cita (urgencia)
router.post('/appointment/new', async (req, res) => {
  try {
    const {
      businessId,
      clientName,
      clientPhone,
      clientEmail,
      service,
      dateTime,
      duration,
      notes
    } = req.body;
    
    // Validar que el negocio existe
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }
    
    // Crear la cita
    const appointment = await Appointment.create({
      businessId,
      clientName,
      clientPhone,
      clientEmail,
      service,
      dateTime,
      duration: duration || 30,
      notes,
      status: 'confirmed', // Las urgencias se confirman directamente
      source: 'admin',
      history: [{
        action: 'created',
        performedBy: 'business',
        note: 'Cita creada como urgencia desde dashboard'
      }]
    });
    
    res.json({
      success: true,
      message: 'Cita creada exitosamente',
      appointment: {
        id: appointment._id,
        clientName: appointment.clientName,
        service: appointment.service,
        dateTime: appointment.dateTime,
        status: appointment.status
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔍 Buscar paciente por nombre o teléfono
router.get('/search-patient', async (req, res) => {
  try {
    const { businessId, query } = req.query;
    
    if (!query || query.length < 3) {
      return res.json({ results: [] });
    }
    
    // Buscar todas las citas del paciente
    const appointments = await Appointment.find({
      businessId: businessId,
      $or: [
        { clientName: { $regex: query, $options: 'i' } },
        { clientPhone: { $regex: query, $options: 'i' } }
      ]
    }).sort({ dateTime: -1 }).limit(20);
    
    // Agrupar por paciente
    const patientsMap = {};
    appointments.forEach(apt => {
      const key = apt.clientPhone;
      if (!patientsMap[key]) {
        patientsMap[key] = {
          name: apt.clientName,
          phone: apt.clientPhone,
          email: apt.clientEmail,
          appointments: [],
          totalAppointments: 0,
          lastVisit: null,
          completedAppointments: 0
        };
      }
      patientsMap[key].appointments.push({
        id: apt._id,
        service: apt.service,
        dateTime: apt.dateTime,
        status: apt.status
      });
      patientsMap[key].totalAppointments++;
      if (apt.status === 'completed') {
        patientsMap[key].completedAppointments++;
      }
      if (!patientsMap[key].lastVisit || apt.dateTime > patientsMap[key].lastVisit) {
        patientsMap[key].lastVisit = apt.dateTime;
      }
    });
    
    const patients = Object.values(patientsMap);
    
    res.json({
      success: true,
      results: patients
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📊 Obtener horarios disponibles para un día
router.get('/available-slots', async (req, res) => {
  try {
    const { businessId, date, duration } = req.query;
    
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }
    
    const selectedDate = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][selectedDate.getDay()];
    const businessHours = business.businessHours[dayOfWeek];
    
    if (!businessHours || !businessHours.active) {
      return res.json({
        success: true,
        availableSlots: [],
        message: `El negocio no atiende los ${dayOfWeek}`
      });
    }
    
    // Obtener citas existentes del día
    const startOfDay = moment(selectedDate).startOf('day').toDate();
    const endOfDay = moment(selectedDate).endOf('day').toDate();
    
    const existingAppointments = await Appointment.find({
      businessId: businessId,
      dateTime: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $nin: ['cancelled', 'no-show'] }
    });
    
    // Generar slots disponibles
    const [openHour, openMin] = businessHours.open.split(':').map(Number);
    const [closeHour, closeMin] = businessHours.close.split(':').map(Number);
    const slotDuration = parseInt(duration) || 30;
    
    const slots = [];
    let currentTime = moment(selectedDate).set({ hour: openHour, minute: openMin });
    const closeTime = moment(selectedDate).set({ hour: closeHour, minute: closeMin });
    
    while (currentTime.isBefore(closeTime)) {
      const slotTime = currentTime.toDate();
      const slotEnd = moment(currentTime).add(slotDuration, 'minutes').toDate();
      
      // Verificar si el slot está ocupado
      const isOccupied = existingAppointments.some(apt => {
        const aptStart = moment(apt.dateTime);
        const aptEnd = moment(apt.dateTime).add(apt.duration, 'minutes');
        const slotStart = moment(slotTime);
        
        return slotStart.isBetween(aptStart, aptEnd, null, '[)') ||
               aptStart.isBetween(slotStart, slotEnd, null, '[)');
      });
      
      slots.push({
        time: currentTime.format('HH:mm'),
        available: !isOccupied,
        dateTime: slotTime.toISOString()
      });
      
      currentTime.add(slotDuration, 'minutes');
    }
    
    res.json({
      success: true,
      date: date,
      businessHours: businessHours,
      availableSlots: slots.filter(s => s.available),
      allSlots: slots
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔄 Reprogramar cita
router.post('/appointment/:id/reschedule', async (req, res) => {
  try {
    const { newDateTime, reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    const oldDateTime = appointment.dateTime;
    appointment.dateTime = new Date(newDateTime);
    appointment.status = 'confirmed';
    appointment.history.push({
      action: 'rescheduled',
      performedBy: 'business',
      note: `Reprogramada de ${moment(oldDateTime).format('DD/MM/YYYY HH:mm')} a ${moment(newDateTime).format('DD/MM/YYYY HH:mm')}. Razón: ${reason || 'No especificada'}`
    });
    
    await appointment.save();
    
    res.json({
      success: true,
      message: 'Cita reprogramada exitosamente',
      appointment: {
        id: appointment._id,
        dateTime: appointment.dateTime,
        status: appointment.status
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📱 Enviar recordatorio manual
router.post('/appointment/:id/send-reminder', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('businessId');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    // TODO: Integrar con servicio de WhatsApp/SMS
    const message = `Hola ${appointment.clientName}! 👋

Este es un recordatorio de tu cita en ${appointment.businessId.businessName}

📅 Fecha: ${moment(appointment.dateTime).format('DD/MM/YYYY')}
⏰ Hora: ${moment(appointment.dateTime).format('HH:mm')}
💼 Servicio: ${appointment.service}

¿Confirmas tu asistencia?`;
    
    appointment.history.push({
      action: 'reminder_sent',
      performedBy: 'business',
      note: 'Recordatorio manual enviado'
    });
    
    await appointment.save();
    
    res.json({
      success: true,
      message: 'Recordatorio enviado',
      preview: message
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
