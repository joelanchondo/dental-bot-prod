const mongoose = require('mongoose');

// Asume que tienes el modelo Business en models/Business.js
const Business = require('./models/Business');  // Ajusta la ruta si es diferente (ej: './models/business')

async function checkBusiness() {
  try {
    await mongoose.connect('mongodb+srv://joelanchondo_db_user:Bubu2516%21@dental-bot.1xcbxyh.mongodb.net/dental-bot?retryWrites=true&w=majority&appName=dental-bot');
    console.log('✅ Conectado a MongoDB');

    const business = await Business.findById('69287f072c46c48fcee4168b');
    if (business) {
      console.log('📋 Negocio encontrado:');
      console.log('- ID:', business._id);
      console.log('- Nombre:', business.name || 'No definido');
      console.log('- Teléfono WhatsApp:', business.whatsappBusiness || 'No definido');
      console.log('- Dirección:', business.address || 'No definido');
      console.log('- Descripción:', business.description || 'No definido');
      console.log('- Fecha de creación:', business.createdAt || 'No definido');
      // Agrega más campos si los tienes en el esquema
    } else {
      console.log('❌ Negocio no encontrado con ese ID');
    }

    await mongoose.disconnect();
    console.log('🔌 Desconectado');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBusiness();
