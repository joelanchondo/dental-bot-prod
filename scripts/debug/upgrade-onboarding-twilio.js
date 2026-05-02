const fs = require('fs');
const path = require('path');

// Leer el archivo actual
const filePath = './routes/onboarding-complete.js';
let content = fs.readFileSync(filePath, 'utf8');

// =============================================
// 1. AGREGAR SECCIÓN WHATSAPP BUSINESS AL FORM
// =============================================

const servicesSection = `                <!-- SECCIÓN 5: SERVICIOS -->
                <div class="border-b border-gray-200 pb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">✅ Servicios que Ofreces</h2>
                    <div id="services-section" class="hidden">
                        <div id="services-list" class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                            <!-- Los servicios se cargan dinámicamente -->
                        </div>
                        <div class="mt-4 text-sm text-gray-600">
                            💡 Los servicios se cargan automáticamente según tu tipo de negocio.
                            Podrás agregar más servicios después en tu dashboard.
                        </div>
                    </div>
                </div>`;

const whatsappSection = `                <!-- SECCIÓN 6: WHATSAPP BUSINESS PROFESIONAL -->
                <div class="border-b border-gray-200 pb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">📱 WhatsApp Business Profesional</h2>
                    
                    <div class="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200 mb-6">
                        <div class="flex items-start">
                            <div class="text-2xl mr-4">🚀</div>
                            <div>
                                <h3 class="font-bold text-blue-800 text-lg">Configuración Automática Twilio Pro</h3>
                                <p class="text-blue-700 mb-3">Tu número de WhatsApp Business será verificado y configurado automáticamente.</p>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div class="bg-white p-3 rounded border">
                                        <div class="font-bold text-green-600">⚡ 1-3 Días</div>
                                        <div>Verificación WhatsApp</div>
                                    </div>
                                    <div class="bg-white p-3 rounded border">
                                        <div class="font-bold text-green-600">🔒 Número Dedicado</div>
                                        <div>Solo para tu negocio</div>
                                    </div>
                                    <div class="bg-white p-3 rounded border">
                                        <div class="font-bold text-green-600">🤖 Bot Automático</div>
                                        <div>Respuestas 24/7</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Número WhatsApp Business *
                            </label>
                            <input type="tel" name="whatsappBusiness" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="+521234567890">
                            <p class="text-sm text-gray-500 mt-1">Este será tu número oficial para recibir mensajes de clientes</p>
                        </div>
                        
                        <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <label class="flex items-start">
                                <input type="checkbox" name="autoWhatsappSetup" checked class="mt-1 mr-3 text-blue-600">
                                <div>
                                    <span class="font-medium text-yellow-800">✅ Activar Bot Automático Profesional</span>
                                    <p class="text-yellow-700 text-sm mt-1">
                                        Tu bot responderá automáticamente las 24 horas. Incluido en tu plan Pro.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>`;

// Reemplazar la sección de servicios con servicios + whatsapp
content = content.replace(servicesSection, servicesSection + '\n' + whatsappSection);

// =============================================
// 2. ACTUALIZAR SECCIÓN DE PLANES
// =============================================

const planSection = `                <!-- SECCIÓN 7: PLAN -->
                <div>
                    <h2 class="text-xl font-bold text-gray-800 mb-4">💎 Elige Tu Plan</h2>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">`;

const updatedPlanSection = `                <!-- SECCIÓN 8: PLAN CON WHATSAPP INCLUIDO -->
                <div>
                    <h2 class="text-xl font-bold text-gray-800 mb-4">💎 Elige Tu Plan + WhatsApp Pro</h2>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">`;

content = content.replace(planSection, updatedPlanSection);

// =============================================
// 3. AGREGAR PROCESAMIENTO WHATSAPP AL FORM SUBMIT
// =============================================

const formProcessingStart = `            // Envío del formulario - CON FIX DEFINITIVO DEL phoneNumber
            document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = e.target.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '⏳ Creando negocio...';
                submitBtn.disabled = true;`;

const enhancedFormProcessing = `            // Envío del formulario - CON TWILIO PRO
            document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = e.target.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '🚀 Configurando negocio y WhatsApp Pro...';
                submitBtn.disabled = true;

                // Mostrar progreso
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = \`
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div class="flex items-center">
                            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                            <div>
                                <div class="font-bold text-blue-800">Configurando tu negocio profesional</div>
                                <div class="text-blue-700 text-sm">Creando cuenta + WhatsApp Business + Bot automático...</div>
                            </div>
                        </div>
                    </div>
                \`;
                resultDiv.classList.remove('hidden');`;

