const mongoose = require('mongoose');

async function dropIndex() {
  try {
    await mongoose.connect('mongodb+srv://joelanchondo_db_user:Bubu2516%21@dental-bot.1xcbxyh.mongodb.net/dental-bot?retryWrites=true&w=majority&appName=dental-bot');
    console.log('✅ Conectado a MongoDB');

    await mongoose.connection.db.collection('businesses').dropIndex('phoneNumber_1');
    console.log('✅ Índice "phoneNumber_1" eliminado');

    const indexes = await mongoose.connection.db.collection('businesses').indexes();
    console.log('📋 Índices restantes:', indexes.map(i => i.name));

    await mongoose.disconnect();
    console.log('🔌 Desconectado');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

dropIndex();
