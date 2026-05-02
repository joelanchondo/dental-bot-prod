const mongoose = require('mongoose');
const Business = require('./models/Business');
require('dotenv').config();

async function createTestClient() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const testBusiness = new Business({
      name: 'Clínica Dental Sonrisas - DEMO',
      owner: 'Dr. Juan Pérez',
      phone: '614 123 4567',
      email: 'contacto@dentalsonrisas.com',
      address: 'Av. Universidad 1234, Col. San Felipe, Chihuahua, Chih.',
      
      plan: 'profesional',
      
      whatsapp: {
        number: '+14155238886',
        twilioSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        twilioToken: 'your_auth_token_here',
        isActive: false
      },
      
      schedule: {
        weekdays: '9:00 AM - 6:00 PM',
        saturday: '9:00 AM - 2:00 PM',
        sunday: 'Cerrado'
      },
      
      services: [
        'Limpieza dental',
        'Ortodoncia',
        'Endodoncia',
        'Implantes dentales',
        'Blanqueamiento',
        'Extracción de muelas'
      ],
      
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      
      messages: {
        welcome: '¡Hola! 👋 Soy el asistente virtual de *Clínica Dental Sonrisas*.\n\n¿En qué puedo ayudarte?\n\n• Agendar cita\n• Consultar mi cita\n• Servicios\n• Ubicación y horario'
      }
    });

    await testBusiness.save();
    
    console.log('\n✅ Cliente de prueba creado exitosamente!');
    console.log('\n📋 Datos del cliente:');
    console.log('ID:', testBusiness._id);
    console.log('Nombre:', testBusiness.name);
    console.log('Plan:', testBusiness.plan);
    console.log('Estado:', testBusiness.status);
    console.log('\n💡 Guarda este ID para usarlo en las pruebas\n');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createTestClient();
