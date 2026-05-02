const mongoose = require('mongoose');
require('dotenv').config();

async function verifyBusiness() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Business = require('./models/Business');
    const business = await Business.findOne({ name: /DEMO/ });
    
    if (business) {
      console.log('📊 Negocio verificado:');
      console.log('Nombre:', business.name);
      console.log('Teléfono:', business.phone);
      console.log('phoneNumber:', business.phoneNumber);
      console.log('Plan:', business.plan);
      console.log('Status:', business.status);
      console.log('WhatsApp:', business.whatsapp);
    } else {
      console.log('❌ No se encontró el negocio');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyBusiness();
