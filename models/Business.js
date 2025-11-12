const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    required: true
  },
  schedule: {
    weekdays: { type: String, default: '9:00 AM - 6:00 PM' },
    saturday: { type: String, default: '9:00 AM - 2:00 PM' },
    sunday: { type: String, default: 'Cerrado' }
  },
  services: [{
    type: String
  }],
  plan: {
    type: String,
    enum: ['basico', 'premium', 'empresa', 'profesional'],
    default: 'basico'
  },
  messages: {
    welcome: String,
    appointmentConfirmation: String,
    reminder: String
  },
  settings: {
    timezone: { type: String, default: 'America/Mexico_City' },
    appointmentDuration: { type: Number, default: 30 }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'trial'],
    default: 'active'
  },
  whatsapp: {
    number: String,
    twilioSid: String,
    twilioToken: String,
    isActive: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Business', businessSchema);
