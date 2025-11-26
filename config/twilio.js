const twilio = require('twilio');

function getTwilioClient(business) {
  // Si el negocio no tiene Twilio configurado, usar credenciales globales
  if (!business.whatsapp?.twilioSid || !business.whatsapp?.twilioToken) {
    console.log('🔧 Usando credenciales Twilio globales para:', business.businessName);
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  return twilio(business.whatsapp.twilioSid, business.whatsapp.twilioToken);
}

async function sendWhatsApp(business, to, message) {
  try {
    const client = getTwilioClient(business);

    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${business.whatsapp?.number || process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}`,
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
