require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');

async function checkAppointments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-bot');
    console.log('🔗 Conectado a MongoDB');
    
    const appointments = await Appointment.find({}).sort({ dateTime: -1 });
    console.log('📊 CITAS EN LA BASE DE DATOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (appointments.length === 0) {
      console.log('❌ No hay citas en la base de datos');
    } else {
      appointments.forEach(apt => {
        console.log(`📅 ID: ${apt._id}`);
        console.log(`   Negocio: ${apt.businessId}`);
        console.log(`   Paciente: ${apt.clientName}`);
        console.log(`   Servicio: ${apt.service}`);
        console.log(`   Fecha: ${apt.dateTime}`);
        console.log(`   Estado: ${apt.status}`);
        console.log(`   Teléfono: ${apt.clientPhone}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      });
    }
    
    console.log(`📈 Total de citas: ${appointments.length}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAppointments();
