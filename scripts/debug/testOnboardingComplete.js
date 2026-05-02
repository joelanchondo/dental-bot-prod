require('dotenv').config();
const mongoose = require('mongoose');

async function testOnboarding() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB');

    const testData = {
      businessName: "Clínica Dental Test " + Date.now(),
      legalName: "Clínica Dental Test S.A. de C.V.",
      rfc: "TEST123456ABC",
      businessType: "dental", 
      whatsappBusiness: "+526141234567",
      contactEmail: "test" + Date.now() + "@gmail.com",
      managerPhone: "+526141234567",
      managerName: "Manager Test",
      phoneNumber: "+526141234567",
      addressStreet: "Calle Test 123",
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

    console.log('📤 Enviando datos de prueba...');
    
    const response = await fetch('http://localhost:3001/api/onboarding-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('📥 Respuesta del servidor:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Negocio creado exitosamente!');
      console.log('ID:', result.businessId);
    } else {
      console.log('❌ Error:', result.message);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

// Si estamos en el servidor de Render, usar la URL correcta
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Ejecutando en producción - Render');
} else {
  console.log('💻 Ejecutando en local');
}

testOnboarding();
