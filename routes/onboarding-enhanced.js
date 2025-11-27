const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const serviceCatalogs = require('../config/service-catalogs');

// GET /onboarding-enhanced - Formulario CORREGIDO
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Onboarding Mejorado - Crear Negocio</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <div class="bg-white rounded-2xl shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">🚀 Crear Nuevo Negocio</h1>
            <p class="text-gray-600 mb-8">Completa la información para activar tu bot automáticamente</p>
            
            <form id="onboardingForm" class="space-y-6">
                <!-- Información Básica -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Negocio *</label>
                        <input type="text" name="businessName" required 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Negocio *</label>
                        <select name="businessType" required 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onchange="updateServices(this.value)">
                            <option value="">Selecciona un tipo</option>
                            <option value="medical">🏥 Médico</option>
                            <option value="dental">🦷 Dental</option>
                            <option value="spa">💆 Spa & Salud</option>
                            <option value="nails">💅 Uñas & Belleza</option>
                            <option value="barbershop">💈 Barbería</option>
                            <option value="automotive">🚗 Servicio Mecánico</option>
                            <option value="food">🍕 Nutrición & Comida</option>
                            <option value="other">⚡ Otro</option>
                        </select>
                    </div>
                </div>

                <!-- Contacto -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">WhatsApp Business *</label>
                        <input type="tel" name="whatsappBusiness" placeholder="+525511223344" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                        <input type="email" name="contactEmail" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                </div>

                <!-- Servicios del Catálogo -->
                <div id="services-section" class="hidden">
                    <label class="block text-sm font-medium text-gray-700 mb-4">✅ Servicios Incluidos (selecciona los que ofreces)</label>
                    <div id="services-list" class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                        <!-- Los servicios se cargan dinámicamente -->
                    </div>
                </div>

                <!-- Plan -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-4">💎 Plan *</label>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <label class="relative">
                            <input type="radio" name="plan" value="basic" class="sr-only" required>
                            <div class="border-2 border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 plan-card">
                                <div class="font-bold text-gray-800">Básico</div>
                                <div class="text-2xl font-bold text-blue-600">$299<sub>/mes</sub></div>
                                <div class="text-xs text-gray-600 mt-2">Bot Básico + 5 servicios</div>
                            </div>
                        </label>
                        <label class="relative">
                            <input type="radio" name="plan" value="pro" class="sr-only">
                            <div class="border-2 border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 plan-card">
                                <div class="font-bold text-gray-800">Pro</div>
                                <div class="text-2xl font-bold text-green-600">$599<sub>/mes</sub></div>
                                <div class="text-xs text-gray-600 mt-2">Dashboard + Calendario</div>
                            </div>
                        </label>
                        <label class="relative">
                            <input type="radio" name="plan" value="premium" class="sr-only">
                            <div class="border-2 border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 plan-card">
                                <div class="font-bold text-gray-800">Premium</div>
                                <div class="text-2xl font-bold text-purple-600">$999<sub>/mes</sub></div>
                                <div class="text-xs text-gray-600 mt-2">+ Pagos Online</div>
                            </div>
                        </label>
                        <label class="relative">
                            <input type="radio" name="plan" value="demo" class="sr-only">
                            <div class="border-2 border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-yellow-500 plan-card">
                                <div class="font-bold text-gray-800">Demo</div>
                                <div class="text-2xl font-bold text-yellow-600">Gratis</div>
                                <div class="text-xs text-gray-600 mt-2">3 días prueba</div>
                            </div>
                        </label>
                    </div>
                </div>

                <button type="submit" 
                    class="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-blue-700 transition duration-200">
                    🚀 Activar Mi Bot Automáticamente
                </button>
            </form>

            <div id="result" class="mt-6 hidden"></div>
        </div>
    </div>

    <script>
        const serviceCatalogs = ${JSON.stringify(serviceCatalogs)};

        function updateServices(businessType) {
            const servicesSection = document.getElementById('services-section');
            const servicesList = document.getElementById('services-list');
            
            if (businessType && serviceCatalogs[businessType]) {
                servicesSection.classList.remove('hidden');
                const services = serviceCatalogs[businessType];
                
                servicesList.innerHTML = services.map(service => \`
                    <label class="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                        <input type="checkbox" name="services" value="\${service.name}" 
                            data-price="\${service.basePrice}" data-duration="\${service.duration}"
                            class="mt-1 text-blue-600 focus:ring-blue-500" checked>
                        <div class="flex-1">
                            <div class="font-medium text-gray-800">\${service.name}</div>
                            <div class="text-sm text-gray-600 flex justify-between">
                                <span>\${service.duration} min</span>
                                <span class="font-bold">$\${service.basePrice} MXN</span>
                            </div>
                            <div class="text-xs text-gray-500">\${service.category}</div>
                        </div>
                    </label>
                \`).join('');
            } else {
                servicesSection.classList.add('hidden');
            }
        }

        // Estilos para planes seleccionados - CORREGIDO
        document.querySelectorAll('input[name="plan"]').forEach(radio => {
            radio.addEventListener('change', function() {
                document.querySelectorAll('.plan-card').forEach(card => {
                    card.classList.remove('border-blue-500', 'border-green-500', 'border-purple-500', 'border-yellow-500', 'bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-yellow-50');
                });
                if (this.checked) {
                    const card = this.closest('label').querySelector('.plan-card');
                    const colors = {
                        'basic': ['border-blue-500', 'bg-blue-50'],
                        'pro': ['border-green-500', 'bg-green-50'],
                        'premium': ['border-purple-500', 'bg-purple-50'],
                        'demo': ['border-yellow-500', 'bg-yellow-50']
                    };
                    card.classList.add(...colors[this.value]);
                }
            });
        });

        // Envío del formulario - CON MEJOR MANEJO DE ERRORES
        document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '⏳ Creando negocio...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(e.target);
                const data = {
                    businessName: formData.get('businessName'),
                    businessType: formData.get('businessType'),
                    whatsappBusiness: formData.get('whatsappBusiness'),
                    contactEmail: formData.get('contactEmail'),
                    plan: formData.get('plan')
                };

                // Validar campos requeridos
                if (!data.businessName || !data.businessType || !data.whatsappBusiness || !data.contactEmail || !data.plan) {
                    throw new Error('Todos los campos marcados con * son obligatorios');
                }

                console.log('📤 Enviando datos:', data);

                const response = await fetch('/api/onboarding-enhanced', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                const resultDiv = document.getElementById('result');

                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                            <div class="flex items-center">
                                <div class="text-3xl">🎉</div>
                                <div class="ml-4">
                                    <h3 class="font-bold text-green-800 text-lg">¡Negocio Creado Exitosamente!</h3>
                                    <p class="text-green-700">Tu bot está siendo configurado automáticamente</p>
                                    <div class="mt-2 text-sm">
                                        <p><strong>ID:</strong> \${result.businessId}</p>
                                        <p><strong>Dashboard:</strong> <a href="/dashboard-pro/\${result.businessId}" class="underline text-blue-600">Ver Dashboard Pro</a></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;
                    e.target.reset();
                } else {
                    throw new Error(result.message || 'Error desconocido');
                }

                resultDiv.classList.remove('hidden');
            } catch (error) {
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = \`
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="text-red-800 font-bold">Error:</div>
                        <div class="text-red-700">\${error.message}</div>
                    </div>
                \`;
                resultDiv.classList.remove('hidden');
                console.error('❌ Error:', error);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });

        // Inicializar estilos de planes
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('input[name="plan"]').forEach(radio => {
                radio.dispatchEvent(new Event('change'));
            });
        });
    </script>
</body>
</html>
  `);
});

// POST /api/onboarding-enhanced - CORREGIDO con mejor manejo de errores
router.post('/', async (req, res) => {
  try {
    console.log('📥 [ONBOARDING-ENHANCED] Datos recibidos:', req.body);

    const { businessName, businessType, whatsappBusiness, contactEmail, plan } = req.body;

    // Validaciones mejoradas
    if (!businessName || !businessType || !whatsappBusiness || !contactEmail || !plan) {
      console.log('❌ [ONBOARDING-ENHANCED] Faltan campos requeridos');
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser completados'
      });
    }

    // Crear negocio
    const business = new Business({
      businessName,
      businessType,
      whatsappBusiness,
      contactEmail,
      plan,
      managerName: 'Propietario',
      onboardingCompleted: true,
      status: 'active'
    });

    await business.save();
    console.log('✅ [ONBOARDING-ENHANCED] Negocio creado:', business._id);

    res.json({
      success: true,
      message: 'Negocio creado y bot configurado exitosamente',
      businessId: business._id,
      dashboardUrl: `/dashboard-pro/${business._id}`
    });

  } catch (error) {
    console.error('❌ [ONBOARDING-ENHANCED] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor: ' + error.message
    });
  }
});

module.exports = router;
