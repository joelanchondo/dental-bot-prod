const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

// POST /onboarding - Procesar formulario de registro
router.post('/', async (req, res) => {
  try {
    console.log('🔍 [ONBOARDING] Body completo:', JSON.stringify(req.body, null, 2));

    // MAPEO DE CAMPOS - ACEPTA INGLÉS Y ESPAÑOL
    const businessData = {
      // Campos en español (formulario simple)
      businessType: req.body['Tipo de negocio'] || req.body.businessType,
      businessName: req.body['Nombre del negocio'] || req.body.businessName,
      legalName: req.body['nombre legal'] || req.body.legalName,
      rfc: req.body.rfc || 'XAXX010101000',
      managerName: req.body['Nombre del gerente'] || req.body.managerName,
      whatsappBusiness: req.body.WhatsAppNegocio || req.body.whatsappBusiness,
      contactEmail: req.body['ContactoCorreo electrónico'] || req.body.contactEmail,
      plan: req.body.plan,
      salesAgent: req.body['Agente de ventas'] || req.body.salesAgent || 'joel anchondo'
    };

    console.log('🔍 [ONBOARDING DEBUG] Campos mapeados:', businessData);

    // Manejar address - ambos formatos
    if (req.body.DIRECCIÓN && typeof req.body.DIRECCIÓN === 'object') {
      // Formato español
      businessData.address = [
        req.body.DIRECCIÓN.calle,
        req.body.DIRECCIÓN.ciudad, 
        req.body.DIRECCIÓN.estado,
        req.body.DIRECCIÓN['Código postal']
      ].filter(Boolean).join(', ');
    } else if (req.body.address && typeof req.body.address === 'object') {
      // Formato inglés
      businessData.address = [
        req.body.address.street,
        req.body.address.city,
        req.body.address.state, 
        req.body.address.postalCode
      ].filter(Boolean).join(', ');
    } else {
      businessData.address = 'Dirección por definir';
    }

    console.log('🔍 [ONBOARDING DEBUG] Datos finales:', businessData);

    // VALIDACIONES BÁSICAS
    const errors = [];
    if (!businessData.businessType) errors.push('Tipo de negocio es requerido');
    if (!businessData.businessName) errors.push('Nombre comercial es requerido');
    if (!businessData.managerName) errors.push('Nombre del gerente es requerido');
    if (!businessData.whatsappBusiness) errors.push('WhatsApp Business es requerido');
    if (!businessData.contactEmail) errors.push('Correo electrónico es requerido');

    if (errors.length > 0) {
      console.log('❌ [ONBOARDING] Errores de validación:', errors);
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors
      });
    }

    // CONFIGURACIÓN POR PLAN - SERVICIOS COMO OBJETOS
    const planConfig = {
      basico: {
        features: { whatsappBot: true, basicAppointments: true },
        services: [{name: 'Consulta dental', price: 0, duration: 30}, {name: 'Limpieza dental', price: 0, duration: 30}],
        schedule: { weekdays: '9:00-18:00', saturday: '9:00-14:00', sunday: 'Cerrado' }
      },
      pro: {
        features: { whatsappBot: true, basicAppointments: true, calendarAccess: true },
        services: [{name: 'Consulta', price: 0, duration: 30}, {name: 'Limpieza', price: 0, duration: 45}, {name: 'Extracción', price: 0, duration: 30}, {name: 'Resina', price: 0, duration: 60}],
        schedule: { weekdays: '8:00-19:00', saturday: '9:00-15:00', sunday: '10:00-13:00' }
      },
      premium: {
        features: { whatsappBot: true, basicAppointments: true, calendarAccess: true, customBranding: true },
        services: [{name: 'Consulta', price: 0, duration: 30}, {name: 'Limpieza', price: 0, duration: 45}, {name: 'Extracción', price: 0, duration: 30}, {name: 'Resina', price: 0, duration: 60}, {name: 'Corona', price: 0, duration: 90}, {name: 'Implante', price: 0, duration: 120}],
        schedule: { weekdays: '8:00-20:00', saturday: '9:00-16:00', sunday: '10:00-14:00' }
      }
    };

    const config = planConfig[businessData.plan] || planConfig.basico;

    // CREAR NEGOCIO
    const business = new Business({
      businessType: businessData.businessType,
      businessName: businessData.businessName,
      legalName: businessData.legalName,
      rfc: businessData.rfc,
      managerName: businessData.managerName,
      whatsappBusiness: businessData.whatsappBusiness,
      contactEmail: businessData.contactEmail,
      address: businessData.address,
      plan: businessData.plan,
      salesAgent: businessData.salesAgent,
      status: 'active',
      features: config.features,
      services: config.services,
      schedule: config.schedule
    });

    await business.save();
    console.log('✅ [ONBOARDING] Negocio creado:', business._id);

    res.json({
      success: true,
      message: '¡Registro exitoso! Tu bot está siendo configurado.',
      businessId: business._id,
      dashboardUrl: `/dashboard/${business._id}`,
      whatsappUrl: `https://wa.me/${businessData.whatsappBusiness.replace('+', '')}`
    });

  } catch (error) {
    console.error('❌ [ONBOARDING] Error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Errores de validación en los datos',
        errors: validationErrors
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
