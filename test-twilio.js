require('dotenv').config();
const twilio = require('twilio');

// El usuario debe poner el token como argumento: node test-twilio.js su_token_aqui
const authToken = process.argv[2] || process.env.TWILIO_AUTH_TOKEN;

if (!authToken || authToken === 'tu_auth_token') {
    console.error('❌ Error: Necesitas proporcionar tu AuthToken.');
    console.error('Uso: node test-twilio.js TU_AUTH_TOKEN');
    process.exit(1);
}

const accountSid = 'AC6177a02e055c189efbff4a94dd222dfd';
const client = twilio(accountSid, authToken);

console.log('⏳ Enviando mensaje de prueba usando plantilla (Content API)...');

client.messages
    .create({
        from: 'whatsapp:+14155238886',
        contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
        contentVariables: '{"1":"12/1","2":"3pm"}', // Variables de la plantilla
        to: 'whatsapp:+5216143718812'
    })
    .then(message => {
        console.log('✅ Mensaje enviado exitosamente!');
        console.log('📌 SID del mensaje:', message.sid);
    })
    .catch(error => {
        console.error('❌ Error enviando mensaje:', error.message);
    })
    .done();
