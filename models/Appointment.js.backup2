const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  
  patient: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String
  },
  
  service: { type: String, required: true },
  datetime: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  
  status: {
    type: String,
    enum: ['pendiente', 'confirmada', 'en-curso', 'completada', 'retrasada', 'cancelada'],
    default: 'confirmada'
  },
  
  delay: { type: Number, default: 0 },
  
  reminders: {
    sent24h: { type: Boolean, default: false },
    sent1h: { type: Boolean, default: false },
    sent10min: { type: Boolean, default: false }
  },
  
  source: {
    type: String,
    enum: ['whatsapp', 'phone', 'web', 'walk-in'],
    default: 'whatsapp'
  },
  
  notes: String
}, { 
  timestamps: true 
});

appointmentSchema.index({ businessId: 1, datetime: 1 });
appointmentSchema.index({ 'patient.phone': 1 });
appointmentSchema.index({ status: 1, datetime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
