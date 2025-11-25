const express = require('express');
const router = express.Router();
const { processBotMessage } = require('../services/botService');
const Business = require('../models/Business');
const twilio = require('twilio');

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
    
    if (toNumber) {
      business = await Business.findOne({ 
        whatsappBusiness: { $regex: toNumber.slice(-10), $options: 'i' }
      });
    }
    
    // Si no se encuentra, usar el primero disponible (fallback)
    if (!business) {
      console.log('⚠️ No se encontró negocio para', toNumber, '- usando primero disponible');
      business = await Business.findOne({});
    }
    
    if (!business) {
      console.log('❌ No hay negocios en la BD');
      return res.status(200).send('OK');
    }
    
    console.log('🏥 Negocio encontrado:', business.businessName, business._id);
    
    const response = await processBotMessage(business, Body, From);
    
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
    res.status(200).send('OK');
  }
});

module.exports = router;
