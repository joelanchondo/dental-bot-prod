const express = require('express');
const router = express.Router();
const { processBotMessage } = require('../services/botService');
const Business = require('../models/Business');
const twilio = require('twilio');

router.post('/whatsapp', async (req, res) => {
  try {
    const { Body, From } = req.body;
    
    // 🔒 PROTECCIÓN: Ignorar mensajes sin cuerpo
    if (!Body || Body.trim() === '') {
      console.log('📱 Mensaje sin cuerpo ignorado de:', From);
      return res.status(200).send('OK');
    }
    
    console.log('📱 MENSAJE RECIBIDO:', Body, 'de:', From);

    const business = await Business.findOne({});
    const response = await processBotMessage(business, Body, From);
    
    console.log('🤖 RESPUESTA GENERADA - ENVIANDO...');
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID || business.whatsapp.twilioSid;
    const authToken = process.env.TWILIO_AUTH_TOKEN || business.whatsapp.twilioToken;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || business.whatsapp.number;
    
    console.log('🔐 Twilio Config:');
    console.log('From:', fromNumber);
    
    const client = twilio(accountSid, authToken);
    
    await client.messages.create({
      body: response,
      from: `whatsapp:${fromNumber}`,
      to: From
    });
    
    console.log('✅ RESPUESTA ENVIADA A WHATSAPP');
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(200).send('OK');
  }
});

module.exports = router;
