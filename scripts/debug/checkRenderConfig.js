console.log('🔍 Verificando configuración:');
console.log('TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER || 'NO DEFINIDA');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'PRESENTE' : 'NO DEFINIDA');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'PRESENTE' : 'NO DEFINIDA');
