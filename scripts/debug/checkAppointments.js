const mongoose = require('mongoose');
require('dotenv').config();

async function checkAppointments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Appointment = require('./models/Appointment');
    const appointments = await Appointment.find({}).populate('businessId');

    console.log(`📅 Total de citas: ${appointments.length}`);

    appointments.forEach((appointment, index) => {
      console.log(`\n--- Cita ${index + 1} ---`);
      console.log('ID:', appointment._id);
      console.log('Negocio:', appointment.businessId?.businessName || 'Sin negocio');
      console.log('Cliente:', appointment.clientName);
      console.log('Teléfono:', appointment.clientPhone);
      console.log('Servicio:', appointment.service);
      console.log('Fecha:', appointment.date);
      console.log('Hora:', appointment.time);
      console.log('Estado:', appointment.status);
      console.log('Creado:', appointment.createdAt);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAppointments();
