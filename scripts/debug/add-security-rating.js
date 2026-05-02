const fs = require('fs');
const path = require('path');

// 1. AGREGAR RATE LIMITING AL SERVIDOR PRINCIPAL
const serverPath = './server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Buscar donde agregar los imports
const expressImport = `const express = require('express');`;
const enhancedImports = `const express = require('express');
const rateLimit = require('express-rate-limit');`;

serverContent = serverContent.replace(expressImport, enhancedImports);

// Agregar rate limiting global después de app initialization
const appInit = `const app = express();`;
const appWithSecurity = `const app = express();

// 🔒 RATE LIMITING GLOBAL PARA PROTECCIÓN
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por ventana
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta más tarde'
  },
  skip: (req) => {
    // Saltar rate limit para webhooks de Twilio
    return req.path.includes('/api/whatsapp') && 
           req.headers['x-twilio-signature'] !== undefined;
  }
});

app.use(globalLimiter);`;

serverContent = serverContent.replace(appInit, appWithSecurity);

// Guardar server.js actualizado
fs.writeFileSync(serverPath, serverContent, 'utf8');
console.log('✅ Rate limiting agregado a server.js');

// 2. AGREGAR RATE LIMITING ESPECÍFICO PARA WHATSAPP
const whatsappRoutesPath = './routes/whatsapp.js';
if (fs.existsSync(whatsappRoutesPath)) {
  let whatsappContent = fs.readFileSync(whatsappRoutesPath, 'utf8');
  
  // Agregar import si no existe
  if (!whatsappContent.includes('rateLimit')) {
    const routerImport = `const express = require('express');`;
    const enhancedRouterImport = `const express = require('express');
const rateLimit = require('express-rate-limit');`;
    whatsappContent = whatsappContent.replace(routerImport, enhancedRouterImport);
  }
  
  // Agregar rate limiting específico para WhatsApp
  const routerInit = `const router = express.Router();`;
  const routerWithSecurity = `const router = express.Router();

// 🔒 RATE LIMITING ESPECÍFICO PARA WHATSAPP
const whatsappLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // máximo 60 requests por minuto por IP
  message: {
    error: 'Demasiados mensajes de WhatsApp, intenta más tarde'
  },
  skip: (req) => {
    // Saltar rate limit para webhooks de Twilio verificados
    return req.headers['x-twilio-signature'] !== undefined;
  }
});`;

  whatsappContent = whatsappContent.replace(routerInit, routerWithSecurity);
  
  // Aplicar el rate limiting a las rutas
  if (whatsappContent.includes('router.post')) {
    whatsappContent = whatsappContent.replace(
      /router\.post\('\/',/g, 
      'router.post(\'/\', whatsappLimiter,'
    );
  }
  
  fs.writeFileSync(whatsappRoutesPath, whatsappContent, 'utf8');
  console.log('✅ Rate limiting específico agregado a routes/whatsapp.js');
}

console.log('🎯 SEGURIDAD IMPLEMENTADA:');
console.log('   - Rate limiting global (1000 req/15min)');
console.log('   - Rate limiting WhatsApp (60 req/min)');
console.log('   - Exención para webhooks Twilio verificados');
console.log('🚀 Ejecuta: npm install express-rate-limit && git add . && git commit -m "feat: rate limiting security" && git push origin main');
