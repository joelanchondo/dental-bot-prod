const mongoose = require('mongoose');

// Asume que tienes el modelo Business en models/Business.js
const Business = require('./models/Business');  // Ajusta la ruta si es diferente (ej: './models/business')

async function verificarAllBusinesses() {
  try {
    await mongoose.connect('mongodb+srv://joelanchondo_db_user:Bubu2516%21@dental-bot.1xcbxyh.mongodb.net/dental-bot?retryWrites=true&w=majority&appName=dental-bot');
    console.log('✅ Conectado a MongoDB');

    const businesses = await Business.find({});
    if (businesses.length > 0) {
      console.log('📋 Todos los negocios encontrados:');
      businesses.forEach((business, index) => {
        console.log();
        console.log('- ID:', business._id);
        console.log('- Nombre:', business.name || 'No definido');
        console.log('- Teléfono WhatsApp:', business.whatsappBusiness || 'No definido');
        console.log('- Dirección:', business.address || 'No definido');
        console.log('- Descripción:', business.description || 'No definido');
        console.log('- Fecha de creación:', business.createdAt || 'No definido');
        // Agrega más campos si los tienes en el esquema
      });
    } else {
      console.log('❌ No hay negocios en la base de datos');
    }

    await mongoose.disconnect();
    console.log('🔌 Desconectado');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verificarAllBusinesses();
