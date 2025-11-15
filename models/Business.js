const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  // DATOS BÁSICOS DEL NEGOCIO
  businessType: {
    type: String,
    enum: ['dental', 'medical', 'automotive', 'barbershop', 'spa', 'consulting', 'other'],
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  legalName: String,        // Razón Social
  rfc: String,              // RFC
  managerName: String,      // Nombre del encargado
  
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
  
  // CONFIGURACIÓN DE SERVICIOS (dinámica por tipo de negocio)
  services: [{
    name: String,
    duration: Number,  // minutos
    price: Number
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
  
  // CONFIGURACIONES AVANZADAS (para planes pro/premium)
  googleConfig: {
    connected: { type: Boolean, default: false },
    accessToken: String,
    refreshToken: String,
    email: String
  },
  
  reminders: {
    whatsapp24h: { type: Boolean, default: false },
    whatsapp1h: { type: Boolean, default: false },
    email24h: { type: Boolean, default: false }
  },
  
  // METADATOS
  onboardingCompleted: { type: Boolean, default: false },
  demoExpiresAt: Date,
  salesAgent: String,  // Quién vendió el servicio
  
  // CAMPOS COMPATIBILIDAD (para no romper funcionalidad existente)
  name: { type: String, required: false },  // Compatibilidad
  phone: { type: String, required: false }, // Compatibilidad
  
}, { 
  timestamps: true 
});

// Middleware para mantener compatibilidad
businessSchema.pre('save', function(next) {
  // Si no hay 'name', usar businessName
  if (!this.name && this.businessName) {
    this.name = this.businessName;
  }
  // Si no hay 'phone', usar whatsappBusiness
  if (!this.phone && this.whatsappBusiness) {
    this.phone = this.whatsappBusiness;
  }
  next();
});

module.exports = mongoose.model('Business', businessSchema);