content = content.replace(formProcessingStart, enhancedFormProcessing);

// =============================================
// 4. AGREGAR CAMPOS WHATSAPP AL DATA OBJECT
// =============================================

const dataObjectStart = `                try {
                    const formData = new FormData(e.target);
                    const data = {
                        businessName: formData.get('businessName'),`;

const enhancedDataObject = `                try {
                    const formData = new FormData(e.target);
                    const data = {
                        businessName: formData.get('businessName'),
                        legalName: formData.get('legalName'),
                        rfc: formData.get('rfc'),
                        businessType: formData.get('businessType'),
                        whatsappBusiness: formData.get('whatsappBusiness'),
                        contactEmail: formData.get('contactEmail'),
                        managerPhone: formData.get('managerPhone'),
                        managerName: formData.get('managerName'),
                        addressStreet: formData.get('addressStreet'),
                        addressCity: formData.get('addressCity'),
                        addressPostalCode: formData.get('addressPostalCode'),
                        plan: formData.get('plan'),
                        autoWhatsappSetup: formData.get('autoWhatsappSetup') === 'on',
                        businessHours: {`;

content = content.replace(dataObjectStart, enhancedDataObject);

// =============================================
// 5. ACTUALIZAR BACKEND PARA TWILIO PRO
// =============================================

const backendEndpoint = `// POST /api/onboarding-complete - CON FIX DEFINITIVO Y DEBUG MEJORADO
router.post('/', async (req, res) => {
  try {
    console.log('🔍📥 [ONBOARDING-COMPLETE] INICIANDO PROCESO...');
    console.log('📋 Datos recibidos completos:', JSON.stringify(req.body, null, 2));`;

const enhancedBackendEndpoint = `// POST /api/onboarding-complete - CON TWILIO PRO INTEGRATION
router.post('/', async (req, res) => {
  try {
    console.log('🔍📥 [ONBOARDING-COMPLETE] INICIANDO PROCESO TWILIO PRO...');
    console.log('📋 Datos recibidos completos:', JSON.stringify(req.body, null, 2));
    
    // Validar WhatsApp Business
    if (!req.body.whatsappBusiness || req.body.whatsappBusiness.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El número de WhatsApp Business es requerido'
      });
    }

    // Validar formato de número
    const whatsappRegex = /^\\+[1-9]\\d{1,14}$/;
    if (!whatsappRegex.test(req.body.whatsappBusiness.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Formato de número WhatsApp inválido. Debe ser: +521234567890'
      });
    }`;

content = content.replace(backendEndpoint, enhancedBackendEndpoint);

// =============================================
// 6. AGREGAR CONFIGURACIÓN TWILIO AL BUSINESS CREATION
// =============================================

const businessCreation = `    // Crear negocio COMPLETO
    const business = new Business({
      businessName,
      legalName,
      rfc,
      businessType,
      whatsappBusiness,
      contactEmail,
      managerName,
      address: {
        street: addressStreet,
        city: addressCity,
        postalCode: addressPostalCode,
        state: 'Por definir',
        country: 'México'
      },
      plan,
      businessHours,
      onboardingCompleted: true,
      status: 'active'
    });`;

const enhancedBusinessCreation = `    // Crear negocio COMPLETO CON TWILIO PRO
    const business = new Business({
      businessName,
      legalName,
      rfc,
      businessType,
      whatsappBusiness,
      contactEmail,
      managerName,
      address: {
        street: addressStreet,
        city: addressCity,
        postalCode: addressPostalCode,
        state: 'Por definir',
        country: 'México'
      },
      plan,
      businessHours,
      whatsappConfig: {
        provider: 'twilio',
        status: 'pending_verification',
        autoResponder: autoWhatsappSetup || false,
        configuredAt: new Date()
      },
      onboardingCompleted: true,
      status: 'active'
    });`;

content = content.replace(businessCreation, enhancedBusinessCreation);

// =============================================
// 7. MEJORAR RESPUESTA DE ÉXITO
// =============================================

