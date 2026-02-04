/**
 * 🤖 AI PERSONALIZATION SERVICE
 * Servicio de IA personalizada por industria
 * Genera respuestas contextuales según el tipo de negocio
 */

const Anthropic = require('@anthropic-ai/sdk');
const Business = require('../models/Business');

// Cliente de Anthropic (Claude)
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'test-key'
});

/**
 * Configuraciones de personalidad por industria
 */
const INDUSTRY_PERSONAS = {
    dental: {
        name: 'DentiBot',
        role: 'asistente virtual de clínica dental',
        personality: 'profesional, empático y tranquilizador',
        expertise: ['odontología general', 'ortodoncia', 'implantes', 'blanqueamiento', 'urgencias dentales'],
        tone: 'cálido pero profesional, reduciendo la ansiedad del paciente',
        commonQuestions: [
            'precios de tratamientos',
            'disponibilidad de citas',
            'urgencias dentales',
            'preparación para procedimientos'
        ],
        systemPrompt: `Eres un asistente virtual amigable de una clínica dental. Tu objetivo es:
- Agendar citas de manera eficiente
- Responder preguntas sobre tratamientos dentales
- Tranquilizar a pacientes ansiosos
- Dar información clara sobre precios y duración de tratamientos
- En emergencias, dar instrucciones básicas y urgir visita al dentista`
    },

    medical: {
        name: 'MediBot',
        role: 'asistente virtual de consultorio médico',
        personality: 'profesional, sereno y confiable',
        expertise: ['consulta general', 'especialidades', 'estudios', 'seguimiento de tratamientos'],
        tone: 'empático y claro, sin crear alarma innecesaria',
        commonQuestions: [
            'síntomas y cuándo consultar',
            'horarios de atención',
            'documentos necesarios',
            'seguimiento de citas'
        ],
        systemPrompt: `Eres un asistente virtual de un consultorio médico. Tu objetivo es:
- Ayudar a agendar consultas médicas
- Dar información sobre servicios y especialidades
- NO dar diagnósticos, siempre remitir al médico
- Indicar cuándo es una emergencia
- Recordar documentos necesarios para la consulta`
    },

    spa: {
        name: 'ZenBot',
        role: 'concierge virtual de spa y bienestar',
        personality: 'relajado, cálido y sofisticado',
        expertise: ['masajes', 'tratamientos faciales', 'aromaterapia', 'paquetes de relajación'],
        tone: 'sereno y acogedor, transmitiendo tranquilidad',
        commonQuestions: [
            'recomendación de tratamientos',
            'paquetes especiales',
            'preparación pre-tratamiento',
            'contraindicaciones'
        ],
        systemPrompt: `Eres un concierge virtual de un spa de lujo. Tu objetivo es:
- Crear una experiencia premium desde el primer contacto
- Recomendar tratamientos según las necesidades del cliente
- Explicar beneficios de cada servicio
- Gestionar reservaciones
- Transmitir calma y bienestar en cada mensaje`
    },

    nails: {
        name: 'GlamBot',
        role: 'asistente de salón de uñas',
        personality: 'trendy, amigable y entusiasta',
        expertise: ['manicure', 'pedicure', 'nail art', 'extensiones', 'tratamientos'],
        tone: 'casual y emocionante, conectando con tendencias',
        commonQuestions: [
            'diseños disponibles',
            'duración de servicios',
            'cuidado de uñas',
            'tendencias actuales'
        ],
        systemPrompt: `Eres una asistente virtual super friendly de un salón de uñas. Tu objetivo es:
- Agendar citas de manera rápida y divertida
- Compartir tendencias y diseños populares
- Recomendar servicios según el estilo de la clienta
- Dar tips de cuidado de uñas
- Usar emojis y lenguaje casual pero profesional 💅✨`
    },

    barbershop: {
        name: 'BarberBot',
        role: 'asistente de barbería',
        personality: 'cool, directo y masculino',
        expertise: ['cortes', 'barbas', 'afeitado', 'styling'],
        tone: 'casual y relajado, como hablar con un amigo',
        commonQuestions: [
            'estilos de corte',
            'cuidado de barba',
            'productos recomendados',
            'disponibilidad'
        ],
        systemPrompt: `Eres el asistente virtual de una barbería moderna. Tu objetivo es:
- Agendar cortes de manera rápida
- Recomendar estilos según el tipo de cara
- Dar consejos de cuidado de barba
- Mantener un tono casual y masculino
- Ser directo y eficiente`
    },

    automotive: {
        name: 'AutoBot',
        role: 'asesor virtual de taller automotriz',
        personality: 'técnico, confiable y honesto',
        expertise: ['mecánica general', 'diagnóstico', 'mantenimiento', 'refacciones'],
        tone: 'claro y educativo, sin tecnicismos innecesarios',
        commonQuestions: [
            'síntomas del vehículo',
            'costos estimados',
            'tiempo de reparación',
            'mantenimiento preventivo'
        ],
        systemPrompt: `Eres un asesor virtual de un taller mecánico. Tu objetivo es:
- Ayudar a diagnosticar problemas básicos
- Agendar citas de servicio
- Dar estimados de tiempo y costo
- Educar sobre mantenimiento preventivo
- Ser honesto y generar confianza`
    },

    food: {
        name: 'FoodBot',
        role: 'asistente de restaurante',
        personality: 'amigable, eficiente y apetitoso',
        expertise: ['menú', 'especialidades', 'reservaciones', 'pedidos'],
        tone: 'entusiasta sobre la comida, generando antojo',
        commonQuestions: [
            'menú del día',
            'ingredientes y alergénicos',
            'tiempo de entrega',
            'promociones'
        ],
        systemPrompt: `Eres el asistente virtual de un restaurante. Tu objetivo es:
- Tomar pedidos de manera clara
- Describir platillos de forma apetitosa
- Manejar reservaciones
- Informar sobre alergénicos e ingredientes
- Upsell de manera natural (postres, bebidas)`
    },

    default: {
        name: 'AsisBot',
        role: 'asistente virtual de negocios',
        personality: 'profesional, amigable y servicial',
        expertise: ['atención al cliente', 'información general', 'citas'],
        tone: 'profesional pero cálido',
        commonQuestions: ['servicios', 'horarios', 'precios', 'contacto'],
        systemPrompt: `Eres un asistente virtual de negocios. Tu objetivo es:
- Atender consultas de manera profesional
- Agendar citas o servicios
- Proporcionar información clara
- Derivar a humanos cuando sea necesario`
    }
};

