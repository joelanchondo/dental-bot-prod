const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔗 Probando conexión a MongoDB Atlas...');
    
    const uri = 'mongodb+srv://joelanchondo_db_user:Bubu2516!@dental-bot.1xcbxyh.mongodb.net/dental-bot?retryWrites=true&w=majority&appName=dental-bot';
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('✅ Conexión exitosa!');
    
    // Verificar si hay datos
    const Business = require('./models/Business');
    const businesses = await Business.find({});
    console.log(`📊 Negocios en la base de datos: ${businesses.length}`);
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('💡 Posibles soluciones:');
      console.log('1. Verifica tu conexión a internet');
      console.log('2. Agrega tu IP a la whitelist en MongoDB Atlas');
      console.log('3. Verifica usuario y contraseña');
    }
  }
}

testConnection();
