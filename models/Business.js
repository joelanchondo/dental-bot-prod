const mongoose = require('mongoose');
const serviceCatalogs = require('../config/service-catalogs');

const businessSchema = new mongoose.Schema({
  // DATOS BÁSICOS DEL NEGOCIO
  // 🎯 SAAS CLIENT DATA
  adminEmail: { type: String, unique: false }, // Email del dueño (login)
  passwordHash: String, // Password para dashboard

  businessType: {

    type: String,
    enum: ['medical', 'dental', 'spa', 'nails', 'barbershop', 'automotive', 'food', 'other'],
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  legalName: String,
  rfc: String,
  managerName: String,

  // CONTACTO Y UBICACIÓN
  whatsappBusiness: {
    type: String,
    required: true
  },
  // 🎯 TWILIO MULTI-TENANT CONFIG
  twilioConfig: {
    accountSid: String,      // Subaccount SID
    authToken: String,       // Subaccount Auth Token
    phoneNumberSid: String,  // SID del número comprado
    phoneNumber: String,     // El número asignado (e.g. +52...)
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' }
  },
  contactEmail: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'México' }
  },

  // 🎯 SERVICIOS - ARQUITECTURA PREMIUM SAAS
  services: [{
    // Datos básicos
    name: { type: String, required: true },
    description: String,
    duration: { type: Number, default: 30 }, // minutos

    // Precios
    price: { type: Number, default: 0 },         // Precio actual (editable por negocio)
    basePrice: { type: Number, default: 0 },     // Precio sugerido del catálogo (solo lectura)

    // Estado y categoría
    active: { type: Boolean, default: true },
    category: String,
    customService: { type: Boolean, default: false }, // true = agregado manualmente

    // Sistema de pagos (para Premium)
    requiresPayment: { type: Boolean, default: false }, // true = pago online
    paymentLink: String,    // Link de pago (Stripe, MercadoPago, etc.)
    commission: {          // % que nos queda (para Premium)
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    // Analytics (para Premium)
    timesBooked: { type: Number, default: 0 },  // Veces agendado
    revenue: { type: Number, default: 0 },      // Ingresos generados

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],

  // HORARIOS DE ATENCIÓN
  businessHours: {
    monday: { open: String, close: String, active: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, active: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, active: { type: Boolean, default: true } },
    thursday: { open: String, close: String, active: { type: Boolean, default: true } },
    friday: { open: String, close: String, active: { type: Boolean, default: true } },
    saturday: { open: String, close: String, active: { type: Boolean, default: true } },
    sunday: { open: String, close: String, active: { type: Boolean, default: false } }
  },

  // PLAN Y ESTADO
  plan: {
    type: String,
    enum: ['demo', 'basic', 'pro', 'ultra'],
    default: 'demo'
  },
  subscriptionStatus: {
    type: String,
    enum: ['trial', 'active', 'past_due', 'canceled'],
    default: 'trial'
  },
  trialEndsAt: { type: Date }, // Fecha fin del trial

  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },

  // CONFIGURACIÓN DEL BOT
  botConfig: {
    welcomeMessage: String,
    businessHoursMessage: String,
    locationMessage: String,
    autoResponseEnabled: { type: Boolean, default: true }
  },

  // METADATOS
  onboardingCompleted: { type: Boolean, default: false },
  planExpiresAt: Date,
  salesAgent: String,

}, { timestamps: true });
// 🎯 MIDDLEWARE - Generar slug automáticamente
businessSchema.pre("save", function (next) {
  if (this.isModified("businessName") || !this.slug) {
    this.slug = this.businessName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[u0300-u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});


// 🎯 MIDDLEWARE MEJORADO - Carga servicios con basePrice
businessSchema.pre('save', function (next) {
  // Solo para nuevos negocios o cuando se cambia businessType
  if (this.isNew || this.isModified('businessType')) {
    if (this.businessType && serviceCatalogs[this.businessType]) {
      const catalogServices = serviceCatalogs[this.businessType];

      // Si no hay servicios, cargar del catálogo
      if (!this.services || this.services.length === 0) {
        this.services = catalogServices.map(service => ({
          name: service.name,
          description: `Servicio de ${service.category}`,
          duration: service.duration,
          price: 0,                    // Precio inicial 0 (editable)
          basePrice: service.basePrice, // Precio sugerido del catálogo
          category: service.category,
          customService: false,         // Del catálogo
          requiresPayment: false,       // Por defecto pago en consultorio
          commission: this.plan === 'premium' ? 10 : 0 // 10% comisión para premium
        }));
      }
    }
  }

  // Actualizar updatedAt en servicios modificados
  if (this.isModified('services')) {
    this.services.forEach(service => {
      service.updatedAt = new Date();
    });
  }

  next();
});

// 🎯 MÉTODO PARA AGREGAR SERVICIO MANUALMENTE
businessSchema.methods.addCustomService = function (serviceData) {
  this.services.push({
    name: serviceData.name,
    description: serviceData.description || '',
    duration: serviceData.duration || 30,
    price: serviceData.price || 0,
    basePrice: serviceData.price || 0, // Para custom, basePrice = price
    category: serviceData.category || 'personalizado',
    customService: true,               // Marcado como custom
    requiresPayment: serviceData.requiresPayment || false,
    commission: this.plan === 'premium' ? 10 : 0
  });
};

// 🎯 MÉTODO PARA ACTUALIZAR ANALYTICS
businessSchema.methods.updateServiceAnalytics = function (serviceId, amount) {
  const service = this.services.id(serviceId);
  if (service) {
    service.timesBooked += 1;
    service.revenue += amount;
    service.updatedAt = new Date();
  }
};

module.exports = mongoose.model('Business', businessSchema);
