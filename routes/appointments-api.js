const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');

// POST /api/appointments - Crear nueva cita desde el calendario
router.post('/', async (req, res) => {
  try {
    const { businessId, clientName, clientPhone, service, dateTime, status, source } = req.body;
    
    // Asegurar formato correcto del número
    // Asegurar formato correcto del número
    let formattedPhone = clientPhone.trim(); // Eliminar espacios
    if (!formattedPhone.startsWith("whatsapp:")) {
      formattedPhone = "whatsapp:" + formattedPhone;
    }
    // Asegurar que tenga + y formato correcto
    formattedPhone = formattedPhone.replace("whatsapp:", "whatsapp:+").replace(/[^0-9+]/g, "");
    formattedPhone = formattedPhone.replace("whatsapp:++", "whatsapp:+"); // Evitar ++
    console.log('📱 Teléfono formateado:', formattedPhone);
    }

    console.log('📅 Creando cita:', { businessId, clientName, clientPhone, service, dateTime });

    // Validar datos requeridos
    if (!businessId || !clientName || !clientPhone || !service || !dateTime) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: businessId, clientName, clientPhone, service, dateTime'
      });
    }

    // Verificar que el negocio existe
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado'
      });
    }

    // Crear la cita
    const appointment = new Appointment({
      businessId: businessId,
      clientName: clientName,
      clientPhone: clientPhone,
      service: service,
      dateTime: new Date(dateTime),
      status: status || 'confirmed',
      source: source || "web"
    });

    await appointment.save();

  // Enviar confirmación por WhatsApp
  try {
    const twilioService = require("../services/twilioService");
    await twilioService.sendAppointmentConfirmation(appointment);
    console.log("✅ Confirmación WhatsApp enviada para cita:", appointment._id);
  } catch (error) {
    console.error("❌ Error enviando WhatsApp:", error.message);
  }

    console.log('✅ Cita creada exitosamente:', appointment._id);

    res.json({
      success: true,
      appointment: {
        id: appointment._id,
        businessId: appointment.businessId,
        clientName: appointment.clientName,
        service: appointment.service,
        dateTime: appointment.dateTime,
        status: appointment.status
      }
    });

  } catch (error) {
    console.error('❌ Error creando cita:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
