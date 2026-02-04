/**
 * 🤖 BOT SETUP SERVICE
 * Servicio de configuración automática de bot post-registro/pago
 * Genera todo lo necesario para que el bot funcione inmediatamente
 */

const Business = require('../models/Business');
const User = require('../models/User');
const { provisionNumberForBusiness, assignExistingNumber } = require('./twilioProvisioningService');
const serviceCatalogs = require('../config/service-catalogs');

/**
 * Configuración de bot por tipo de industria
 */
const BOT_CONFIGS = {
    dental: {
        welcomeMessage: '¡Hola! 👋 Bienvenido a {businessName}. Soy tu asistente virtual. ¿En qué puedo ayudarte?',
        menuOptions: ['Agendar cita', 'Ver servicios', 'Precios', 'Ubicación', 'Horarios'],
        botPersonality: 'profesional y amigable, enfocado en salud dental'
    },
    medical: {
        welcomeMessage: '¡Hola! 👋 Bienvenido a {businessName}. ¿En qué podemos asistirte hoy?',
        menuOptions: ['Agendar consulta', 'Servicios médicos', 'Información', 'Urgencias'],
        botPersonality: 'profesional y empático, enfocado en atención médica'
    },
    spa: {
        welcomeMessage: '¡Hola! ✨ Bienvenido a {businessName}. Estoy aquí para ayudarte a reservar tu momento de relax.',
        menuOptions: ['Reservar tratamiento', 'Ver servicios', 'Paquetes especiales', 'Promociones'],
        botPersonality: 'relajado y cálido, enfocado en bienestar'
    },
    nails: {
        welcomeMessage: '¡Hola! 💅 Bienvenida a {businessName}. ¿Lista para consentir tus manos?',
        menuOptions: ['Agendar cita', 'Servicios y precios', 'Diseños disponibles', 'Promociones'],
        botPersonality: 'amigable y trendy, enfocado en belleza'
    },
    barbershop: {
        welcomeMessage: '¡Qué onda! ✂️ Bienvenido a {businessName}. ¿Listo para un corte?',
        menuOptions: ['Agendar corte', 'Servicios', 'Barba y acabados', 'Horarios'],
        botPersonality: 'casual y masculino, enfocado en estilo'
    },
    automotive: {
        welcomeMessage: '¡Hola! 🚗 Bienvenido a {businessName}. ¿En qué podemos ayudarte con tu vehículo?',
        menuOptions: ['Agendar servicio', 'Diagnóstico', 'Cotización', 'Estado de mi auto'],
        botPersonality: 'técnico y confiable, enfocado en servicio automotriz'
    },
    food: {
        welcomeMessage: '¡Hola! 🍽️ Bienvenido a {businessName}. ¿Listo para ordenar?',
        menuOptions: ['Ver menú', 'Hacer pedido', 'Promociones', 'Horarios'],
        botPersonality: 'amigable y eficiente, enfocado en satisfacción gastronómica'
    },
    default: {
        welcomeMessage: '¡Hola! 👋 Bienvenido a {businessName}. ¿En qué puedo ayudarte?',
        menuOptions: ['Ver servicios', 'Agendar cita', 'Información', 'Contacto'],
        botPersonality: 'profesional y amigable'
    }
};

/**
 * Configurar bot completo para un negocio
 * @param {string} businessId - ID del negocio
 * @param {object} options - Opciones adicionales
 */
async function setupBot(businessId, options = {}) {
    try {
        console.log(`🤖 Iniciando setup de bot para negocio ${businessId}...`);

        const business = await Business.findById(businessId);
        if (!business) {
            throw new Error('Negocio no encontrado');
        }

        const results = {
            businessId,
            steps: []
        };

        // 1. Cargar servicios según tipo de negocio
        const servicesLoaded = await loadServicesForBusiness(business);
        results.steps.push({
            step: 'services',
            success: servicesLoaded,
            count: business.services?.length || 0
        });

        // 2. Configurar bot según industria
        const botConfigured = await configureBotForIndustry(business);
        results.steps.push({
            step: 'bot_config',
            success: botConfigured
        });

        // 3. Configurar horarios por defecto si no existen
        const hoursSet = await setDefaultBusinessHours(business);
        results.steps.push({
            step: 'business_hours',
            success: hoursSet
        });

        // 4. Provisionar número de WhatsApp si es plan pagado
        if (['pro', 'ultra'].includes(business.plan) && options.provisionNumber) {
            try {
                const numberResult = await provisionNumberForBusiness(businessId);
                results.steps.push({
                    step: 'phone_number',
                    success: true,
                    phoneNumber: numberResult.phoneNumber
                });
            } catch (error) {
                console.log('⚠️ No se pudo provisionar número:', error.message);
                results.steps.push({
                    step: 'phone_number',
                    success: false,
                    error: error.message
                });
            }
        }

        // 5. Marcar onboarding como completo
        business.onboardingCompleted = true;
        business.botStatus = 'active';
        business.setupCompletedAt = new Date();
        await business.save();

        results.success = true;
        results.botStatus = 'active';

        console.log(`✅ Bot configurado exitosamente para ${business.businessName}`);

        return results;
    } catch (error) {
        console.error('❌ Error en setup de bot:', error);
        throw error;
    }
}

