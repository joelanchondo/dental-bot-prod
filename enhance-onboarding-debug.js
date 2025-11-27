const fs = require('fs');

// Leer el archivo
const filePath = './routes/onboarding-complete.js';
let content = fs.readFileSync(filePath, 'utf8');

// Agregar mejor logging al endpoint POST
const postEndpoint = `// POST /api/onboarding-complete - CON FIX DEFINITIVO
router.post('/', async (req, res) => {
  try {
    console.log('📥 [ONBOARDING-COMPLETE] Datos recibidos:', JSON.stringify(req.body, null, 2));`;

const enhancedPostEndpoint = `// POST /api/onboarding-complete - CON FIX DEFINITIVO Y DEBUG MEJORADO
router.post('/', async (req, res) => {
  try {
    console.log('🔍📥 [ONBOARDING-COMPLETE] INICIANDO PROCESO...');
    console.log('📋 Datos recibidos completos:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));`;

content = content.replace(postEndpoint, enhancedPostEndpoint);

// Agregar más logging antes de guardar
const beforeSave = `    await business.save();
    console.log('✅ [ONBOARDING-COMPLETE] Negocio creado EXITOSAMENTE:', business._id);`;

const enhancedBeforeSave = `    console.log('💾 [ONBOARDING-COMPLETE] Guardando negocio en MongoDB...');
    await business.save();
    console.log('🎉✅ [ONBOARDING-COMPLETE] NEGOCIO CREADO EXITOSAMENTE!');
    console.log('   📍 ID:', business._id);
    console.log('   🏢 Nombre:', business.businessName);
    console.log('   📞 WhatsApp:', business.whatsappBusiness);
    console.log('   📧 Email:', business.contactEmail);`;

content = content.replace(beforeSave, enhancedBeforeSave);

// Mejorar el response de éxito
const successResponse = `    res.json({
      success: true,
      message: 'Negocio creado exitosamente con toda la información',
      businessId: business._id,
      dashboardUrl: \`/dashboard-pro/\${business._id}\`
    });`;

const enhancedSuccessResponse = `    console.log('📤 [ONBOARDING-COMPLETE] Enviando respuesta de éxito al cliente...');
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

content = content.replace(successResponse, enhancedSuccessResponse);

// Mejorar manejo de errores
const errorHandler = `  } catch (error) {
    console.error('❌ [ONBOARDING-COMPLETE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor: ' + error.message
    });
  }`;

const enhancedErrorHandler = `  } catch (error) {
    console.error('🚨❌ [ONBOARDING-COMPLETE] ERROR CRÍTICO:', error);
    console.error('🔍 Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: '❌ Error al crear el negocio: ' + error.message,
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }`;

content = content.replace(errorHandler, enhancedErrorHandler);

// Guardar el archivo mejorado
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Debug mejorado agregado a onboarding-complete.js');