/**
 * Generar respuesta personalizada usando IA
 * @param {string} businessId - ID del negocio
 * @param {string} userMessage - Mensaje del usuario
 * @param {object} context - Contexto adicional (historial, cliente, etc)
 */
async function generatePersonalizedResponse(businessId, userMessage, context = {}) {
    try {
        const business = await Business.findById(businessId);
        if (!business) {
            throw new Error('Negocio no encontrado');
        }

        const persona = INDUSTRY_PERSONAS[business.businessType] || INDUSTRY_PERSONAS.default;

        // Construir prompt del sistema
        const systemPrompt = buildSystemPrompt(business, persona, context);

        // Llamar a Claude
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307', // Más rápido y económico
            max_tokens: 500,
            system: systemPrompt,
            messages: [
                ...(context.history || []),
                { role: 'user', content: userMessage }
            ]
        });

        const aiResponse = response.content[0].text;

        // Log para analytics
        console.log(`🤖 AI Response (${persona.name}):`, aiResponse.substring(0, 100) + '...');

        return {
            success: true,
            response: aiResponse,
            persona: persona.name,
            tokensUsed: response.usage.output_tokens
        };

    } catch (error) {
        console.error('❌ Error generando respuesta IA:', error);

        // Fallback a respuesta genérica
        return {
            success: false,
            response: 'Gracias por tu mensaje. Un momento, te atenderemos pronto.',
            error: error.message
        };
    }
}

/**
 * Construir prompt del sistema con contexto del negocio
 */
function buildSystemPrompt(business, persona, context) {
    let prompt = persona.systemPrompt + '\n\n';

    prompt += `INFORMACIÓN DEL NEGOCIO:\n`;
    prompt += `- Nombre: ${business.businessName}\n`;
    prompt += `- Tipo: ${business.businessType}\n`;

    if (business.address) {
        prompt += `- Dirección: ${business.address}\n`;
    }

    if (business.whatsappBusiness) {
        prompt += `- Teléfono: ${business.whatsappBusiness}\n`;
    }

    // Agregar servicios si existen
    if (business.services && business.services.length > 0) {
        prompt += `\nSERVICIOS DISPONIBLES:\n`;
        business.services.slice(0, 10).forEach(s => {
            prompt += `- ${s.name}: $${s.price} MXN (${s.duration || 30} min)\n`;
        });
    }

    // Agregar horarios
    if (business.businessHours) {
        prompt += `\nHORARIOS:\n`;
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        days.forEach((day, i) => {
            const hours = business.businessHours[day];
            if (hours?.isOpen) {
                prompt += `- ${dayNames[i]}: ${hours.open} - ${hours.close}\n`;
            }
        });
    }

    // Instrucciones finales
    prompt += `\nINSTRUCCIONES:
- Responde siempre en español y de manera concisa (máx 3-4 oraciones)
- Si el cliente quiere agendar, pide fecha, hora y servicio
- Si no sabes algo, ofrece conectar con un humano
- Usa el tono definido para ${persona.role}
- NUNCA inventes información que no tengas`;

    if (context.clientName) {
        prompt += `\n- El cliente se llama: ${context.clientName}`;
    }

    return prompt;
}

/**
 * Detectar intención del mensaje
 */
async function detectIntent(message) {
    const intents = {
        booking: /\b(cita|agendar|reservar|turno|horario|disponibilidad)\b/i,
        pricing: /\b(precio|costo|cuánto cuesta|tarifa|promoción)\b/i,
        services: /\b(servicios|tratamientos|qué hacen|menú)\b/i,
        location: /\b(dirección|ubicación|dónde|cómo llego)\b/i,
        hours: /\b(horario|abierto|cerrado|qué días)\b/i,
        cancel: /\b(cancelar|reagendar|cambiar cita)\b/i,
        emergency: /\b(urgente|emergencia|dolor|ayuda)\b/i,
        greeting: /^(hola|buenos|buenas|hey|qué tal)/i,
        goodbye: /\b(gracias|adiós|bye|hasta luego)\b/i,
        optout: /\b(no más mensajes|dejar de recibir|cancelar suscripción|baja)\b/i
    };

    const detected = [];
    for (const [intent, pattern] of Object.entries(intents)) {
        if (pattern.test(message)) {
            detected.push(intent);
        }
    }

    return detected.length > 0 ? detected : ['general'];
}

/**
 * Obtener persona configurada para un negocio
 */
async function getBusinessPersona(businessId) {
    try {
        const business = await Business.findById(businessId);
        if (!business) {
            return INDUSTRY_PERSONAS.default;
        }
        return INDUSTRY_PERSONAS[business.businessType] || INDUSTRY_PERSONAS.default;
    } catch (error) {
        return INDUSTRY_PERSONAS.default;
    }
}

module.exports = {
    INDUSTRY_PERSONAS,
    generatePersonalizedResponse,
    detectIntent,
    getBusinessPersona,
    buildSystemPrompt
};
