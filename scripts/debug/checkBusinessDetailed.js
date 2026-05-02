const mongoose = require('mongoose');
require('dotenv').config();

async function checkBusinesses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Business = require('./models/Business');
    const businesses = await Business.find({});

    console.log(`📊 Total de negocios: ${businesses.length}`);

    businesses.forEach((business, index) => {
      console.log(`\n--- Negocio ${index + 1} ---`);
      console.log('Estructura completa:', JSON.stringify(business, null, 2));
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBusinesses();
