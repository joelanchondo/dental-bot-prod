const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

// POST /onboarding - Procesar formulario de registro
router.post('/', async (req, res) => {
  try {
    console.log('🔍 [ONBOARDING] Body completo:', JSON.stringify(req.body, null, 2));

    // MAPEO DE CAMPOS (español → inglés) con manejo de address como objeto
    const businessData = {
      businessType: req.body['Tipo de negocio'],
      businessName: req.body['Nombre del negocio'],
      legalName: req.body['nombre legal'],
      rfc: req.body.rfc,
      managerName: req.body['Nombre del gerente'],
      whatsappBusiness: req.body.WhatsAppNegocio,
      contactEmail: req.body['ContactoCorreo electrónico'],
      plan: req.body.plan,
      salesAgent: req.body['Agente de ventas']
    };

    // Manejar address que viene como objeto
    if (req.body.DIRECCIÓN && typeof req.body.DIRECCIÓN === 'object') {
      businessData.address = [
        req.body.DIRECCIÓN.calle,
        req.body.DIRECCIÓN.ciudad, 
        req.body.DIRECCIÓN.estado,
        req.body.DIRECCIÓN['Código postal']
      ].filter(Boolean).join(', ');
    } else {
      businessData.address = 'Dirección no proporcionada';
    }

    console.log('🔍 [ONBOARDING DEBUG] Datos mapeados:', businessData);

    // VALIDACIONES BÁSICAS
    const errors = [];
    if (!businessData.businessType) errors.push('Tipo de negocio es requerido');
    if (!businessData.businessName) errors.push('Nombre comercial es requerido');
    if (!businessData.managerName) errors.push('Nombre del encargado es requerido');
    if (!businessData.whatsappBusiness) errors.push('WhatsApp Business es requerido');
    if (!businessData.contactEmail) errors.push('Correo electrónico es requerido');

    if (errors.length > 0) {
      console.log('❌ [ONBOARDING] Errores de validación:', errors);
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors
      });
    }

    // CONFIGURACIÓN POR PLAN (simplificada)
    const planConfig = {
      basico: {
        features: { whatsappBot: true, basicAppointments: true },
        services: ['Consulta dental', 'Limpieza dental'],
        schedule: { weekdays: '9:00-18:00', saturday: '9:00-14:00', sunday: 'Cerrado' }
      },
      pro: {
        features: { whatsappBot: true, basicAppointments: true, calendarAccess: true },
        services: ['Consulta', 'Limpieza', 'Extracción', 'Resina'],
        schedule: { weekdays: '8:00-19:00', saturday: '9:00-15:00', sunday: '10:00-13:00' }
      },
      premium: {
        features: { whatsappBot: true, basicAppointments: true, calendarAccess: true, customBranding: true },
        services: ['Consulta', 'Limpieza', 'Extracción', 'Resina', 'Corona', 'Implante'],
        schedule: { weekdays: '8:00-20:00', saturday: '9:00-16:00', sunday: '10:00-14:00' }
      }
    };

    const config = planConfig[businessData.plan] || planConfig.basico;

    // CREAR NEGOCIO (solo campos esenciales)
    const business = new Business({
      businessType: businessData.businessType,
      businessName: businessData.businessName,
      legalName: businessData.legalName,
      rfc: businessData.rfc,
      managerName: businessData.managerName,
      whatsappBusiness: businessData.whatsappBusiness,
      contactEmail: businessData.contactEmail,
      address: businessData.address,
      plan: businessData.plan,
      salesAgent: businessData.salesAgent,
      status: 'active',
      features: config.features,
      services: config.services,
      schedule: config.schedule
    });

    await business.save();
    console.log('✅ [ONBOARDING] Negocio creado:', business._id);

    res.json({
      success: true,
      message: '¡Registro exitoso!',
      businessId: business._id,
      dashboardUrl: `/dashboard/${business._id}`
    });

  } catch (error) {
    console.error('❌ [ONBOARDING] Error completo:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;

// GET /onboarding - Mostrar formulario
router.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Onboarding - Dental Bot</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .form-group { margin: 15px 0; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>📋 Onboarding - Registrar Negocio</h1>
        <form method="POST" action="/onboarding">
            <div class="form-group">
                <label>Tipo de negocio:</label>
                <select name="Tipo de negocio" required>
                    <option value="dental">Dental</option>
                    <option value="medical">Médico</option>
                    <option value="beauty">Belleza</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Nombre del negocio:</label>
                <input type="text" name="Nombre del negocio" required>
            </div>
            
            <div class="form-group">
                <label>WhatsApp Negocio:</label>
                <input type="text" name="WhatsAppNegocio" placeholder="+521234567890" required>
            </div>
            
            <div class="form-group">
                <label>Correo electrónico:</label>
                <input type="email" name="ContactoCorreo electrónico" required>
            </div>
            
            <div class="form-group">
                <label>Plan:</label>
                <select name="plan" required>
                    <option value="basico">Básico</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                </select>
            </div>
            
            <button type="submit">Registrar Negocio</button>
        </form>
    </body>
    </html>
  `);
});

// GET /onboarding - Mostrar formulario de registro
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Registro - Dental Bot</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen py-8">
    <div class="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800">🦷 Registro Dental Bot</h1>
            <p class="text-gray-600">Completa el formulario para activar tu bot de WhatsApp</p>
        </div>

        <form id="onboardingForm" class="space-y-6">
            <!-- Información Básica -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Tipo de negocio *</label>
                    <select name="Tipo de negocio" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500">
                        <option value="dental">Clínica Dental</option>
                        <option value="medical">Consultorio Médico</option>
                        <option value="beauty">Estética</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700">Plan *</label>
                    <select name="plan" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500">
                        <option value="basico">Básico</option>
                        <option value="pro">Pro</option>
                        <option value="premium">Premium</option>
                    </select>
                </div>
            </div>

            <!-- Nombre del Negocio -->
            <div>
                <label class="block text-sm font-medium text-gray-700">Nombre del negocio *</label>
                <input type="text" name="Nombre del negocio" required 
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: Sonrisa Perfecta Dental">
            </div>

            <!-- Información de Contacto -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">WhatsApp Business *</label>
                    <input type="text" name="WhatsAppNegocio" required 
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="+521234567890">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700">Correo electrónico *</label>
                    <input type="email" name="ContactoCorreo electrónico" required 
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="contacto@ejemplo.com">
                </div>
            </div>

            <!-- Información Adicional -->
            <div>
                <label class="block text-sm font-medium text-gray-700">Nombre del gerente/encargado *</label>
                <input type="text" name="Nombre del gerente" required 
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: María González">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Nombre legal</label>
                    <input type="text" name="nombre legal" 
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Razón social">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700">RFC</label>
                    <input type="text" name="rfc" 
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="ABCD123456EFG">
                </div>
            </div>

            <!-- Agente de Ventas -->
            <div>
                <label class="block text-sm font-medium text-gray-700">Agente de ventas *</label>
                <input type="text" name="Agente de ventas" required 
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nombre del vendedor" value="joel anchondo">
            </div>

            <!-- Botón de Envío -->
            <div class="flex justify-center">
                <button type="submit" 
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 flex items-center">
                    <span>🚀 Activar Mi Bot</span>
                </button>
            </div>
        </form>

        <div id="result" class="mt-6 hidden"></div>
    </div>

    <script>
        document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const form = e.target;
            const button = form.querySelector('button[type="submit"]');
            const resultDiv = document.getElementById('result');
            
            // Recoger datos del formulario
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Agregar dirección por defecto
            data.DIRECCIÓN = {
                calle: 'Por definir',
                ciudad: 'Por definir', 
                estado: 'Por definir',
                'Código postal': '00000'
            };

            button.disabled = true;
            button.innerHTML = '⏳ Procesando...';

            try {
                const response = await fetch('/onboarding', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (result.success) {
                    resultDiv.className = 'p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg';
                    resultDiv.innerHTML = \`
                        <h3 class="font-bold">✅ ¡Registro Exitoso!</h3>
                        <p>\${result.message}</p>
                        <p class="mt-2"><strong>ID del negocio:</strong> \${result.businessId}</p>
                        <a href="/dashboard/\${result.businessId}" class="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            Ver Dashboard
                        </a>
                    \`;
                } else {
                    resultDiv.className = 'p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg';
                    resultDiv.innerHTML = \`
                        <h3 class="font-bold">❌ Error en el registro</h3>
                        <p>\${result.message}</p>
                        \${result.errors ? '<ul class="mt-2 list-disc list-inside">' + result.errors.map(error => '<li>' + error + '</li>').join('') + '</ul>' : ''}
                    \`;
                }
            } catch (error) {
                resultDiv.className = 'p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg';
                resultDiv.innerHTML = \`
                    <h3 class="font-bold">❌ Error de conexión</h3>
                    <p>No se pudo conectar con el servidor</p>
                \`;
            } finally {
                button.disabled = false;
                button.innerHTML = '🚀 Activar Mi Bot';
                resultDiv.classList.remove('hidden');
            }
        });
    </script>
</body>
</html>
  `);
});

