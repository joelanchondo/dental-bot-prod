const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  clientPhone: {
    type: String,
    required: true
  },
  clientEmail: String,
  service: {
    type: String,
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 30
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'pending'
  },
  notes: String,
  internalNotes: String,
  payment: {
    required: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'MXN' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded', 'failed', 'not-required'],
      default: 'not-required'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'transfer', 'stripe', 'mercadopago', 'paypal', 'none'],
      default: 'none'
    },
    transactionId: String,
    paymentDate: Date,
    paymentLink: String,
    depositRequired: { type: Boolean, default: false },
    depositAmount: Number,
    depositPaid: { type: Boolean, default: false },
    invoiceRequired: { type: Boolean, default: false },
    invoiceData: {
      rfc: String,
      businessName: String,
      address: String,
      email: String
    },
    invoiceGenerated: { type: Boolean, default: false },
    invoiceUrl: String
  },
  reminders: {
    sent24h: { type: Boolean, default: false },
    sent1h: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false }
  },
  history: [{
    action: String,
    date: { type: Date, default: Date.now },
    note: String,
    performedBy: String
  }],
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  rescheduledTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  source: {
    type: String,
    enum: ['whatsapp', 'web', 'phone', 'walk-in', 'admin'],
    default: 'whatsapp'
  },
  confirmationCode: String,
  confirmedAt: Date,
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['client', 'business', 'system']
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

appointmentSchema.index({ businessId: 1, dateTime: 1 });
appointmentSchema.index({ clientPhone: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ 'payment.status': 1 });

appointmentSchema.virtual('isUpcoming').get(function() {
  return this.dateTime > new Date() && ['pending', 'confirmed'].includes(this.status);
});

appointmentSchema.virtual('isPast').get(function() {
  return this.dateTime < new Date();
});

appointmentSchema.methods.confirm = async function() {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  this.history.push({
    action: 'confirmed',
    performedBy: 'client',
    note: 'Cita confirmada por el cliente'
  });
  return await this.save();
};

appointmentSchema.methods.cancel = async function(reason, cancelledBy = 'client') {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.history.push({
    action: 'cancelled',
    performedBy: cancelledBy,
    note: reason
  });
  if (this.payment.status === 'paid') {
    this.payment.status = 'refunded';
  }
  return await this.save();
};

appointmentSchema.methods.complete = async function() {
  this.status = 'completed';
  this.history.push({
    action: 'completed',
    performedBy: 'business',
    note: 'Cita completada'
  });
  return await this.save();
};

appointmentSchema.methods.registerPayment = async function(paymentData) {
  this.payment.status = 'paid';
  this.payment.method = paymentData.method;
  this.payment.transactionId = paymentData.transactionId;
  this.payment.paymentDate = new Date();
  this.history.push({
    action: 'payment_received',
    performedBy: 'system',
    note: `Pago recibido: ${paymentData.method} - ${this.payment.amount} ${this.payment.currency}`
  });
  return await this.save();
};

appointmentSchema.methods.generateConfirmationCode = function() {
  this.confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  return this.confirmationCode;
};

module.exports = mongoose.model('Appointment', appointmentSchema);
