const express = require('express');
const router = express.Router();
const { processBotMessage } = require('../services/botService');
const Business = require('../models/Business');
const twilio = require('twilio');

router.post('/whatsapp', async (req, res) => {
  try {
    const { Body, From } = req.body;
    console.log('📱 MENSAJE RECIBIDO:', Body, 'de:', From);

    const business = await Business.findOne({});
    const response = await processBotMessage(business, Body, From);
    
    console.log('🤖 RESPUESTA GENERADA - ENVIANDO...');
    
    // ENVIAR LA RESPUESTA CON TWILIO - CORREGIDO
    const client = twilio(
      business.whatsapp.twilioSid, 
      business.whatsapp.twilioToken
    );
    
    await client.messages.create({
      body: response,
      from: `whatsapp:${business.whatsapp.number}`,  // AGREGAR 'whatsapp:'
      to: From  // Ya incluye 'whatsapp:'
    });
    
    console.log('✅ RESPUESTA ENVIADA A WHATSAPP');
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(200).send('OK');
  }
});

module.exports = router;
