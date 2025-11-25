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
    description: String,
    duration: Number,  // minutos
    price: Number,
    active: { type: Boolean, default: true },
    requiresPayment: { type: Boolean, default: false }, // Para PREMIUM
    category: String // Ej: "Limpieza", "Ortodoncia", etc.
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
  
  // CARACTERÍSTICAS POR PLAN
  features: {
    maxAppointmentsPerMonth: { type: Number, default: 50 }, // demo: 50, basic: 200, pro: 500, premium: unlimited
    calendarAccess: { type: Boolean, default: false },      // PRO y PREMIUM
    paymentGateway: { type: Boolean, default: false },      // Solo PREMIUM
    customBranding: { type: Boolean, default: false },      // PREMIUM
    apiAccess: { type: Boolean, default: false },           // PREMIUM
    multipleUsers: { type: Number, default: 1 },            // PRO: 3, PREMIUM: unlimited
  },
  
  // CONFIGURACIÓN DE CALENDARIO (PRO y PREMIUM)
  calendarConfig: {
    provider: { type: String, enum: ['google', 'internal'], default: 'internal' },
    googleCalendarId: String,
    syncEnabled: { type: Boolean, default: false },
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date
  },
  
  // CONFIGURACIÓN DE PAGOS (PREMIUM)
  paymentConfig: {
    provider: { type: String, enum: ['stripe', 'mercadopago', 'paypal', 'none'], default: 'none' },
    enabled: { type: Boolean, default: false },
    
    // Stripe
    stripeAccountId: String,
    stripePublicKey: String,
    stripeSecretKey: String,
    
    // MercadoPago
    mercadoPagoAccessToken: String,
    mercadoPagoPublicKey: String,
    
    // PayPal
    paypalClientId: String,
    paypalSecret: String,
    
    // Configuración general
    currency: { type: String, default: 'MXN' },
    requireDepositForBooking: { type: Boolean, default: false },
    depositPercentage: { type: Number, default: 50 },
    acceptCash: { type: Boolean, default: true },
    acceptCard: { type: Boolean, default: true },
    acceptTransfer: { type: Boolean, default: true }
  },
  
  // ESTADÍSTICAS (para dashboard)
  statistics: {
    totalAppointments: { type: Number, default: 0 },
    completedAppointments: { type: Number, default: 0 },
    cancelledAppointments: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    monthlyRevenue: { type: Number, default: 0 },
    lastRevenueUpdate: Date
  },
  
  // CONFIGURACIONES AVANZADAS
  reminders: {
    whatsapp24h: { type: Boolean, default: false },
    whatsapp1h: { type: Boolean, default: false },
    email24h: { type: Boolean, default: false }
  },
  
  // CONFIGURACIÓN DEL BOT
  botConfig: {
    welcomeMessage: String,
    customResponses: [{
      trigger: String,
      response: String
    }],
    autoResponseEnabled: { type: Boolean, default: true },
    businessHoursOnly: { type: Boolean, default: true }
  },
  
  // USUARIOS/STAFF (PRO y PREMIUM)
  staff: [{
    name: String,
    role: { type: String, enum: ['admin', 'receptionist', 'provider'] },
    email: String,
    phone: String,
    active: { type: Boolean, default: true },
    canViewCalendar: { type: Boolean, default: false },
    canManageAppointments: { type: Boolean, default: false }
  }],
  
  // METADATOS
  onboardingCompleted: { type: Boolean, default: false },
  demoExpiresAt: Date,
  planExpiresAt: Date,
  salesAgent: String,
  referralCode: String,
  
  // CAMPOS COMPATIBILIDAD (para no romper funcionalidad existente)
  name: { type: String, required: false },
  phone: { type: String, required: false },
  
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
  
  // Configurar características según el plan
  if (this.isModified('plan')) {
    switch(this.plan) {
      case 'demo':
        this.features.maxAppointmentsPerMonth = 50;
        this.features.calendarAccess = false;
        this.features.paymentGateway = false;
        this.features.multipleUsers = 1;
        break;
      case 'basic':
        this.features.maxAppointmentsPerMonth = 200;
        this.features.calendarAccess = false;
        this.features.paymentGateway = false;
        this.features.multipleUsers = 1;
        break;
      case 'pro':
        this.features.maxAppointmentsPerMonth = 500;
        this.features.calendarAccess = true;
        this.features.paymentGateway = false;
        this.features.multipleUsers = 3;
        break;
      case 'premium':
        this.features.maxAppointmentsPerMonth = -1; // unlimited
        this.features.calendarAccess = true;
        this.features.paymentGateway = true;
        this.features.customBranding = true;
        this.features.apiAccess = true;
        this.features.multipleUsers = -1; // unlimited
        break;
    }
  }
  
  next();
});

// Métodos virtuales
businessSchema.virtual('isProOrPremium').get(function() {
  return ['pro', 'premium'].includes(this.plan);
});

businessSchema.virtual('hasPremiumFeatures').get(function() {
  return this.plan === 'premium';
});

// Método para verificar si puede agendar más citas
businessSchema.methods.canBookAppointment = async function() {
  if (this.features.maxAppointmentsPerMonth === -1) return true; // unlimited
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const Appointment = mongoose.model('Appointment');
  const monthlyCount = await Appointment.countDocuments({
    businessId: this._id,
    createdAt: { $gte: startOfMonth }
  });
  
  return monthlyCount < this.features.maxAppointmentsPerMonth;
};

// Método para obtener resumen de pagos
businessSchema.methods.getPaymentSummary = async function() {
  const Appointment = mongoose.model('Appointment');
  
  const summary = await Appointment.aggregate([
    { $match: { businessId: this._id } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$payment.amount' },
        paidAppointments: {
          $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, 1, 0] }
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ['$payment.status', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return summary[0] || { totalRevenue: 0, paidAppointments: 0, pendingPayments: 0 };
};

module.exports = mongoose.model('Business', businessSchema);
