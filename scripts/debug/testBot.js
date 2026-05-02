const mongoose = require('mongoose');
const Business = require('./models/Business');
const { processBotMessage } = require('./services/botService');
require('dotenv').config();

async function testBot() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB\n');

  const business = await Business.findOne({ name: /DEMO/ });
  
  if (!business) {
    console.log('❌ No se encontró el cliente de prueba');
    console.log('Ejecuta primero: node createTestClient.js');
    await mongoose.connection.close();
    return;
  }

  console.log('🤖 Probando bot para:', business.name);
  console.log('Plan:', business.plan);
  console.log('\n--- SIMULACIÓN DE CHAT ---\n');

  const testMessages = [
    'Hola',
    '¿Qué servicios ofrecen?',
    'Quiero agendar una cita',
    '¿Cuál es su horario?',
    '¿Dónde están ubicados?'
  ];

  for (const msg of testMessages) {
    console.log('👤 Usuario:', msg);
    const response = await processBotMessage(business, msg, '6141234567');
    console.log('🤖 Bot:', response);
    console.log('\n' + '─'.repeat(50) + '\n');
  }

  await mongoose.connection.close();
  console.log('✅ Prueba completada');
}

testBot();
