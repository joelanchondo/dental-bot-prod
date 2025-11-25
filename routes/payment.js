// routes/payment.js
const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');

// Middleware para verificar que el negocio tenga pagos habilitados
const verifyPaymentAccess = async (req, res, next) => {
  try {
    const businessId = req.body.businessId || req.query.businessId;
    const business = await Business.findById(businessId);
    
    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }
    
    if (!business.features.paymentGateway) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Los pagos en línea están disponibles solo para plan PREMIUM',
        currentPlan: business.plan,
        upgradeUrl: '/upgrade'
      });
    }
    
    if (!business.paymentConfig.enabled) {
      return res.status(403).json({
        error: 'Pagos no configurados',
        message: 'El negocio aún no ha configurado su método de pago'
      });
    }
    
    req.business = business;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 💳 Crear Payment Intent
router.post('/create-payment-intent', verifyPaymentAccess, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    const result = await stripeService.createPaymentIntent(appointmentId);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      error: 'Error al crear intención de pago',
      message: error.message
    });
  }
});

// 🔗 Crear Payment Link (para enviar por WhatsApp)
router.post('/create-payment-link', verifyPaymentAccess, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    const result = await stripeService.createPaymentLink(appointmentId);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({
      error: 'Error al crear link de pago',
      message: error.message
    });
  }
});

// 🎣 Webhook de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    // Verificar que el webhook viene de Stripe
    event = require('stripe')(process.env.STRIPE_SECRET_KEY)
      .webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    // Procesar el evento
    await stripeService.handleWebhook(event);
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

// 💰 Crear reembolso
router.post('/refund', verifyPaymentAccess, async (req, res) => {
  try {
    const { appointmentId, reason } = req.body;
    
    const refund = await stripeService.createRefund(appointmentId, reason);
    
    res.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status
      }
    });
    
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({
      error: 'Error al procesar reembolso',
      message: error.message
    });
  }
});

// 📊 Estadísticas de pagos
router.get('/stats', verifyPaymentAccess, async (req, res) => {
  try {
    const { businessId, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // Inicio del mes
    const end = endDate ? new Date(endDate) : new Date(); // Hoy
    
    const stats = await stripeService.getPaymentStats(businessId, start, end);
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting payment stats:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
});

// ✅ Página de éxito (después del pago)
router.get('/success', async (req, res) => {
  const { appointmentId } = req.query;
  
  try {
    const appointment = await Appointment.findById(appointmentId).populate('businessId');
    
    if (!appointment) {
      return res.status(404).send('Cita no encontrada');
    }
    
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pago Exitoso</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 500px;
            text-align: center;
          }
          .success-icon {
            font-size: 80px;
            margin-bottom: 20px;
          }
          h1 {
            color: #10b981;
            margin-bottom: 10px;
          }
          p {
            color: #6b7280;
            margin-bottom: 30px;
          }
          .details {
            background: #f9fafb;
            padding: 20px;
            border-radius: 10px;
            text-align: left;
            margin-bottom: 30px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .details-row:last-child {
            border-bottom: none;
          }
          .label {
            color: #6b7280;
            font-weight: 600;
          }
          .value {
            color: #111827;
          }
          .btn {
            background: #667eea;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
          }
          .btn:hover {
            background: #5568d3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>¡Pago Exitoso!</h1>
          <p>Tu pago ha sido procesado correctamente</p>
          
          <div class="details">
            <div class="details-row">
              <span class="label">Negocio:</span>
              <span class="value">${appointment.businessId.businessName}</span>
            </div>
            <div class="details-row">
              <span class="label">Servicio:</span>
              <span class="value">${appointment.service}</span>
            </div>
            <div class="details-row">
              <span class="label">Fecha:</span>
              <span class="value">${new Date(appointment.dateTime).toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            <div class="details-row">
              <span class="label">Monto Pagado:</span>
              <span class="value">$${appointment.payment.amount} ${appointment.payment.currency}</span>
            </div>
            <div class="details-row">
              <span class="label">Estado:</span>
              <span class="value" style="color: #10b981; font-weight: bold;">CONFIRMADO</span>
            </div>
          </div>
          
          <p style="font-size: 14px; color: #9ca3af;">
            Recibirás una confirmación por WhatsApp al número ${appointment.clientPhone}
          </p>
          
          <a href="#" class="btn" onclick="window.close()">Cerrar</a>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Error showing success page:', error);
    res.status(500).send('Error al cargar página de confirmación');
  }
});

// ❌ Página de error
router.get('/error', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error en el Pago</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          max-width: 500px;
          text-align: center;
        }
        .error-icon {
          font-size: 80px;
          margin-bottom: 20px;
        }
        h1 {
          color: #ef4444;
          margin-bottom: 10px;
        }
        p {
          color: #6b7280;
          margin-bottom: 30px;
        }
        .btn {
          background: #667eea;
          color: white;
          padding: 15px 30px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin: 5px;
        }
        .btn:hover {
          background: #5568d3;
        }
        .btn-secondary {
          background: #6b7280;
        }
        .btn-secondary:hover {
          background: #4b5563;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">❌</div>
        <h1>Error en el Pago</h1>
        <p>Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.</p>
        
        <p style="font-size: 14px; color: #9ca3af;">
          Si el problema persiste, contacta al negocio directamente.
        </p>
        
        <a href="#" class="btn" onclick="history.back()">Intentar Nuevamente</a>
        <a href="#" class="btn btn-secondary" onclick="window.close()">Cerrar</a>
      </div>
    </body>
    </html>
  `);
});

module.exports = router;
