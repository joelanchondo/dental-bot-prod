const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const twilio = require('twilio');

// Importar diferentes bots según plan
const botDemo = require('../services/botService-DEMO');
const botTrial = require('../services/botService-TRIAL'); 
const botBasico = require('../services/botService-BASICO');
const botPro = require('../services/botService-PRO');
const botPremium = require('../services/botService-PREMIUM');

router.post('/whatsapp', async (req, res) => {
  try {
    const { Body, From, To } = req.body;

    if (!Body || Body.trim() === '') {
      console.log('📱 Mensaje sin cuerpo ignorado de:', From);
      return res.status(200).send('OK');
    }

    console.log('📱 MENSAJE RECIBIDO:', Body, 'de:', From, 'a:', To);

    // 🔍 BUSCAR NEGOCIO POR NÚMERO DE WHATSAPP
    const toNumber = To?.replace('whatsapp:', '').replace('+', '');
    let business = null;

    // DETECTAR TIPO DE BOT SEGÚN NÚMERO Y PLAN
    let botProcessor;

    if (toNumber === '14155238886') {
      // 🎭 BOT DEMO (número Twilio fijo)
      console.log('🎭 Usando BOT DEMO');
      botProcessor = botDemo.processBotMessage;
      // Crear objeto business demo
      business = {
        businessName: "🦷 Clínica Dental Demo",
        businessType: "dental",
        plan: "demo",
        whatsappBusiness: "+14155238886",
        _id: "demo-id"
      };
    } else {
      // Buscar negocio real en MongoDB
      business = await Business.findOne({
        whatsappBusiness: { $regex: toNumber.slice(-10), $options: 'i' }
      });

      if (!business) {
        console.log('⚠️ No se encontró negocio para', toNumber, '- usando primero disponible');
        business = await Business.findOne({});
      }

      if (!business) {
        console.log('❌ No hay negocios en la BD');
        return res.status(200).send('OK');
      }

      console.log('🏥 Negocio encontrado:', business.businessName, business._id, 'Plan:', business.plan);

      // SELECCIONAR BOT SEGÚN PLAN
      switch (business.plan) {
        case 'free-trial':
          console.log('🧪 Usando BOT TRIAL');
          botProcessor = botTrial.processBotMessage;
          break;
        case 'basico':
          console.log('🏷️ Usando BOT BÁSICO');
          botProcessor = botBasico.processBotMessage;
          break;
        case 'pro':
          console.log('🚀 Usando BOT PRO');
          botProcessor = botPro.processBotMessage;
          break;
        case 'premium':
          console.log('👑 Usando BOT PREMIUM');
          botProcessor = botPremium.processBotMessage;
          break;
        default:
          console.log('⚠️ Plan no reconocido, usando BOT BÁSICO');
          botProcessor = botBasico.processBotMessage;
      }
    }

    const response = await botProcessor(business, Body, From);

    console.log('🤖 RESPUESTA GENERADA - ENVIANDO...');

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: response,
      from: `whatsapp:${fromNumber}`,
      to: From
    });

    console.log('✅ RESPUESTA ENVIADA');
    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(500).send('ERROR');
  }
});

module.exports = router;
