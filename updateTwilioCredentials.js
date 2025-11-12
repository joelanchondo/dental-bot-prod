const mongoose = require('mongoose');
const Business = require('./models/Business');
require('dotenv').config();

async function updateCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const business = await Business.findOne({ name: /DEMO/ });
    
    if (!business) {
      console.log('❌ No se encontró el cliente DEMO');
      await mongoose.connection.close();
      return;
    }

    console.log(`📊 Negocio encontrado: ${business.name}`);
    
    // Inicializar el objeto whatsapp si no existe
    if (!business.whatsapp) {
      business.whatsapp = {};
    }
    
    // Actualizar credenciales
    business.whatsapp.number = '+14155238886';
    business.whatsapp.twilioSid = 'AC6177a02e055c189efbff4a94dd222dfd';
    business.whatsapp.twilioToken = '50a544fabd3a16667e1129acc940910f';
    business.whatsapp.isActive = true;
    
    await business.save();
    
    console.log('✅ Credenciales actualizadas exitosamente!');
    console.log('WhatsApp Number:', business.whatsapp.number);
    console.log('Twilio SID:', business.whatsapp.twilioSid);
    console.log('Auth Token:', business.whatsapp.twilioToken.substring(0, 8) + '...');
    console.log('Active:', business.whatsapp.isActive);
    
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

updateCredentials();
