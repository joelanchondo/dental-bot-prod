// services/stripeService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');

class StripeService {
  /**
   * Crear un Payment Intent para una cita
   */
  async createPaymentIntent(appointmentId) {
    try {
      const appointment = await Appointment.findById(appointmentId).populate('businessId');
      
      if (!appointment) {
        throw new Error('Cita no encontrada');
      }
      
      const business = appointment.businessId;
      
      if (!business.paymentConfig.enabled) {
        throw new Error('Pagos no habilitados para este negocio');
      }
      
      // Calcular monto (si requiere depósito o pago completo)
      let amount = appointment.payment.amount;
      if (appointment.payment.depositRequired && !appointment.payment.depositPaid) {
        amount = appointment.payment.depositAmount;
      }
      
      // Crear Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency: appointment.payment.currency.toLowerCase(),
        metadata: {
          appointmentId: appointment._id.toString(),
          businessId: business._id.toString(),
          clientName: appointment.clientName,
          clientPhone: appointment.clientPhone,
          service: appointment.service
        },
        description: `${business.businessName} - ${appointment.service}`,
        receipt_email: appointment.clientEmail || business.contactEmail
      });
      
      // Guardar el payment intent ID en la cita
      appointment.payment.transactionId = paymentIntent.id;
      await appointment.save();
      
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: appointment.payment.currency
      };
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }
  
  /**
   * Crear un Payment Link (link de pago directo)
   */
  async createPaymentLink(appointmentId) {
    try {
      const appointment = await Appointment.findById(appointmentId).populate('businessId');
      
      if (!appointment) {
        throw new Error('Cita no encontrada');
      }
      
      const business = appointment.businessId;
      
      // Calcular monto
      let amount = appointment.payment.amount;
      if (appointment.payment.depositRequired && !appointment.payment.depositPaid) {
        amount = appointment.payment.depositAmount;
      }
      
      // Crear producto en Stripe
      const product = await stripe.products.create({
        name: `${appointment.service} - ${business.businessName}`,
        description: `Cita para ${appointment.clientName}`,
        metadata: {
          appointmentId: appointment._id.toString(),
          businessId: business._id.toString()
        }
      });
      
      // Crear precio
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100),
        currency: appointment.payment.currency.toLowerCase()
      });
      
      // Crear Payment Link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{
          price: price.id,
          quantity: 1
        }],
        metadata: {
          appointmentId: appointment._id.toString(),
          businessId: business._id.toString()
        },
        after_completion: {
          type: 'redirect',
          redirect: {
            url: `${process.env.BASE_URL}/payment/success?appointmentId=${appointment._id}`
          }
        }
      });
      
      // Guardar el link en la cita
      appointment.payment.paymentLink = paymentLink.url;
      appointment.payment.status = 'pending';
      await appointment.save();
      
      return {
        paymentLink: paymentLink.url,
        amount: amount,
        currency: appointment.payment.currency
      };
      
    } catch (error) {
      console.error('Error creating payment link:', error);
      throw error;
    }
  }
  
  /**
   * Procesar webhook de Stripe
   */
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
          
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
          
        case 'checkout.session.completed':
          await this.handleCheckoutComplete(event.data.object);
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }
  
  /**
   * Manejar pago exitoso
   */
  async handlePaymentSuccess(paymentIntent) {
    try {
      const appointmentId = paymentIntent.metadata.appointmentId;
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        throw new Error('Cita no encontrada');
      }
      
      // Si era un depósito
      if (appointment.payment.depositRequired && !appointment.payment.depositPaid) {
        appointment.payment.depositPaid = true;
        appointment.payment.status = 'partial';
      } else {
        appointment.payment.status = 'paid';
      }
      
      appointment.payment.method = 'stripe';
      appointment.payment.transactionId = paymentIntent.id;
      appointment.payment.paymentDate = new Date();
      
      // Confirmar la cita automáticamente si estaba pendiente
      if (appointment.status === 'pending') {
        appointment.status = 'confirmed';
        appointment.confirmedAt = new Date();
      }
      
      appointment.history.push({
        action: 'payment_received',
        performedBy: 'system',
        note: `Pago recibido vía Stripe: $${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`
      });
      
      await appointment.save();
      
      // Actualizar estadísticas del negocio
      const business = await Business.findById(appointment.businessId);
      if (business) {
        business.statistics.totalRevenue += (paymentIntent.amount / 100);
        business.statistics.lastRevenueUpdate = new Date();
        await business.save();
      }
      
      // TODO: Enviar confirmación por WhatsApp
      console.log(`✅ Pago procesado para cita ${appointmentId}`);
      
      return appointment;
      
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }
  
  /**
   * Manejar pago fallido
   */
  async handlePaymentFailed(paymentIntent) {
    try {
      const appointmentId = paymentIntent.metadata.appointmentId;
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        throw new Error('Cita no encontrada');
      }
      
      appointment.payment.status = 'failed';
      appointment.history.push({
        action: 'payment_failed',
        performedBy: 'system',
        note: `Pago fallido: ${paymentIntent.last_payment_error?.message || 'Error desconocido'}`
      });
      
      await appointment.save();
      
      // TODO: Notificar al negocio y al cliente
      console.log(`❌ Pago fallido para cita ${appointmentId}`);
      
      return appointment;
      
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }
  
  /**
   * Manejar checkout completado (para Payment Links)
   */
  async handleCheckoutComplete(session) {
    try {
      const appointmentId = session.metadata.appointmentId;
      
      if (!appointmentId) {
        console.log('No appointment ID in session metadata');
        return;
      }
      
      // Obtener el Payment Intent asociado
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      
      // Procesar como pago exitoso
      await this.handlePaymentSuccess(paymentIntent);
      
    } catch (error) {
      console.error('Error handling checkout complete:', error);
      throw error;
    }
  }
  
  /**
   * Crear reembolso
   */
  async createRefund(appointmentId, reason = 'requested_by_customer') {
    try {
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        throw new Error('Cita no encontrada');
      }
      
      if (appointment.payment.status !== 'paid') {
        throw new Error('La cita no tiene un pago completado');
      }
      
      if (!appointment.payment.transactionId) {
        throw new Error('No se encontró el ID de transacción');
      }
      
      // Crear reembolso en Stripe
      const refund = await stripe.refunds.create({
        payment_intent: appointment.payment.transactionId,
        reason: reason
      });
      
      // Actualizar cita
      appointment.payment.status = 'refunded';
      appointment.history.push({
        action: 'payment_refunded',
        performedBy: 'system',
        note: `Reembolso procesado: $${refund.amount / 100} ${refund.currency.toUpperCase()}`
      });
      
      await appointment.save();
      
      // Actualizar estadísticas del negocio
      const business = await Business.findById(appointment.businessId);
      if (business) {
        business.statistics.totalRevenue -= (refund.amount / 100);
        business.statistics.lastRevenueUpdate = new Date();
        await business.save();
      }
      
      return refund;
      
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }
  
  /**
   * Obtener balance/estadísticas de pagos
   */
  async getPaymentStats(businessId, startDate, endDate) {
    try {
      const appointments = await Appointment.find({
        businessId: businessId,
        'payment.status': 'paid',
        'payment.paymentDate': {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      const totalRevenue = appointments.reduce((sum, apt) => sum + apt.payment.amount, 0);
      const totalTransactions = appointments.length;
      
      // Agrupar por método de pago
      const byMethod = {};
      appointments.forEach(apt => {
        const method = apt.payment.method;
        if (!byMethod[method]) {
          byMethod[method] = { count: 0, total: 0 };
        }
        byMethod[method].count++;
        byMethod[method].total += apt.payment.amount;
      });
      
      return {
        totalRevenue,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        byMethod,
        period: { start: startDate, end: endDate }
      };
      
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();
