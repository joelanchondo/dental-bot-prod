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
    email: { type: String }
  },
  service: { type: String, required: true },
  datetime: { type: Date, required: true },
  duration: { type: Number, default: 30 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  source: {
    type: String,
    enum: ['whatsapp', 'website', 'phone', 'in_person'],
    default: 'whatsapp'
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
