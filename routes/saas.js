const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

// 🎯 LANDING PAGE (ROOT)
router.get('/', (req, res) => {
    res.render('landing-techbot');
});

// 🎯 SIGNUP PAGE (POST)
router.post('/signup', async (req, res) => {
    try {
        const { businessName, businessType, whatsapp, email, password, plan } = req.body;

        console.log('📝 Nuevo registro SaaS:', { businessName, plan });

        // TODO: Crear Business con Trial
        // TODO: Iniciar proceso async de Twilio Subaccount

        res.send('Registro recibido. Procesando... (Pronto te redirigiremos al Dashboard)');
    } catch (error) {
        console.error('Error en signup:', error);
        res.status(500).send('Error en el registro');
    }
});

// 🎯 ADMIN DASHBOARD (SaaS Owner)
router.get('/admin/saas', async (req, res) => {
    // TODO: Add Auth Middleware
    const businesses = await Business.find({});
    res.render('dashboard-admin-saas', { businesses });
});

module.exports = router;
