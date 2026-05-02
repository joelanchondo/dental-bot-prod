require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./models/Business');

async function identifyBusinesses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB');
    
    const businesses = await Business.find({});
    console.log('🏢 NEGOCIOS IDENTIFICADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    businesses.forEach(business => {
      console.log(`📋 ID: ${business._id}`);
      console.log(`   Nombre: ${business.businessName}`);
      console.log(`   Tipo: ${business.businessType}`);
      console.log(`   WhatsApp: ${business.whatsappBusiness}`);
      console.log(`   Email: ${business.contactEmail}`);
      console.log(`   Plan: ${business.plan}`);
      console.log(`   Estado: ${business.status}`);
      console.log(`   Creado: ${business.createdAt}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
    
    // Contar citas por negocio
    const Appointment = require('./models/Appointment');
    
    for (const business of businesses) {
      const appointmentCount = await Appointment.countDocuments({ businessId: business._id });
      console.log(`📊 ${business.businessName}: ${appointmentCount} citas`);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

identifyBusinesses();
