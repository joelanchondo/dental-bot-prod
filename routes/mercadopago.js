/**
 * 💳 MERCADOPAGO ROUTES
 * Rutas API para pagos y suscripciones
 */

const express = require('express');
const router = express.Router();
const mercadopagoService = require('../services/mercadopagoService');
const { authenticateToken, requireActiveSubscription } = require('../middleware/auth');

/**
 * GET /api/mercadopago/plans
 * Obtener lista de planes disponibles
 */
router.get('/plans', (req, res) => {
    try {
        const plans = Object.values(mercadopagoService.PLANS);
        res.json({ success: true, plans });
    } catch (error) {
        console.error('Error obteniendo planes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/mercadopago/create-preference
 * Crear preferencia de pago para checkout
 */
router.post('/create-preference', authenticateToken, async (req, res) => {
    try {
        const { planId } = req.body;

        if (!planId) {
            return res.status(400).json({ success: false, error: 'Plan requerido' });
        }

        const result = await mercadopagoService.createPaymentPreference(
            req.user._id,
            planId,
            { source: 'web' }
        );

        res.json({
            success: true,
            preferenceId: result.preferenceId,
            initPoint: result.initPoint,
            sandboxInitPoint: result.sandboxInitPoint
        });
    } catch (error) {
        console.error('Error creando preferencia:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/mercadopago/create-subscription
 * Crear suscripción recurrente
 */
router.post('/create-subscription', authenticateToken, async (req, res) => {
    try {
        const { planId } = req.body;

        if (!planId) {
            return res.status(400).json({ success: false, error: 'Plan requerido' });
        }

        const result = await mercadopagoService.createSubscription(req.user._id, planId);

        res.json({
            success: true,
            subscriptionId: result.subscriptionId,
            initPoint: result.initPoint,
            sandboxInitPoint: result.sandboxInitPoint
        });
    } catch (error) {
        console.error('Error creando suscripción:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/mercadopago/webhook
 * Webhook para notificaciones de MercadoPago
 */
router.post('/webhook', async (req, res) => {
    try {
        console.log('📩 MercadoPago Webhook:', req.body);

        const { type, data } = req.body;

        if (!type || !data) {
            // MercadoPago a veces envía pings vacíos
            return res.status(200).send('OK');
        }

        await mercadopagoService.handleWebhook(type, data);

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error en webhook:', error);
        // Siempre responder 200 para evitar reintentos
        res.status(200).send('OK');
    }
});

/**
 * GET /api/mercadopago/subscription-status
 * Verificar estado de suscripción del usuario
 */
router.get('/subscription-status', authenticateToken, async (req, res) => {
    try {
        const status = await mercadopagoService.checkSubscriptionStatus(req.user._id);
        res.json({ success: true, ...status });
    } catch (error) {
        console.error('Error verificando suscripción:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/mercadopago/cancel
 * Cancelar suscripción
 */
router.post('/cancel', authenticateToken, async (req, res) => {
    try {
        const result = await mercadopagoService.cancelSubscription(req.user._id);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error cancelando suscripción:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/mercadopago/payment/:id
 * Obtener detalles de un pago
 */
router.get('/payment/:id', authenticateToken, async (req, res) => {
    try {
        const payment = await mercadopagoService.getPayment(req.params.id);
        res.json({ success: true, payment });
    } catch (error) {
        console.error('Error obteniendo pago:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// PÁGINAS DE RESULTADO (Success/Failure/Pending)
// ==========================================

/**
 * GET /payment/success
 * Página de pago exitoso
 */
router.get('/success', (req, res) => {
    const { collection_id, preference_id, external_reference, payment_type } = req.query;

    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>¡Pago Exitoso! - BotSaaS</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .container {
          text-align: center;
          padding: 48px;
          background: rgba(255,255,255,0.05);
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.1);
          max-width: 500px;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 40px;
        }
        h1 { font-size: 28px; margin-bottom: 16px; }
        p { color: #94a3b8; margin-bottom: 32px; line-height: 1.6; }
        .btn {
          display: inline-block;
          padding: 16px 32px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #000;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          transition: transform 0.3s;
        }
        .btn:hover { transform: translateY(-2px); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✓</div>
        <h1>¡Pago Exitoso!</h1>
        <p>Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las funciones de tu plan.</p>
        <a href="/dashboard" class="btn">Ir a Mi Dashboard</a>
      </div>
    </body>
    </html>
  `);
});

/**
 * GET /payment/failure
 * Página de pago fallido
 */
router.get('/failure', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pago Fallido - BotSaaS</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .container {
          text-align: center;
          padding: 48px;
          background: rgba(255,255,255,0.05);
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.1);
          max-width: 500px;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 40px;
        }
        h1 { font-size: 28px; margin-bottom: 16px; }
        p { color: #94a3b8; margin-bottom: 32px; line-height: 1.6; }
        .btn {
          display: inline-block;
          padding: 16px 32px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #000;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          margin: 8px;
        }
        .btn-outline {
          background: transparent;
          border: 2px solid rgba(255,255,255,0.2);
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✕</div>
        <h1>Pago No Completado</h1>
        <p>Hubo un problema al procesar tu pago. Por favor intenta de nuevo o usa otro método de pago.</p>
        <a href="/#pricing" class="btn">Intentar de Nuevo</a>
        <a href="/" class="btn btn-outline">Volver al Inicio</a>
      </div>
    </body>
    </html>
  `);
});

/**
 * GET /payment/pending
 * Página de pago pendiente
 */
router.get('/pending', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pago Pendiente - BotSaaS</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .container {
          text-align: center;
          padding: 48px;
          background: rgba(255,255,255,0.05);
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.1);
          max-width: 500px;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 40px;
        }
        h1 { font-size: 28px; margin-bottom: 16px; }
        p { color: #94a3b8; margin-bottom: 32px; line-height: 1.6; }
        .btn {
          display: inline-block;
          padding: 16px 32px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #000;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">⏳</div>
        <h1>Pago Pendiente</h1>
        <p>Tu pago está siendo procesado. Te notificaremos por email cuando se confirme. Esto puede tomar unos minutos.</p>
        <a href="/" class="btn">Volver al Inicio</a>
      </div>
    </body>
    </html>
  `);
});

module.exports = router;
