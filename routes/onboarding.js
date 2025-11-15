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

    // Validaciones básicas
    if (!businessType || !businessName || !whatsappBusiness || !contactEmail) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: businessType, businessName, whatsappBusiness, contactEmail' 
      });
    }

    // Crear negocio con servicios predefinidos
    const businessData = {
      businessType,
      businessName,
      legalName,
      rfc,
      managerName,
      whatsappBusiness,
      contactEmail,
      address,
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

    res.json({
      success: true,
      message: 'Cliente creado exitosamente',
      business: {
        id: business._id,
        businessName: business.businessName,
        businessType: business.businessType,
        plan: business.plan,
        whatsappUrl: `https://wa.me/${business.whatsappBusiness.replace('+', '')}`,
        dashboardUrl: `https://dental-bot-prod.onrender.com/dashboard/${business._id}`,
        setupUrl: `https://dental-bot-prod.onrender.com/api/setup/${business._id}`
      }
    });

  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/onboarding/clients - Listar todos los clientes
router.get('/clients', async (req, res) => {
  try {
    const clients = await Business.find({}, 'businessName businessType plan status whatsappBusiness contactEmail createdAt');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
