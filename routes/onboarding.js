const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

// POST /onboarding - Procesar formulario de registro
router.post('/', async (req, res) => {
  try {
    console.log('🔍 [ONBOARDING] Body completo:', JSON.stringify(req.body, null, 2));

    // MAPEO DE CAMPOS (español → inglés) con manejo de address como objeto
    const businessData = {
      businessType: req.body['Tipo de negocio'],
      businessName: req.body['Nombre del negocio'],
      legalName: req.body['nombre legal'],
      rfc: req.body.rfc,
      managerName: req.body['Nombre del gerente'],
      whatsappBusiness: req.body.WhatsAppNegocio,
      contactEmail: req.body['ContactoCorreo electrónico'],
      plan: req.body.plan,
      salesAgent: req.body['Agente de ventas']
    };

    // Manejar address que viene como objeto
    if (req.body.DIRECCIÓN && typeof req.body.DIRECCIÓN === 'object') {
      businessData.address = [
        req.body.DIRECCIÓN.calle,
        req.body.DIRECCIÓN.ciudad, 
        req.body.DIRECCIÓN.estado,
        req.body.DIRECCIÓN['Código postal']
      ].filter(Boolean).join(', ');
    } else {
      businessData.address = 'Dirección no proporcionada';
    }

    console.log('🔍 [ONBOARDING DEBUG] Datos mapeados:', businessData);

    // VALIDACIONES BÁSICAS
    const errors = [];
    if (!businessData.businessType) errors.push('Tipo de negocio es requerido');
    if (!businessData.businessName) errors.push('Nombre comercial es requerido');
    if (!businessData.managerName) errors.push('Nombre del encargado es requerido');
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

    // CONFIGURACIÓN POR PLAN (simplificada)
    const planConfig = {
      basico: {
        features: { whatsappBot: true, basicAppointments: true },
        services: ['Consulta dental', 'Limpieza dental'],
        schedule: { weekdays: '9:00-18:00', saturday: '9:00-14:00', sunday: 'Cerrado' }
      },
      pro: {
        features: { whatsappBot: true, basicAppointments: true, calendarAccess: true },
        services: ['Consulta', 'Limpieza', 'Extracción', 'Resina'],
        schedule: { weekdays: '8:00-19:00', saturday: '9:00-15:00', sunday: '10:00-13:00' }
      },
      premium: {
        features: { whatsappBot: true, basicAppointments: true, calendarAccess: true, customBranding: true },
        services: ['Consulta', 'Limpieza', 'Extracción', 'Resina', 'Corona', 'Implante'],
        schedule: { weekdays: '8:00-20:00', saturday: '9:00-16:00', sunday: '10:00-14:00' }
      }
    };

    const config = planConfig[businessData.plan] || planConfig.basico;

    // CREAR NEGOCIO (solo campos esenciales)
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
      message: '¡Registro exitoso!',
      businessId: business._id,
      dashboardUrl: `/dashboard/${business._id}`
    });

  } catch (error) {
    console.error('❌ [ONBOARDING] Error completo:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
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

// GET /onboarding - Mostrar formulario
router.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Onboarding - Dental Bot</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .form-group { margin: 15px 0; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>📋 Onboarding - Registrar Negocio</h1>
        <form method="POST" action="/onboarding">
            <div class="form-group">
                <label>Tipo de negocio:</label>
                <select name="Tipo de negocio" required>
                    <option value="dental">Dental</option>
                    <option value="medical">Médico</option>
                    <option value="beauty">Belleza</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Nombre del negocio:</label>
                <input type="text" name="Nombre del negocio" required>
            </div>
            
            <div class="form-group">
                <label>WhatsApp Negocio:</label>
                <input type="text" name="WhatsAppNegocio" placeholder="+521234567890" required>
            </div>
            
            <div class="form-group">
                <label>Correo electrónico:</label>
                <input type="email" name="ContactoCorreo electrónico" required>
            </div>
            
            <div class="form-group">
                <label>Plan:</label>
                <select name="plan" required>
                    <option value="basico">Básico</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                </select>
            </div>
            
            <button type="submit">Registrar Negocio</button>
        </form>
    </body>
    </html>
  `);
});
