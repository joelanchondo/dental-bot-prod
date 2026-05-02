const mongoose = require('mongoose');
require('dotenv').config();

async function checkCluster() {
  try {
    // Conectar sin especificar base de datos
    const baseUri = process.env.MONGODB_URI.split('/').slice(0, -1).join('/');
    await mongoose.connect(baseUri);
    
    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    
    console.log('🗄️ BASES DE DATOS EN EL CLUSTER:');
    databases.databases.forEach(db => {
      console.log(`📁 ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCluster();
