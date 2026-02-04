/**
 * 🚫 OPT-OUT SERVICE
 * Sistema de gestión de opt-out y preferencias de contacto
 * Permite a clientes dejar de recibir mensajes
 */

const Business = require('../models/Business');

// Schema para opt-outs (podría ser un modelo separado)
// Por ahora lo manejamos en memoria + Business.optOuts[]

/**
 * Palabras clave que activan opt-out
 */
const OPT_OUT_KEYWORDS = [
    'stop', 'para', 'baja', 'cancelar', 'no más',
    'dejar de recibir', 'quitar', 'eliminar', 'unsubscribe'
];

/**
 * Palabras clave que activan opt-in (volver a recibir)
 */
const OPT_IN_KEYWORDS = [
    'start', 'iniciar', 'suscribir', 'volver', 'activar'
];

/**
 * Verificar si un mensaje es solicitud de opt-out
 */
function isOptOutRequest(message) {
    const lowerMessage = message.toLowerCase().trim();
    return OPT_OUT_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Verificar si un mensaje es solicitud de opt-in
 */
function isOptInRequest(message) {
    const lowerMessage = message.toLowerCase().trim();
    return OPT_IN_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Registrar opt-out de un cliente
 * @param {string} businessId - ID del negocio
 * @param {string} phoneNumber - Número de teléfono del cliente
 * @param {string} reason - Razón del opt-out
 */
async function registerOptOut(businessId, phoneNumber, reason = 'user_request') {
    try {
        const business = await Business.findById(businessId);
        if (!business) {
            throw new Error('Negocio no encontrado');
        }

        // Inicializar array si no existe
        if (!business.optOuts) {
            business.optOuts = [];
        }

        // Verificar si ya está en la lista
        const existingOptOut = business.optOuts.find(o => o.phoneNumber === phoneNumber);
        if (existingOptOut) {
            console.log(`📵 Cliente ${phoneNumber} ya estaba en opt-out`);
            return { success: true, alreadyOptedOut: true };
        }

        // Agregar a la lista
        business.optOuts.push({
            phoneNumber,
            reason,
            optedOutAt: new Date(),
            isActive: true
        });

        await business.save();
        console.log(`📵 Opt-out registrado: ${phoneNumber} en ${business.businessName}`);

        return { success: true, message: 'Opt-out registrado' };
    } catch (error) {
        console.error('❌ Error registrando opt-out:', error);
        throw error;
    }
}

/**
 * Registrar opt-in (volver a recibir mensajes)
 */
async function registerOptIn(businessId, phoneNumber) {
    try {
        const business = await Business.findById(businessId);
        if (!business) {
            throw new Error('Negocio no encontrado');
        }

        if (!business.optOuts) {
            return { success: true, wasNotOptedOut: true };
        }

        // Encontrar y desactivar opt-out
        const optOutIndex = business.optOuts.findIndex(o => o.phoneNumber === phoneNumber);
        if (optOutIndex === -1) {
            return { success: true, wasNotOptedOut: true };
        }

        business.optOuts[optOutIndex].isActive = false;
        business.optOuts[optOutIndex].optedInAt = new Date();

        await business.save();
        console.log(`✅ Opt-in registrado: ${phoneNumber} en ${business.businessName}`);

        return { success: true, message: 'Opt-in registrado' };
    } catch (error) {
        console.error('❌ Error registrando opt-in:', error);
        throw error;
    }
}

/**
 * Verificar si un cliente puede recibir mensajes
 */
async function canReceiveMessages(businessId, phoneNumber) {
    try {
        const business = await Business.findById(businessId);
        if (!business || !business.optOuts) {
            return true; // Si no hay lista, puede recibir
        }

        const optOut = business.optOuts.find(
            o => o.phoneNumber === phoneNumber && o.isActive
        );

        return !optOut;
    } catch (error) {
        console.error('❌ Error verificando opt-out:', error);
        return true; // En caso de error, permitir (fail open)
    }
}

/**
 * Obtener lista de opt-outs de un negocio
 */
async function getOptOuts(businessId, activeOnly = true) {
    try {
        const business = await Business.findById(businessId);
        if (!business || !business.optOuts) {
            return [];
        }

        if (activeOnly) {
            return business.optOuts.filter(o => o.isActive);
        }

        return business.optOuts;
    } catch (error) {
        console.error('❌ Error obteniendo opt-outs:', error);
        throw error;
    }
}

/**
 * Procesar mensaje de opt-out/opt-in automáticamente
 */
async function processOptOutMessage(businessId, phoneNumber, message) {
    try {
        if (isOptOutRequest(message)) {
            await registerOptOut(businessId, phoneNumber, 'user_message');
            return {
                isOptOut: true,
                response: '✅ Listo. No recibirás más mensajes de nosotros. Si cambias de opinión, escribe "INICIAR".'
            };
        }

        if (isOptInRequest(message)) {
            await registerOptIn(businessId, phoneNumber);
            return {
                isOptIn: true,
                response: '✅ ¡Bienvenido de vuelta! Volverás a recibir nuestros mensajes.'
            };
        }

        return { isOptOut: false, isOptIn: false };
    } catch (error) {
        console.error('❌ Error procesando opt-out:', error);
        return { error: error.message };
    }
}

/**
 * Mensaje de confirmación de opt-out
 */
function getOptOutConfirmation() {
    return `📵 *Cancelación de Mensajes*

Has dejado de recibir mensajes automáticos de este negocio.

Si cambias de opinión en el futuro, simplemente escribe *INICIAR* para volver a recibir notificaciones.

¡Gracias! 👋`;
}

module.exports = {
    OPT_OUT_KEYWORDS,
    OPT_IN_KEYWORDS,
    isOptOutRequest,
    isOptInRequest,
    registerOptOut,
    registerOptIn,
    canReceiveMessages,
    getOptOuts,
    processOptOutMessage,
    getOptOutConfirmation
};
