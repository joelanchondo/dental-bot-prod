const mongoose = require('mongoose');
require('dotenv').config();

async function fixBusiness() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Business = require('./models/Business');
    
    // Encontrar el negocio DEMO
    const business = await Business.findOne({ name: /DEMO/ });
    
    if (!business) {
      console.log('❌ No se encontró el negocio DEMO');
      return;
    }

    console.log(`📊 Negocio encontrado: ${business.name}`);
    
    // Corregir los campos que fallan la validación
    if (!business.phoneNumber) {
      business.phoneNumber = business.phone || '+1234567890';
      console.log('✅ phoneNumber corregido:', business.phoneNumber);
    }
    
    // Si el plan es 'profesional', cambiarlo a 'premium' o mantenerlo si actualizamos el modelo
    if (business.plan === 'profesional') {
      // Podemos cambiarlo a 'premium' o actualizar el modelo para aceptar 'profesional'
      // business.plan = 'premium';
      console.log('ℹ️  Plan actual:', business.plan);
    }
    
    // Si el status es 'trial', cambiarlo a 'active' o mantenerlo si actualizamos el modelo
    if (business.status === 'trial') {
      // business.status = 'active';
      console.log('ℹ️  Status actual:', business.status);
    }
    
    // Agregar WhatsApp configuration
    business.whatsapp = {
      number: '+14155238886',
      twilioSid: 'AC6177a02e055c189efbff4a94dd222dfd',
      twilioToken: '50a544fabd3a16667e1129acc940910f',
      isActive: true
    };
    
    console.log('🔄 Guardando cambios...');
    await business.save();
    
    console.log('✅ Negocio corregido exitosamente!');
    console.log('📞 Teléfono:', business.phone);
    console.log('📱 WhatsApp Number:', business.whatsapp.number);
    console.log('📊 Plan:', business.plan);
    console.log('🔧 Status:', business.status);
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

fixBusiness();
