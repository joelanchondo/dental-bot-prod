const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

// 🎯 LANDING PAGE (ROOT)
router.get('/', (req, res) => {
    res.render('landing-techbot');
});

// 🎯 SIGNUP PAGE (POST)
// 🎯 SIGNUP PAGE (POST)
router.post('/signup', async (req, res) => {
    try {
        const { businessName, businessType, whatsapp, email, password, plan } = req.body;

        console.log('📝 Nuevo registro SaaS:', { businessName, plan, email });

        // 1. Validar si ya existe
        const existing = await Business.findOne({
            $or: [{ 'contactEmail': email }, { 'whatsappBusiness': whatsapp }]
        });

        if (existing) {
            return res.status(400).send('<h1>Error: El correo o WhatsApp ya están registrados.</h1><a href="/">Volver</a>');
        }

        // 2. Calcular Trial (3 días)
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(now.getDate() + 3);

        // 3. Crear Negocio
        const newBusiness = new Business({
            businessName,
            businessType,
            whatsappBusiness: whatsapp,
            contactEmail: email,
            adminEmail: email,
            passwordHash: password, // TODO: Hash real con bcrypt en producción
            plan: plan || 'demo',
            subscriptionStatus: 'trial',
            trialEndsAt: trialEnd,

            // Twilio Config Inicial (Pendiente de aprovisionamiento)
            twilioConfig: {
                status: 'pending'
            }
        });

        await newBusiness.save();
        console.log('✅ Negocio creado:', newBusiness._id);

        // 🎯 APROVISIONAMIENTO AUTOMÁTICO (Async)
        // Solo para planes Pro/Ultra y si hay credenciales maestras configuradas
        if (['pro', 'ultra'].includes(plan) && process.env.TWILIO_ACCOUNT_SID) {
            const twilioManager = require('../services/twilioAccountManager');
            // No esperamos (await) para no bloquear la respuesta de registro
            twilioManager.provisionBusiness(newBusiness._id).catch(err => {
                console.error('⚠️ Error en aprovisionamiento background:', err);
            });
        }

        // Redirigir al dashboard (simulado por ahora)
        res.redirect(`/dashboard/${newBusiness._id}`);

    } catch (error) {
        console.error('❌ Error en signup:', error);
        res.status(500).send(`<h1>Error en el registro</h1><p>${error.message}</p><a href="/">Volver</a>`);
    }
});

// 🎯 ADMIN DASHBOARD (SaaS Owner)
router.get('/admin/saas', async (req, res) => {
    // TODO: Add Auth Middleware
    const businesses = await Business.find({});
    res.render('dashboard-admin-saas', { businesses });
});

module.exports = router;
