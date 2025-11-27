const mongoose = require('mongoose');
const serviceCatalogs = require('../config/service-catalogs');

const businessSchema = new mongoose.Schema({
  // DATOS BÁSICOS DEL NEGOCIO
  businessType: {
    type: String,
    enum: ['medical', 'dental', 'spa', 'nails', 'barbershop', 'automotive', 'food', 'other'],
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  legalName: String,
  rfc: String,
  managerName: String,

  // CONTACTO Y UBICACIÓN
  whatsappBusiness: {
    type: String,
    required: true
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

  // SERVICIOS SELECCIONADOS DEL CATÁLOGO
  services: [{
    name: String,
    description: String,
    duration: Number,
    price: Number,
    active: { type: Boolean, default: true },
    category: String,
    customService: { type: Boolean, default: false } // TRUE si lo agregó manualmente
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
    enum: ['demo', 'basic', 'pro', 'premium'],
    default: 'demo'
  },
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

// Middleware para cargar servicios del catálogo al crear negocio
businessSchema.pre('save', function(next) {
  if (this.isNew && this.businessType && serviceCatalogs[this.businessType]) {
    // Cargar servicios del catálogo para este tipo de negocio
    const catalogServices = serviceCatalogs[this.businessType];
    this.services = catalogServices.map(service => ({
      name: service.name,
      duration: service.duration,
      price: service.basePrice,
      category: service.category,
      customService: false
    }));
  }
  next();
});

module.exports = mongoose.model('Business', businessSchema);
