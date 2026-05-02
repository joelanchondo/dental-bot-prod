const mongoose = require('mongoose');
require('dotenv').config();

async function checkOtherDatabases() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    
    console.log('🗄️ Bases de datos disponibles:');
    databases.databases.forEach(db => {
      console.log(`- ${db.name} (Tamaño: ${db.sizeOnDisk} bytes)`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOtherDatabases();
