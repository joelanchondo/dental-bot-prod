const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📂 Colecciones en la base de datos:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Contar documentos en cada colección
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`📊 ${collection.name}: ${count} documentos`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllCollections();
