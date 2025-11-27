require('dotenv').config();
const mongoose = require('mongoose');

async function testFixedOnboarding() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB');

    const testData = {
      businessName: "Clínica Test Fixed " + Date.now(),
      legalName: "Clínica Test Fixed S.A. de C.V.",
      rfc: "FIXED123456ABC",
      businessType: "dental",
      whatsappBusiness: "+526149876543",
      contactEmail: "fixed" + Date.now() + "@gmail.com",
      managerPhone: "+526149876543", 
      managerName: "Manager Fixed",
      phoneNumber: "+526149876543",
      addressStreet: "Calle Fixed 789",
      addressCity: "Chihuahua",
      addressPostalCode: "31000",
      plan: "pro",
      businessHours: {
        monday: { active: true, open: "09:00", close: "18:00" },
        tuesday: { active: true, open: "09:00", close: "18:00" },
        wednesday: { active: true, open: "09:00", close: "18:00" },
        thursday: { active: true, open: "09:00", close: "18:00" },
        friday: { active: true, open: "09:00", close: "18:00" },
        saturday: { active: true, open: "09:00", close: "14:00" },
        sunday: { active: false, open: "09:00", close: "14:00" }
      }
    };

    console.log('🚀 Probando endpoint corregido...');
    
    const response = await fetch('http://localhost:3001/api/onboarding-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Status de respuesta:', response.status);
    console.log('📊 Headers:', JSON.stringify(Object.fromEntries(response.headers), null, 2));
    
    const result = await response.json();
    console.log('🎯 RESPUESTA COMPLETA:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('🎉✅ ¡ÉXITO! Negocio creado:');
      console.log('   ID:', result.businessId);
      console.log('   Dashboard:', result.dashboardUrl);
    } else {
      console.log('❌ FALLO:', result.message);
      if (result.errorDetails) {
        console.log('🔍 Detalles:', result.errorDetails);
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('💥 ERROR EN TEST:', error.message);
  }
}

testFixedOnboarding();
