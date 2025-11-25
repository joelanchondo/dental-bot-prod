// testCalendarSetup.js
require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./models/Business');
const Appointment = require('./models/Appointment');

async function setupTestData() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-bot');
    console.log('✅ Conectado a MongoDB');

    // 1. Crear negocio de prueba PRO
    console.log('\n📋 Creando negocio de prueba...');
    
    const testBusiness = await Business.create({
      businessType: 'dental',
      businessName: 'Clínica Dental Sonrisas',
      legalName: 'Sonrisas Dentales SA de CV',
      rfc: 'SDC123456789',
      managerName: 'Dr. Juan Pérez',
      whatsappBusiness: '+5212345678901',
      contactEmail: 'contacto@sonrisas.com',
      address: {
        street: 'Av. Reforma 123',
        city: 'Ciudad de México',
        state: 'CDMX',
        postalCode: '06600',
        country: 'México'
      },
      services: [
        { name: 'Limpieza Dental', duration: 30, price: 500, active: true },
        { name: 'Revisión General', duration: 20, price: 300, active: true },
        { name: 'Blanqueamiento', duration: 60, price: 2000, active: true },
        { name: 'Ortodoncia Consulta', duration: 45, price: 800, active: true },
        { name: 'Extracción', duration: 30, price: 600, active: true }
      ],
      businessHours: {
        monday: { open: '09:00', close: '18:00', active: true },
        tuesday: { open: '09:00', close: '18:00', active: true },
        wednesday: { open: '09:00', close: '18:00', active: true },
        thursday: { open: '09:00', close: '18:00', active: true },
        friday: { open: '09:00', close: '18:00', active: true },
        saturday: { open: '10:00', close: '14:00', active: true },
        sunday: { open: '00:00', close: '00:00', active: false }
      },
      plan: 'pro', // PRO para probar calendario
      status: 'active',
      onboardingCompleted: true
    });

    console.log('✅ Negocio creado:', testBusiness.businessName);
    console.log('   ID:', testBusiness._id);
    console.log('   Plan:', testBusiness.plan);

    // 2. Crear citas de prueba
    console.log('\n📅 Creando citas de prueba...');
    
    const today = new Date();
    const appointments = [];

    // Cita para hoy
    appointments.push({
      businessId: testBusiness._id,
      clientName: 'María García',
      clientPhone: '+5211234567890',
      clientEmail: 'maria@email.com',
      service: 'Limpieza Dental',
      dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
      duration: 30,
      status: 'confirmed',
      notes: 'Primera vez',
      payment: {
        required: true,
        amount: 500,
        status: 'paid',
        method: 'card'
      }
    });

    // Cita para hoy - tarde
    appointments.push({
      businessId: testBusiness._id,
      clientName: 'Carlos López',
      clientPhone: '+5211234567891',
      service: 'Revisión General',
      dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30),
      duration: 20,
      status: 'pending',
      notes: 'Dolor de muelas'
    });

    // Citas para mañana
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    appointments.push({
      businessId: testBusiness._id,
      clientName: 'Ana Martínez',
      clientPhone: '+5211234567892',
      service: 'Blanqueamiento',
      dateTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0),
      duration: 60,
      status: 'confirmed',
      payment: {
        required: true,
        amount: 2000,
        status: 'pending',
        method: 'none'
      }
    });

    // Citas para la próxima semana
    for (let i = 2; i <= 7; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i);
      
      appointments.push({
        businessId: testBusiness._id,
        clientName: `Cliente ${i}`,
        clientPhone: `+521123456789${i}`,
        service: ['Limpieza Dental', 'Revisión General', 'Ortodoncia Consulta'][i % 3],
        dateTime: new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), 10 + (i % 7), 0),
        duration: 30,
        status: ['pending', 'confirmed', 'confirmed'][i % 3],
      });
    }

    // Citas del mes pasado (completadas)
    for (let i = 1; i <= 5; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - (7 * i));
      
      appointments.push({
        businessId: testBusiness._id,
        clientName: `Cliente Anterior ${i}`,
        clientPhone: `+521987654321${i}`,
        service: ['Limpieza Dental', 'Revisión General'][i % 2],
        dateTime: new Date(pastDate.getFullYear(), pastDate.getMonth(), pastDate.getDate(), 14, 0),
        duration: 30,
        status: 'completed',
        payment: {
          required: true,
          amount: 500,
          status: 'paid',
          method: 'cash'
        }
      });
    }

    // Crear todas las citas
    const createdAppointments = await Appointment.insertMany(appointments);
    console.log(`✅ ${createdAppointments.length} citas creadas`);

    // Mostrar resumen
    console.log('\n📊 RESUMEN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Negocio: ${testBusiness.businessName}`);
    console.log(`ID del negocio: ${testBusiness._id}`);
    console.log(`Plan: ${testBusiness.plan}`);
    console.log(`Total de citas: ${createdAppointments.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 URLs para probar:');
    console.log(`📅 Calendario: http://localhost:3001/dashboard/calendar?businessId=${testBusiness._id}`);
    console.log(`📊 API Resumen: http://localhost:3001/dashboard/api/calendar/month-summary?businessId=${testBusiness._id}`);
    console.log(`🔍 Buscar: http://localhost:3001/dashboard/api/calendar/search?businessId=${testBusiness._id}&query=maria`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Guardar ID en un archivo para fácil acceso
    const fs = require('fs');
    fs.writeFileSync('test-business-id.txt', testBusiness._id.toString());
    console.log('\n💾 ID guardado en: test-business-id.txt');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

// Ejecutar
setupTestData();
