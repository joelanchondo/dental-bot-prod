require('dotenv').config();
const aiService = require('./services/aiService');
const Business = require('./models/Business');
const mongoose = require('mongoose');

async function testAI() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-bot');
    console.log('✅ Conectado\n');

    // Obtener el negocio de prueba
    const business = await Business.findOne({ businessName: 'Clínica Dental Sonrisas' });
    
    if (!business) {
      console.log('❌ No se encontró el negocio de prueba');
      return;
    }

    console.log(`🏥 Probando IA con: ${business.businessName}`);
    console.log(`📦 Plan: ${business.plan}\n`);

    // Actualizar a premium para probar IA
    business.plan = 'premium';
    business.features.paymentGateway = true;
    await business.save();
    console.log('✅ Negocio actualizado a PREMIUM\n');

    // Pruebas
    const tests = [
      {
        name: 'Saludo inicial',
        message: 'Hola, buenos días'
      },
      {
        name: 'Consulta de precios',
        message: '¿Cuánto cuesta una limpieza dental?'
      },
      {
        name: 'Intento fuera de contexto (debe rechazar)',
        message: '¿Cuánto cuesta cambiar el aceite de mi coche?'
      },
      {
        name: 'Agendar cita',
        message: 'Quiero agendar una cita para mañana'
      }
    ];

    for (const test of tests) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 TEST: ${test.name}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`👤 Cliente: ${test.message}\n`);

      const response = await aiService.processMessage(
        business,
        [], // Sin historial previo
        test.message
      );

      if (response.success) {
        console.log(`🤖 Bot: ${response.response}`);
        console.log(`\n💰 Uso:`);
        console.log(`   Input tokens: ${response.usage.inputTokens}`);
        console.log(`   Output tokens: ${response.usage.outputTokens}`);
        const cost = aiService.calculateCost(response.usage);
        console.log(`   Costo: $${cost.totalCostMXN.toFixed(4)} MXN`);
      } else {
        console.log(`❌ Error: ${response.error}`);
      }

      // Esperar 1 segundo entre pruebas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Pruebas completadas');
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado');
  }
}

testAI();
