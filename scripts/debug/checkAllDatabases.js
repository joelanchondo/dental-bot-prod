const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllDatabases() {
  try {
    const uri = process.env.MONGODB_URI.replace('/dental-bot', '');
    await mongoose.connect(uri);
    
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.listDatabases();
    
    console.log('🗄️ TODAS las bases de datos en el cluster:');
    result.databases.forEach(db => {
      console.log(`📁 ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Conectar a cada base de datos y contar negocios
    for (const dbInfo of result.databases) {
      if (!['admin', 'local', 'config'].includes(dbInfo.name)) {
        try {
          const dbUri = process.env.MONGODB_URI.replace('/dental-bot', `/${dbInfo.name}`);
          const tempConnection = await mongoose.createConnection(dbUri).asPromise();
          
          const collections = await tempConnection.db.listCollections().toArray();
          const businessCollections = collections.filter(c => c.name.includes('business'));
          
          if (businessCollections.length > 0) {
            console.log(`\n🔍 Buscando negocios en: ${dbInfo.name}`);
            for (const coll of businessCollections) {
              const count = await tempConnection.db.collection(coll.name).countDocuments();
              console.log(`   📊 ${coll.name}: ${count} documentos`);
              
              if (count > 0) {
                const docs = await tempConnection.db.collection(coll.name).find({}).limit(3).toArray();
                docs.forEach(doc => {
                  console.log(`      - ${doc.businessName || doc.name || 'Sin nombre'}`);
                });
              }
            }
          }
          
          await tempConnection.close();
        } catch (e) {
          console.log(`❌ No se pudo acceder a ${dbInfo.name}`);
        }
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllDatabases();
