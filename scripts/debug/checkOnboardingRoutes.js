const express = require('express');
const app = express();

console.log('🛣️ RUTAS DE ONBOARDING DISPONIBLES:');
console.log('====================================');
console.log('1. /api/onboarding - (routes/onboarding.js)');
console.log('2. /api/onboarding-enhanced - (routes/onboarding-enhanced.js)');
console.log('3. /api/onboarding-complete - (routes/onboarding-complete.js)');
console.log('');
console.log('📝 Para crear un negocio, usa alguna de estas URLs:');
console.log('   POST /api/onboarding');
console.log('   POST /api/onboarding-enhanced');
console.log('   POST /api/onboarding-complete');