// GET /onboarding - Mostrar formulario básico
router.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Onboarding - Dental Bot</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .form-group { margin: 15px 0; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input, select { width: 300px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            .required { color: red; }
        </style>
    </head>
    <body>
        <h1>📋 Onboarding - Registrar Negocio</h1>
        <form method="POST" action="/onboarding">
            <div class="form-group">
                <label>Tipo de negocio: <span class="required">*</span></label>
                <select name="Tipo de negocio" required>
                    <option value="dental">Dental</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Nombre del negocio: <span class="required">*</span></label>
                <input type="text" name="Nombre del negocio" required>
            </div>

            <div class="form-group">
                <label>Nombre legal:</label>
                <input type="text" name="nombre legal" placeholder="Razón social">
            </div>

            <div class="form-group">
                <label>RFC:</label>
                <input type="text" name="rfc" placeholder="ABCD123456EFG">
            </div>
            
            <div class="form-group">
                <label>Nombre del gerente: <span class="required">*</span></label>
                <input type="text" name="Nombre del gerente" required placeholder="Ej: María González">
            </div>
            
            <div class="form-group">
                <label>WhatsApp Negocio: <span class="required">*</span></label>
                <input type="text" name="WhatsAppNegocio" placeholder="+526141234567" required>
            </div>
            
            <div class="form-group">
                <label>Correo electrónico: <span class="required">*</span></label>
                <input type="email" name="ContactoCorreo electrónico" required>
            </div>

            <!-- Campos de dirección ocultos con valores por defecto -->
            <input type="hidden" name="DIRECCIÓN[calle]" value="Por definir">
            <input type="hidden" name="DIRECCIÓN[ciudad]" value="Por definir">
            <input type="hidden" name="DIRECCIÓN[estado]" value="Por definir">
            <input type="hidden" name="DIRECCIÓN[Código postal]" value="00000">
            
            <div class="form-group">
                <label>Plan: <span class="required">*</span></label>
                <select name="plan" required>
                    <option value="basico">Básico</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                </select>
            </div>

            <div class="form-group">
                <label>Agente de ventas: <span class="required">*</span></label>
                <input type="text" name="Agente de ventas" value="joel anchondo" required>
            </div>
            
            <button type="submit">Registrar Negocio</button>
        </form>

        <div style="margin-top: 20px; padding: 10px; background: #f0f9ff; border-radius: 5px;">
            <p><strong>Nota:</strong> Los campos marcados con <span class="required">*</span> son obligatorios.</p>
        </div>
    </body>
    </html>
  `);
});
