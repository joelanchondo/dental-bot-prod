const mongoose = require('mongoose');
require('dotenv').config();

async function checkLocalBusinesses() {
  try {
    // Conectar a la base de datos local
    const localUri = 'mongodb://localhost:27017/dental-bot';
    await mongoose.connect(localUri);
    console.log('✅ Conectado a MongoDB local');

    try {
      const Business = require('./models/Business');
      const businesses = await Business.find({});
      console.log(`🏪 Negocios en local: ${businesses.length}`);
      
      businesses.forEach(business => {
        console.log('Negocio:', business.businessName);
      });
    } catch (e) {
      console.log('❌ No se pudo acceder a negocios en local');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.log('❌ No hay base de datos local o no está corriendo MongoDB local');
  }
}

checkLocalBusinesses();