/**
 * Cargar servicios predeterminados según tipo de negocio
 */
async function loadServicesForBusiness(business) {
    try {
        // Solo cargar si no tiene servicios
        if (business.services && business.services.length > 0) {
            console.log('📋 Negocio ya tiene servicios cargados');
            return true;
        }

        const catalog = serviceCatalogs[business.businessType] || serviceCatalogs.default;

        if (!catalog || !catalog.services) {
            console.log('⚠️ No hay catálogo para tipo:', business.businessType);
            return false;
        }

        // Mapear servicios del catálogo
        business.services = catalog.services.map(service => ({
            name: service.name,
            price: service.basePrice,
            duration: service.duration,
            category: service.category || 'General',
            description: service.description || '',
            isActive: true
        }));

        await business.save();
        console.log(`📋 ${business.services.length} servicios cargados`);

        return true;
    } catch (error) {
        console.error('Error cargando servicios:', error);
        return false;
    }
}

/**
 * Configurar bot según tipo de industria
 */
async function configureBotForIndustry(business) {
    try {
        const config = BOT_CONFIGS[business.businessType] || BOT_CONFIGS.default;

        business.botConfig = {
            ...business.botConfig,
            welcomeMessage: config.welcomeMessage.replace('{businessName}', business.businessName),
            menuOptions: config.menuOptions,
            personality: config.botPersonality,
            isActive: true,
            configuredAt: new Date()
        };

        await business.save();
        console.log('🤖 Bot configurado para industria:', business.businessType);

        return true;
    } catch (error) {
        console.error('Error configurando bot:', error);
        return false;
    }
}

/**
 * Establecer horarios de negocio por defecto
 */
async function setDefaultBusinessHours(business) {
    try {
        // Solo establecer si no tiene horarios
        if (business.businessHours && Object.keys(business.businessHours).length > 0) {
            console.log('⏰ Negocio ya tiene horarios configurados');
            return true;
        }

        // Horario típico de negocio mexicano
        const defaultHours = {
            monday: { open: '09:00', close: '18:00', isOpen: true },
            tuesday: { open: '09:00', close: '18:00', isOpen: true },
            wednesday: { open: '09:00', close: '18:00', isOpen: true },
            thursday: { open: '09:00', close: '18:00', isOpen: true },
            friday: { open: '09:00', close: '18:00', isOpen: true },
            saturday: { open: '09:00', close: '14:00', isOpen: true },
            sunday: { open: '00:00', close: '00:00', isOpen: false }
        };

        business.businessHours = defaultHours;
        await business.save();
        console.log('⏰ Horarios por defecto establecidos');

        return true;
    } catch (error) {
        console.error('Error estableciendo horarios:', error);
        return false;
    }
}

/**
 * Verificar estado del bot de un negocio
 */
async function checkBotStatus(businessId) {
    try {
        const business = await Business.findById(businessId);
        if (!business) {
            return { active: false, reason: 'business_not_found' };
        }

        const checks = {
            hasServices: business.services && business.services.length > 0,
            hasBotConfig: !!business.botConfig?.welcomeMessage,
            hasPhoneNumber: !!business.whatsapp?.number,
            isOnboardingComplete: !!business.onboardingCompleted,
            planActive: ['basico', 'pro', 'ultra', 'free-trial'].includes(business.plan)
        };

        const allChecksPass = Object.values(checks).every(v => v);

        return {
            active: allChecksPass,
            checks,
            plan: business.plan,
            botStatus: business.botStatus || 'inactive'
        };
    } catch (error) {
        console.error('Error verificando estado:', error);
        return { active: false, reason: 'error', error: error.message };
    }
}

/**
 * Activar/Desactivar bot
 */
async function toggleBot(businessId, active) {
    try {
        const business = await Business.findById(businessId);
        if (!business) {
            throw new Error('Negocio no encontrado');
        }

        business.botStatus = active ? 'active' : 'paused';
        if (business.botConfig) {
            business.botConfig.isActive = active;
        }
        await business.save();

        console.log(`🤖 Bot ${active ? 'activado' : 'pausado'} para ${business.businessName}`);

        return { success: true, status: business.botStatus };
    } catch (error) {
        console.error('Error toggling bot:', error);
        throw error;
    }
}

/**
 * Evento: Usuario completó pago - activar bot
 */
async function onPaymentCompleted(userId, planId) {
    try {
        console.log(`💰 Pago completado - Activando bot para usuario ${userId}...`);

        const user = await User.findById(userId).populate('businessId');
        if (!user || !user.businessId) {
            console.log('⚠️ Usuario sin negocio asociado');
            return { success: false, reason: 'no_business' };
        }

        // Actualizar plan del negocio
        user.businessId.plan = planId;
        await user.businessId.save();

        // Configurar bot completamente
        const setupResult = await setupBot(user.businessId._id, {
            provisionNumber: ['pro', 'ultra'].includes(planId)
        });

        return setupResult;
    } catch (error) {
        console.error('Error en onPaymentCompleted:', error);
        throw error;
    }
}

module.exports = {
    setupBot,
    loadServicesForBusiness,
    configureBotForIndustry,
    setDefaultBusinessHours,
    checkBotStatus,
    toggleBot,
    onPaymentCompleted,
    BOT_CONFIGS
};
