const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

// POST /onboarding - Procesar formulario de registro
router.post('/', async (req, res) => {
  try {
    console.log('🔍 [ONBOARDING] Body completo:', JSON.stringify(req.body, null, 2));

    // MAPEO DE CAMPOS (español → inglés)
    const businessData = {
      businessType: req.body['Tipo de negocio'],
      businessName: req.body['Nombre del negocio'],
      legalName: req.body['nombre legal'] || req.body['Nombre del negocio'],
      rfc: req.body.rfc || 'XAXX010101000',
      managerName: req.body['Nombre del gerente'] || req.body['Nombre del negocio'],
      whatsappBusiness: req.body.WhatsAppNegocio,
      contactEmail: req.body['ContactoCorreo electrónico'],
      plan: req.body.plan,
      salesAgent: req.body['Agente de ventas'] || 'joel anchondo'
    };

    // Manejar address
    if (req.body.DIRECCIÓN && typeof req.body.DIRECCIÓN === 'object') {
      businessData.address = [
        req.body.DIRECCIÓN.calle,
        req.body.DIRECCIÓN.ciudad, 
        req.body.DIRECCIÓN.estado,
        req.body.DIRECCIÓN['Código postal']
      ].filter(Boolean).join(', ');
    } else {
      businessData.address = 'Dirección por definir';
    }

    console.log('🔍 [ONBOARDING DEBUG] Datos mapeados:', businessData);

    // VALIDACIONES BÁSICAS
    const errors = [];
    if (!businessData.businessType) errors.push('Tipo de negocio es requerido');
    if (!businessData.businessName) errors.push('Nombre comercial es requerido');
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

    // CONFIGURACIÓN POR PLAN
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
      dashboardUrl: `/dashboard/${business._id}`
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

// GET /onboarding - Mostrar formulario COMPLETO
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Onboarding - Dental Bot</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen py-8">
    <div class="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800">🦷 Registro Dental Bot</h1>
            <p class="text-gray-600">Completa el formulario para activar tu bot</p>
        </div>

        <form method="POST" action="/onboarding" class="space-y-6">
            <!-- Campos principales -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Tipo de negocio *</label>
                    <select name="Tipo de negocio" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                        <option value="dental">Dental</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Plan *</label>
                    <select name="plan" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                        <option value="pro">Pro</option>
                        <option value="premium">Premium</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Nombre del negocio *</label>
                <input type="text" name="Nombre del negocio" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Ej: Sonrisa Perfecta">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Nombre del gerente *</label>
                <input type="text" name="Nombre del gerente" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Ej: María González">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">WhatsApp Business *</label>
                    <input type="text" name="WhatsAppNegocio" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="+526141234567">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Correo electrónico *</label>
                    <input type="email" name="ContactoCorreo electrónico" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="contacto@ejemplo.com">
                </div>
            </div>

            <!-- Campos ocultos con valores por defecto -->
            <input type="hidden" name="nombre legal" value="Por definir">
            <input type="hidden" name="rfc" value="XAXX010101000">
            <input type="hidden" name="Agente de ventas" value="joel anchondo">
            <input type="hidden" name="DIRECCIÓN[calle]" value="Por definir">
            <input type="hidden" name="DIRECCIÓN[ciudad]" value="Por definir">
            <input type="hidden" name="DIRECCIÓN[estado]" value="Por definir">
            <input type="hidden" name="DIRECCIÓN[Código postal]" value="00000">

            <div class="flex justify-center">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg">
                    🚀 Activar Mi Bot
                </button>
            </div>
        </form>
    </div>
</body>
</html>
  `);
});

module.exports = router;
