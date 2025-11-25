const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

// SERVICIOS PREDEFINIDOS POR TIPO DE NEGOCIO
const PREDEFINED_SERVICES = {
  dental: [
    { name: "Limpieza dental", duration: 45, price: 500 },
    { name: "Extracción", duration: 30, price: 800 },
    { name: "Blanqueamiento", duration: 60, price: 1500 },
    { name: "Ortodoncia consulta", duration: 30, price: 300 }
  ],
  medical: [
    { name: "Consulta general", duration: 30, price: 400 },
    { name: "Chequeo anual", duration: 60, price: 800 },
    { name: "Vacunación", duration: 15, price: 200 }
  ],
  automotive: [
    { name: "Cambio de aceite", duration: 45, price: 300 },
    { name: "Alineación", duration: 60, price: 600 },
    { name: "Reparación frenos", duration: 120, price: 1200 }
  ],
  barbershop: [
    { name: "Corte de cabello", duration: 30, price: 150 },
    { name: "Afeitado", duration: 20, price: 100 },
    { name: "Corte y barba", duration: 45, price: 200 }
  ]
};

// GET /api/onboarding/templates - Plantillas disponibles
router.get('/templates', (req, res) => {
  res.json({
    businessTypes: Object.keys(PREDEFINED_SERVICES),
    services: PREDEFINED_SERVICES
  });
});

// POST /api/onboarding/create - Crear nuevo cliente
router.post('/create', async (req, res) => {
  try {
    const {
      businessType,
      businessName,
      legalName,
      rfc,
      managerName,
      whatsappBusiness,
      contactEmail,
      address,
      plan,
      salesAgent
    } = req.body;

    console.log('🔍 [ONBOARDING DEBUG] Datos recibidos:', {
      businessType, businessName, legalName, rfc,
      managerName, whatsappBusiness, contactEmail,
      address, plan, salesAgent
    });

    // VALIDACIONES MEJORADAS
    const errors = [];

    if (!businessType) errors.push('Tipo de negocio es requerido');
    if (!businessName) errors.push('Nombre comercial es requerido');
    if (!managerName) errors.push('Nombre del encargado es requerido');
    if (!whatsappBusiness) errors.push('WhatsApp Business es requerido');
    if (!contactEmail) errors.push('Correo electrónico es requerido');
    if (!salesAgent) errors.push('Agente de ventas es requerido');

    // Validar formato WhatsApp
    if (whatsappBusiness && !whatsappBusiness.match(/^\+?[1-9]\d{1,14}$/)) {
      errors.push('Formato de WhatsApp inválido. Ejemplo: +5215512345678');
    }

    // Validar formato email
    if (contactEmail && !contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push('Formato de email inválido');
    }

    // Validar RFC si se proporciona
    if (rfc && !rfc.match(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/)) {
      errors.push('Formato de RFC inválido');
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Errores de validación',
        details: errors 
      });
    }

    // VERIFICAR DUPLICADOS
    const existingBusiness = await Business.findOne({
      $or: [
        { whatsappBusiness: whatsappBusiness },
        { contactEmail: contactEmail },
        { businessName: businessName }
      ]
    });

    if (existingBusiness) {
      let duplicateField = '';
      if (existingBusiness.whatsappBusiness === whatsappBusiness) duplicateField = 'WhatsApp';
      else if (existingBusiness.contactEmail === contactEmail) duplicateField = 'email';
      else if (existingBusiness.businessName === businessName) duplicateField = 'nombre comercial';

      return res.status(400).json({ 
        error: \`Cliente duplicado\`,
        details: [\`Ya existe un negocio con este \${duplicateField}: \${duplicateField === 'WhatsApp' ? whatsappBusiness : duplicateField === 'email' ? contactEmail : businessName}\`],
        duplicateId: existingBusiness._id
      });
    }

    // Crear negocio con servicios predefinidos
    const businessData = {
      businessType,
      businessName,
      legalName: legalName || businessName, // Si no hay razón social, usar nombre comercial
      rfc: rfc || '',
      managerName,
      whatsappBusiness,
      contactEmail,
      address: address || {},
      plan: plan || 'demo',
      salesAgent,
      services: PREDEFINED_SERVICES[businessType] || [],
      businessHours: {
        monday: { open: "09:00", close: "18:00", active: true },
        tuesday: { open: "09:00", close: "18:00", active: true },
        wednesday: { open: "09:00", close: "18:00", active: true },
        thursday: { open: "09:00", close: "18:00", active: true },
        friday: { open: "09:00", close: "18:00", active: true },
        saturday: { open: "09:00", close: "14:00", active: true },
        sunday: { open: "09:00", close: "14:00", active: false }
      },
      onboardingCompleted: true,
      // Campos de compatibilidad
      name: businessName,
      phone: whatsappBusiness
    };

    // Si es demo, agregar fecha de expiración (30 días)
    if ((plan || 'demo') === 'demo') {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      businessData.demoExpiresAt = expires;
    }

    const business = new Business(businessData);
    await business.save();

    console.log('✅ [ONBOARDING] Cliente creado exitosamente:', business._id);

    res.json({
      success: true,
      message: 'Cliente creado exitosamente',
      business: {
        id: business._id,
        businessName: business.businessName,
        businessType: business.businessType,
        plan: business.plan,
        whatsappUrl: \`https://wa.me/\${business.whatsappBusiness.replace('+', '')}\`,
        dashboardUrl: \`https://dental-bot-prod.onrender.com/dashboard/\${business._id}\`,
        setupUrl: \`https://dental-bot-prod.onrender.com/api/setup/\${business._id}\`,
        adminUrl: \`https://dental-bot-prod.onrender.com/admin\`
      }
    });

  } catch (error) {
    console.error('❌ [ONBOARDING ERROR]:', error);
    
    // Manejar errores de MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: 'Error de duplicado',
        details: [\`Ya existe un negocio con este \${field}\`]
      });
    }

    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: [error.message] 
    });
  }
});

// GET /api/onboarding/clients - Listar todos los clientes
router.get('/clients', async (req, res) => {
  try {
    const clients = await Business.find({}, 'businessName businessType plan status whatsappBusiness contactEmail salesAgent createdAt')
      .sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
