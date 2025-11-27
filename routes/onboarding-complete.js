const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const serviceCatalogs = require('../config/service-catalogs');

// GET /onboarding-complete - Formulario COMPLETO funcional
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Onboarding Completo - Crear Negocio</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <div class="bg-white rounded-2xl shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">🚀 Configuración Completa de Negocio</h1>
            <p class="text-gray-600 mb-8">Completa toda la información para activar tu bot profesional</p>
            
            <form id="onboardingForm" class="space-y-8">
                <!-- SECCIÓN 1: INFORMACIÓN LEGAL DEL NEGOCIO -->
                <div class="border-b border-gray-200 pb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">🏢 Información Legal del Negocio</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre Comercial *</label>
                            <input type="text" name="businessName" required 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Clínica Dental Sonrisas">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Razón Social *</label>
                            <input type="text" name="legalName" required 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Clínica Dental Sonrisas SA de CV">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">RFC *</label>
                            <input type="text" name="rfc" required 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: CDS210101ABC">
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
                </div>

                <!-- SECCIÓN 2: INFORMACIÓN DE CONTACTO -->
                <div class="border-b border-gray-200 pb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">📞 Información de Contacto</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">WhatsApp Business *</label>
                            <input type="tel" name="whatsappBusiness" placeholder="+525511223344" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <input type="email" name="contactEmail" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="contacto@negocio.com">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Celular Personal *</label>
                            <input type="tel" name="managerPhone" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="+525511223344">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Responsable *</label>
                            <input type="text" name="managerName" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Juan Pérez García">
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 3: UBICACIÓN -->
                <div class="border-b border-gray-200 pb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">📍 Ubicación del Negocio</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Calle y Número *</label>
                            <input type="text" name="addressStreet" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Av. Principal #123">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Ciudad *</label>
                            <input type="text" name="addressCity" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ciudad de México">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Código Postal *</label>
                            <input type="text" name="addressPostalCode" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="01000">
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 4: HORARIOS DE ATENCIÓN -->
                <div class="border-b border-gray-200 pb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">🕐 Horarios de Atención</h2>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <!-- Lunes a Viernes -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <label class="flex items-center mb-2">
                                <input type="checkbox" name="businessHours_monday_active" checked class="mr-2">
                                <span class="font-medium">Lunes a Viernes</span>
                            </label>
                            <div class="grid grid-cols-2 gap-2">
                                <input type="time" name="businessHours_weekday_open" value="09:00" class="p-2 border rounded">
                                <input type="time" name="businessHours_weekday_close" value="18:00" class="p-2 border rounded">
                            </div>
                        </div>
                        
                        <!-- Sábado -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <label class="flex items-center mb-2">
                                <input type="checkbox" name="businessHours_saturday_active" checked class="mr-2">
                                <span class="font-medium">Sábado</span>
                            </label>
                            <div class="grid grid-cols-2 gap-2">
                                <input type="time" name="businessHours_saturday_open" value="09:00" class="p-2 border rounded">
                                <input type="time" name="businessHours_saturday_close" value="14:00" class="p-2 border rounded">
                            </div>
                        </div>
                        
                        <!-- Domingo -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <label class="flex items-center mb-2">
                                <input type="checkbox" name="businessHours_sunday_active" class="mr-2">
                                <span class="font-medium">Domingo</span>
                            </label>
                            <div class="grid grid-cols-2 gap-2">
                                <input type="time" name="businessHours_sunday_open" value="09:00" class="p-2 border rounded" disabled>
                                <input type="time" name="businessHours_sunday_close" value="14:00" class="p-2 border rounded" disabled>
                            </div>
                        </div>
                        
                        <!-- Configuración rápida -->
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <label class="block font-medium text-blue-800 mb-2">Configuración Rápida</label>
                            <select onchange="applyQuickSchedule(this.value)" class="w-full p-2 border rounded text-sm">
                                <option value="">Seleccionar horario</option>
                                <option value="standard">Estándar (L-V 9-18, S 9-14)</option>
                                <option value="extended">Extendido (L-V 8-20, S 9-16)</option>
                                <option value="weekend">Con Domingo (L-D 9-18)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 5: SERVICIOS -->
                <div class="border-b border-gray-200 pb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">✅ Servicios que Ofreces</h2>
                    <div id="services-section" class="hidden">
                        <div id="services-list" class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                            <!-- Los servicios se cargan dinámicamente -->
                        </div>
                        <div class="mt-4 text-sm text-gray-600">
                            💡 Estos servicios tendrán precios personalizables según tu tipo de negocio. 
                            Podrás agregar más servicios después en tu dashboard.
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 6: PLAN -->
                <div>
                    <h2 class="text-xl font-bold text-gray-800 mb-4">💎 Elige Tu Plan</h2>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <label class="relative">
                            <input type="radio" name="plan" value="basic" class="sr-only" required>
                            <div class="border-2 border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 plan-card h-full">
                                <div class="font-bold text-gray-800">Básico</div>
                                <div class="text-2xl font-bold text-blue-600">$5,000<sub>/mes</sub></div>
                                <ul class="text-xs text-gray-600 mt-3 space-y-1 text-left">
                                    <li>✓ Bot Básico Automático</li>
                                    <li>✓ Hasta 5 servicios</li>
                                    <li>✓ 100 citas/mes</li>
                                    <li>✓ Soporte por email</li>
                                </ul>
                            </div>
                        </label>
                        <label class="relative">
                            <input type="radio" name="plan" value="pro" class="sr-only">
                            <div class="border-2 border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 plan-card h-full">
                                <div class="font-bold text-gray-800">Pro</div>
                                <div class="text-2xl font-bold text-green-600">$16,000<sub>/mes</sub></div>
                                <ul class="text-xs text-gray-600 mt-3 space-y-1 text-left">
                                    <li>✓ Todo en Básico</li>
                                    <li>✓ Dashboard Pro</li>
                                    <li>✓ Calendario Integrado</li>
                                    <li>✓ Servicios Ilimitados</li>
                                </ul>
                            </div>
                        </label>
                        <label class="relative">
                            <input type="radio" name="plan" value="premium" class="sr-only">
                            <div class="border-2 border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 plan-card h-full">
                                <div class="font-bold text-gray-800">Premium</div>
                                <div class="text-2xl font-bold text-purple-600">$25,000<sub>/mes</sub></div>
                                <ul class="text-xs text-gray-600 mt-3 space-y-1 text-left">
                                    <li>✓ Todo en Pro</li>
                                    <li>✓ Pagos Online</li>
                                    <li>✓ Facturación</li>
                                    <li>✓ Soporte Prioritario</li>
                                </ul>
                            </div>
                        </label>
                        <label class="relative">
                            <input type="radio" name="plan" value="demo" class="sr-only">
                            <div class="border-2 border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-yellow-500 plan-card h-full">
                                <div class="font-bold text-gray-800">Demo</div>
                                <div class="text-2xl font-bold text-yellow-600">Gratis</div>
                                <ul class="text-xs text-gray-600 mt-3 space-y-1 text-left">
                                    <li>✓ 3 días de prueba</li>
                                    <li>✓ Funciones completas</li>
                                    <li>✓ Sin compromiso</li>
                                    <li>✓ Sin tarjeta</li>
                                </ul>
                            </div>
                        </label>
                    </div>
                </div>

                <button type="submit" 
                    class="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-blue-700 transition duration-200 text-lg">
                    🚀 Activar Mi Bot Profesional
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
                            <div class="text-sm text-gray-600 ">
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

        // Configuración rápida de horarios
        function applyQuickSchedule(type) {
            const schedules = {
                'standard': {
                    weekday: { open: '09:00', close: '18:00' },
                    saturday: { open: '09:00', close: '14:00' },
                    sunday: { active: false, open: '09:00', close: '14:00' }
                },
                'extended': {
                    weekday: { open: '08:00', close: '20:00' },
                    saturday: { open: '09:00', close: '16:00' },
                    sunday: { active: false, open: '09:00', close: '14:00' }
                },
                'weekend': {
                    weekday: { open: '09:00', close: '18:00' },
                    saturday: { open: '09:00', close: '18:00' },
                    sunday: { active: true, open: '09:00', close: '18:00' }
                }
            };

            if (type && schedules[type]) {
                const schedule = schedules[type];
                
                // Lunes a Viernes
                document.querySelector('input[name="businessHours_weekday_open"]').value = schedule.weekday.open;
                document.querySelector('input[name="businessHours_weekday_close"]').value = schedule.weekday.close;
                
                // Sábado
                document.querySelector('input[name="businessHours_saturday_open"]').value = schedule.saturday.open;
                document.querySelector('input[name="businessHours_saturday_close"]').value = schedule.saturday.close;
                
                // Domingo
                const sundayActive = document.querySelector('input[name="businessHours_sunday_active"]');
                const sundayOpen = document.querySelector('input[name="businessHours_sunday_open"]');
                const sundayClose = document.querySelector('input[name="businessHours_sunday_close"]');
                
                sundayActive.checked = schedule.sunday.active;
                sundayOpen.disabled = !schedule.sunday.active;
                sundayClose.disabled = !schedule.sunday.active;
                if (schedule.sunday.active) {
                    sundayOpen.value = schedule.sunday.open;
                    sundayClose.value = schedule.sunday.close;
                }
            }
        }

        // Habilitar/deshabilitar inputs de domingo
        document.querySelector('input[name="businessHours_sunday_active"]').addEventListener('change', function() {
            const open = document.querySelector('input[name="businessHours_sunday_open"]');
            const close = document.querySelector('input[name="businessHours_sunday_close"]');
            open.disabled = !this.checked;
            close.disabled = !this.checked;
        });

        // Estilos para planes seleccionados
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
                    businessHours: {
                        monday: {
                            active: formData.get('businessHours_monday_active') === 'on',
                            open: formData.get('businessHours_weekday_open'),
                            close: formData.get('businessHours_weekday_close')
                        },
                        tuesday: {
                            active: formData.get('businessHours_monday_active') === 'on',
                            open: formData.get('businessHours_weekday_open'),
                            close: formData.get('businessHours_weekday_close')
                        },
                        wednesday: {
                            active: formData.get('businessHours_monday_active') === 'on',
                            open: formData.get('businessHours_weekday_open'),
                            close: formData.get('businessHours_weekday_close')
                        },
                        thursday: {
                            active: formData.get('businessHours_monday_active') === 'on',
                            open: formData.get('businessHours_weekday_open'),
                            close: formData.get('businessHours_weekday_close')
                        },
                        friday: {
                            active: formData.get('businessHours_monday_active') === 'on',
                            open: formData.get('businessHours_weekday_open'),
                            close: formData.get('businessHours_weekday_close')
                        },
                        saturday: {
                            active: formData.get('businessHours_saturday_active') === 'on',
                            open: formData.get('businessHours_saturday_open'),
                            close: formData.get('businessHours_saturday_close')
                        },
                        sunday: {
                            active: formData.get('businessHours_sunday_active') === 'on',
                            open: formData.get('businessHours_sunday_open'),
                            close: formData.get('businessHours_sunday_close')
                        }
                    }
                };

                // Validar campos requeridos
                const required = [
                    'businessName', 'legalName', 'rfc', 'businessType', 
                    'whatsappBusiness', 'contactEmail', 'managerPhone', 'managerName',
                    'addressStreet', 'addressCity', 'addressPostalCode', 'plan'
                ];
                
                const missing = required.filter(field => !data[field] || data[field].trim() === '');

                if (missing.length > 0) {
                    throw new Error('Faltan campos obligatorios: ' + missing.join(', '));
                }


                const response = await fetch('/api/onboarding-complete', {
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
                                    <p class="text-green-700">Tu bot profesional está siendo configurado</p>
                                    <div class="mt-3 space-y-1 text-sm">
                                        <p><strong>ID del Negocio:</strong> \${result.businessId}</p>
                                        <p><strong>Dashboard Pro:</strong> <a href="/dashboard-pro/\${result.businessId}" class="underline text-blue-600 font-medium" target="_blank">Ver Mi Dashboard</a></p>
                                        <p><strong>WhatsApp Business:</strong> \${data.whatsappBusiness}</p>
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

        // Inicializar
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

// POST /api/onboarding-complete - CON TWILIO PRO INTEGRATION
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
    const whatsappRegex = /^\+[1-9]\d{1,14}$/;
    if (!whatsappRegex.test(req.body.whatsappBusiness.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Formato de número WhatsApp inválido. Debe ser: +521234567890'
      });
    }
    console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));

    const { 
      businessName, legalName, rfc, businessType, 
      whatsappBusiness, contactEmail, managerPhone, managerName,
      addressStreet, addressCity, addressPostalCode,
      plan, businessHours 
    } = req.body;

    // Validaciones completas
    const requiredFields = [
      'businessName', 'legalName', 'rfc', 'businessType', 
      'whatsappBusiness', 'contactEmail', 'managerPhone', 'managerName',
      'addressStreet', 'addressCity', 'addressPostalCode'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].trim() === '');
    if (missingFields.length > 0) {
      console.log('❌ [ONBOARDING-COMPLETE] Faltan campos:', missingFields);
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: ' + missingFields.join(', ')
      });
    }

    // Crear negocio COMPLETO CON TWILIO PRO
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
        autoResponder: req.body.autoWhatsappSetup || false,
        configuredAt: new Date()
      },
      onboardingCompleted: true,
      status: 'active'
    });

    console.log('💾 [ONBOARDING-COMPLETE] Guardando negocio en MongoDB...');
    await business.save();
    console.log('🎉✅ [ONBOARDING-COMPLETE] NEGOCIO CREADO EXITOSAMENTE!');
    console.log('   📍 ID:', business._id);
    console.log('   🏢 Nombre:', business.businessName);
    console.log('   📞 WhatsApp:', business.whatsappBusiness);
    console.log('   📧 Email:', business.contactEmail);

    console.log('📤 [ONBOARDING-COMPLETE] Enviando respuesta de éxito con Twilio Pro...');
    
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
      dashboardUrl: `/dashboard-pro/${business._id}`,
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
    });

  } catch (error) {
    console.error('🚨❌ [ONBOARDING-COMPLETE] ERROR CRÍTICO:', error);
    console.error('🔍 Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: '❌ Error al crear el negocio: ' + error.message,
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


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

module.exports = router;