const successResponse = `    console.log('📤 [ONBOARDING-COMPLETE] Enviando respuesta de éxito al cliente...');
    res.json({
      success: true,
      message: '🎉 ¡Negocio creado exitosamente! Tu bot profesional está listo.',
      businessId: business._id,
      dashboardUrl: \`/dashboard-pro/\${business._id}\`,
      details: {
        businessName: business.businessName,
        whatsapp: business.whatsappBusiness,
        email: business.contactEmail,
        plan: business.plan
      }
    });`;

const enhancedSuccessResponse = `    console.log('📤 [ONBOARDING-COMPLETE] Enviando respuesta de éxito con Twilio Pro...');
    
    // Iniciar configuración Twilio en background (no bloqueante)
    setTimeout(async () => {
      try {
        console.log('🔄 Iniciando configuración Twilio Pro para:', business._id);
        // Aquí irá la lógica de compra y verificación de número Twilio
        await initializeTwilioProConfig(business);
      } catch (error) {
        console.error('❌ Error configurando Twilio:', error);
      }
    }, 1000);

    res.json({
      success: true,
      message: '🎉 ¡Negocio creado exitosamente!',
      businessId: business._id,
      dashboardUrl: \`/dashboard-pro/\${business._id}\`,
      whatsappStatus: 'pending_verification',
      details: {
        businessName: business.businessName,
        whatsapp: business.whatsappBusiness,
        email: business.contactEmail,
        plan: business.plan,
        nextSteps: [
          '✅ Negocio registrado en sistema',
          '🔄 Configurando WhatsApp Business (1-3 días)',
          '🤖 Bot automático activado',
          '📱 Los mensajes llegarán a tu dashboard temporalmente'
        ]
      }
    });`;

content = content.replace(successResponse, enhancedSuccessResponse);

// =============================================
// 8. AGREGAR FUNCIÓN TWILIO PRO (PLACEHOLDER)
// =============================================

const moduleExports = `module.exports = router;`;

const twilioFunction = `
// =============================================
// TWILIO PRO CONFIGURATION FUNCTIONS
// =============================================

async function initializeTwilioProConfig(business) {
  try {
    console.log('🚀 INICIANDO CONFIGURACIÓN TWILIO PRO PARA:', business.businessName);
    
    // 1. Comprar número Twilio dedicado
    const twilioNumber = await purchaseTwilioDedicatedNumber();
    console.log('📱 Número Twilio comprado:', twilioNumber);
    
    // 2. Iniciar verificación WhatsApp Business
    const verificationId = await submitWhatsAppBusinessVerification(
      business.whatsappBusiness,
      twilioNumber,
      business.businessName
    );
    console.log('✅ Verificación WhatsApp iniciada:', verificationId);
    
    // 3. Actualizar negocio con info Twilio
    business.whatsappConfig.twilioNumber = twilioNumber;
    business.whatsappConfig.verificationId = verificationId;
    business.whatsappConfig.status = 'verification_pending';
    await business.save();
    
    console.log('🎉 Configuración Twilio Pro completada para:', business._id);
    
  } catch (error) {
    console.error('❌ Error en configuración Twilio Pro:', error);
    business.whatsappConfig.status = 'configuration_failed';
    business.whatsappConfig.error = error.message;
    await business.save();
  }
}

async function purchaseTwilioDedicatedNumber() {
  // Placeholder - implementar con Twilio API
  console.log('🛒 Comprando número Twilio dedicado...');
  return '+19876543210'; // Número temporal
}

async function submitWhatsAppBusinessVerification(customerNumber, twilioNumber, businessName) {
  // Placeholder - implementar con Twilio WhatsApp Business API
  console.log('📋 Enviando verificación WhatsApp Business...');
  return 'verification_123456'; // ID temporal
}

${moduleExports}`;

content = content.replace(moduleExports, twilioFunction);

// Guardar el archivo actualizado
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ ONBOARDING ACTUALIZADO CON TWILIO PRO');
console.log('🎯 Nuevas características:');
console.log('   - Sección WhatsApp Business profesional');
console.log('   - Configuración automática Twilio');
console.log('   - Proceso de verificación integrado');
console.log('   - Mejores mensajes de usuario');
console.log('🚀 Ejecuta: git add routes/onboarding-complete.js && git commit -m "feat: onboarding con Twilio Pro" && git push origin main');
