require('dotenv').config();
const mongoose = require('mongoose');

async function checkOrphanAppointments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Business = require('./models/Business');
    const Appointment = require('./models/Appointment');
    
    // Obtener todos los businessId únicos de las citas
    const appointments = await Appointment.find({});
    const businessIdsInAppointments = [...new Set(appointments.map(apt => apt.businessId.toString()))];
    
    // Obtener todos los businessId existentes
    const existingBusinesses = await Business.find({});
    const existingBusinessIds = existingBusinesses.map(b => b._id.toString());
    
    console.log('🔍 DIAGNÓSTICO DE DATOS:');
    console.log(`📊 Business IDs en citas: ${businessIdsInAppointments.length}`);
    console.log(`📊 Business IDs existentes: ${existingBusinessIds.length}`);
    
    // Encontrar businessIds huérfanos
    const orphanBusinessIds = businessIdsInAppointments.filter(id => !existingBusinessIds.includes(id));
    
    if (orphanBusinessIds.length > 0) {
      console.log('\n❌ BUSINESS IDs HUÉRFANOS (en citas pero no existen):');
      orphanBusinessIds.forEach(id => {
        const orphanAppointments = appointments.filter(apt => apt.businessId.toString() === id);
        console.log(`   ID: ${id} - ${orphanAppointments.length} citas`);
      });
    } else {
      console.log('\n✅ No hay business IDs huérfanos');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkOrphanAppointments();
