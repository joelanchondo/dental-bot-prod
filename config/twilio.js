const twilio = require('twilio');

function getTwilioClient(business) {
  if (!business.whatsapp.twilioSid || !business.whatsapp.twilioToken) {
    throw new Error('Twilio no configurado para este negocio');
  }
  
  return twilio(business.whatsapp.twilioSid, business.whatsapp.twilioToken);
}

async function sendWhatsApp(business, to, message) {
  try {
    const client = getTwilioClient(business);
    
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${business.whatsapp.number}`,
      to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    });
    
    console.log('✅ WhatsApp enviado:', result.sid);
    return result;
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
    throw error;
  }
}

module.exports = { getTwilioClient, sendWhatsApp };
