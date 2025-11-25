const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

// POST /onboarding - Procesar formulario de registro
router.post('/', async (req, res) => {
  try {
    console.log('🔍 [ONBOARDING] Body completo:', req.body);

    // MAPEO DE CAMPOS (español → inglés)
    const businessData = {
      businessType: req.body['Tipo de negocio'],
      businessName: req.body['Nombre del negocio'],
      legalName: req.body['nombre legal'],
      rfc: req.body.rfc,
      managerName: req.body['Nombre del gerente'],
      whatsappBusiness: req.body.WhatsAppNegocio,
      contactEmail: req.body['ContactoCorreo electrónico'],
      address: req.body.DIRECCIÓN,
      plan: req.body.plan,
      salesAgent: req.body['Agente de ventas']
    };

    console.log('🔍 [ONBOARDING DEBUG] Datos mapeados:', businessData);

    // VALIDACIONES
    const errors = [];

    if (!businessData.businessType) errors.push('Tipo de negocio es requerido');
    if (!businessData.businessName) errors.push('Nombre comercial es requerido');
    if (!businessData.managerName) errors.push('Nombre del encargado es requerido');
    if (!businessData.whatsappBusiness) errors.push('WhatsApp Business es requerido');
    if (!businessData.contactEmail) errors.push('Correo electrónico es requerido');
    if (!businessData.salesAgent) errors.push('Agente de ventas es requerido');

    // Validar formato WhatsApp
    if (businessData.whatsappBusiness && !businessData.whatsappBusiness.match(/^\+?[1-9]\d{1,14}$/)) {
      errors.push('Formato de WhatsApp inválido. Ejemplo: +5215512345678');
    }

    // Validar email
    if (businessData.contactEmail && !businessData.contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push('Formato de correo electrónico inválido');
    }

    if (errors.length > 0) {
      console.log('❌ [ONBOARDING] Errores de validación:', errors);
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors
      });
    }

    // CONFIGURACIÓN POR PLAN
    const planConfig = {
      basico: {
        features: {
          whatsappBot: true,
          basicAppointments: true,
          calendarAccess: false,
          advancedReports: false,
          customBranding: false
        },
        services: ['Consulta dental', 'Limpieza dental', 'Extracción simple'],
        schedule: {
          weekdays: '9:00 AM - 6:00 PM',
          saturday: '9:00 AM - 2:00 PM',
          sunday: 'Cerrado'
        }
      },
      pro: {
        features: {
          whatsappBot: true,
          basicAppointments: true,
          calendarAccess: true,
          advancedReports: true,
          customBranding: false
        },
        services: [
          'Consulta dental', 'Limpieza dental', 'Extracción simple',
          'Resina dental', 'Corona dental', 'Endodoncia'
        ],
        schedule: {
          weekdays: '8:00 AM - 7:00 PM',
          saturday: '9:00 AM - 3:00 PM',
          sunday: '10:00 AM - 1:00 PM'
        }
      },
      premium: {
        features: {
          whatsappBot: true,
          basicAppointments: true,
          calendarAccess: true,
          advancedReports: true,
          customBranding: true,
          multiUser: true
        },
        services: [
          'Consulta dental', 'Limpieza dental', 'Extracción simple',
          'Resina dental', 'Corona dental', 'Endodoncia',
          'Implante dental', 'Ortodoncia', 'Blanqueamiento'
        ],
        schedule: {
          weekdays: '8:00 AM - 8:00 PM',
          saturday: '9:00 AM - 4:00 PM',
          sunday: '10:00 AM - 2:00 PM'
        }
      }
    };

    const config = planConfig[businessData.plan] || planConfig.basico;

    // CREAR NEGOCIO
    const business = new Business({
      ...businessData,
      status: 'active',
      features: config.features,
      services: config.services,
      schedule: config.schedule,
      setupCompleted: true,
      subscription: {
        plan: businessData.plan,
        status: 'active',
        startDate: new Date(),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      }
    });

    await business.save();

    console.log('✅ [ONBOARDING] Negocio creado exitosamente:', business._id);

    res.json({
      success: true,
      message: '¡Registro exitoso! Tu bot está siendo configurado.',
      businessId: business._id,
      nextSteps: [
        'Configurar WhatsApp Business',
        'Personalizar mensajes de bienvenida',
        'Probar el flujo de citas'
      ]
    });

  } catch (error) {
    console.error('❌ [ONBOARDING] Error:', error);

    // Manejar errores de MongoDB
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Errores de validación en los datos',
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El negocio ya está registrado',
        errors: ['Ya existe un negocio con ese nombre o WhatsApp']
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
