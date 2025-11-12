const mongoose = require('mongoose');
require('dotenv').config();

async function checkBusinesses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Business = require('./models/Business');
    const businesses = await Business.find({});
    
    console.log(`📊 Total de negocios: ${businesses.length}`);
    
    businesses.forEach(business => {
      console.log('\n--- Negocio ---');
      console.log('ID:', business._id);
      console.log('Nombre:', business.name);
      console.log('Teléfono:', business.phone);
      console.log('Plan:', business.plan);
      console.log('WhatsApp:', business.whatsapp);
      console.log('Servicios:', business.services);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBusinesses();
