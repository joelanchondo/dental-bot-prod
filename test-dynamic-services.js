const mongoose = require('mongoose');
const Business = require('./models/Business');
require('dotenv').config();

async function testDynamicServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-bot');
    
    // Buscar un negocio existente
    const business = await Business.findOne().select('businessName services slug');
    
    if (!business) {
      console.log('❌ No hay negocios en la base de datos');
      return;
    }
    
    console.log(`📋 Negocio: ${business.businessName}`);
    console.log(`🔗 Slug: ${business.slug}`);
    console.log(`📊 Servicios registrados: ${business.services?.length || 0}`);
    
    // Mostrar servicios actuales
    if (business.services && business.services.length > 0) {
      console.log('\n📦 Servicios actuales:');
      business.services.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name} - $${service.price} (${service.active ? 'Activo' : 'Inactivo'})`);
      });
    } else {
      console.log('\n⚠️ Este negocio no tiene servicios definidos.');
      console.log('📝 Ve a /dashboard-pro y agrega servicios para que aparezcan en el bot.');
    }
    
    // Test del botMenuGenerator
    console.log('\n🧪 Test de botMenuGenerator:');
    const { generateServiceMenu } = require('./utils/botMenuGenerator');
    const menu = generateServiceMenu(business);
    console.log('Menú generado:\n');
    console.log(menu);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDynamicServices();
