const mongoose = require('mongoose');
const Business = require('./models/Business');

async function verificarAllBusinessesDetailed() {
  try {
    await mongoose.connect('mongodb+srv://joelanchondo_db_user:Bubu2516%21@dental-bot.1xcbxyh.mongodb.net/dental-bot?retryWrites=true&w=majority&appName=dental-bot');
    console.log('✅ Conectado a MongoDB');

    const businesses = await Business.find({});
    console.log('Total de negocios:', businesses.length);
    businesses.forEach((business, index) => {
      console.log();
      console.log(JSON.stringify(business, null, 2));  // Muestra todo el objeto completo
    });

    await mongoose.disconnect();
    console.log('🔌 Desconectado');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verificarAllBusinessesDetailed();
