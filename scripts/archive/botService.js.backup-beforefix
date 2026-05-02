const Appointment = require('../models/Appointment');

// Estado en memoria
const conversationStates = new Map();

class ConversationManager {
  static getState(phone) {
    if (!conversationStates.has(phone)) {
      conversationStates.set(phone, {
        flow: null,
        step: null,
        data: {},
        lastUpdate: new Date()
      });
    }
    return conversationStates.get(phone);
  }

  static clearState(phone) {
    conversationStates.delete(phone);
  }

  static updateState(phone, updates) {
    const state = this.getState(phone);
    Object.assign(state, updates, { lastUpdate: new Date() });
  }
}

async function processBotMessage(business, message, phone) {
  const msg = message.toLowerCase().trim();
  const state = ConversationManager.getState(phone);

  console.log(`🤖 [${phone}] Negocio: ${business.businessName} | Mensaje: "${message}"`);

  try {
    // MENÚ PRINCIPAL
    if (isGreeting(msg) || msg === 'menu' || msg === '0') {
      ConversationManager.clearState(phone);
      return getMainMenu(business);
    }

    // AGENDAR CITA
    if (msg === '1' || msg.includes('agendar')) {
      ConversationManager.updateState(phone, {
        flow: 'appointment',
        step: 'get_name'
      });
      return `📅 *Agendar Cita*\n\n¿Cuál es tu nombre completo?`;
    }

    // FLUJO DE AGENDADO
    if (state.flow === 'appointment') {
      return handleAppointmentFlow(business, msg, phone, state);
    }

    // OTRAS OPCIONES
    if (msg === '2') {
      return `📋 *Ver Mis Citas*\n\nEsta función estará disponible pronto.`;
    }

    if (msg === '3') {
      return getServicesInfo(business);
    }

    if (msg === '4') {
      return getScheduleInfo(business);
    }

    if (msg === '5') {
      return getLocationInfo(business);
    }

    return getMainMenu(business);

  } catch (error) {
    console.error('❌ Error en bot:', error);
    return getErrorMessage(business);
  }
}

async function handleAppointmentFlow(business, msg, phone, state) {
  switch (state.step) {
    case 'get_name':
      state.data.name = msg;
      state.step = 'get_service';
      return `👋 Hola ${msg}! ¿Qué servicio necesitas?\n\n` + getServicesList(business);

    case 'get_service':
      state.data.service = msg;
      ConversationManager.clearState(phone); // Finalizar el flujo de conversación

      // --- GENERACIÓN DE URL DINÁMICA DEL CALENDARIO ---
      const clientPhone = phone.replace('whatsapp:', ''); // Limpiar el prefijo 'whatsapp:'
const businessId = business._id ? business._id.toString() : 'MISSING_ID'; // Asegurar formato de cadena
      const BASE_URL = "https://dental-bot-prod.onrender.com"; // Usar la variable de entorno de Render
      
      if (!BASE_URL) {
          console.error("RENDER_URL no definida. No se puede generar el link.");
          return getErrorMessage(business);
      }

      const calendarUrl = `${BASE_URL}/calendar-dashboard?` +
                          `businessId=${business._id}` +
                          `&clientName=${encodeURIComponent(state.data.name)}` +
                          `&service=${encodeURIComponent(state.data.service)}` +
                          `&phone=${clientPhone}`;
      // ---------------------------------------------------

      // NOTA: Se usaron backticks (`) para la interpolación de variables
      return `📅 *Selecciona tu cita*\n\nHola ${state.data.name}, selecciona una fecha y hora disponible para tu servicio: *"${state.data.service}"*\n\n${calendarUrl}\n\n*La disponibilidad se actualiza en tiempo real.* Si necesitas otra cosa, inicia un nuevo menú.`;

    case 'confirm': // Este paso ya no se usa, pero se deja como fallback
      // Lógica de confirmación eliminada/obsoleta
      ConversationManager.clearState(phone);
      return getMainMenu(business);

    default:
      state.step = 'get_name';
      return `📅 *Agendar Cita*\n\n¿Cuál es tu nombre completo?`;
  }
}

function getMainMenu(business) {
  return `👋 *¡Bienvenido a ${business.businessName}!*\n\n` +
            `¿En qué puedo ayudarte?\n\n` +
            `1️⃣ 📅 Agendar cita\n` +
            `2️⃣ 📋 Ver mis citas\n` +
            `3️⃣ 🏥 Servicios\n` +
            `4️⃣ 🕐 Horarios\n` +
            `5️⃣ 📍 Ubicación\n\n` +
            `Escribe el número de tu opción`;
}

function getServicesList(business) {
  const services = business.services.map(s => typeof s === 'object' ? s.name : s);
  return services.map((service, i) => `${i + 1}️⃣ ${service}`).join('\n');
}

function getServicesInfo(business) {
  const services = business.services.map(s => typeof s === 'object' ? s.name : s);
  return `🦷 *Nuestros Servicios*\n\n` +
            services.map(s => `• ${s}`).join('\n') +
            `\n\n¿Agendar cita? Escribe *1*`;
}

function getScheduleInfo(business) {
  return `🕐 *Horarios*\n\n` +
            `Lunes a Viernes: ${business.schedule.weekdays}\n` +
            `Sábados: ${business.schedule.saturday}\n` +
            `Domingos: ${business.schedule.sunday}\n\n` +
            `¿Agendar? Escribe *1*`;
}

function getLocationInfo(business) {
  return `📍 *Ubicación*\n\n` +
            `${business.address}\n\n` +
            `📞 ${business.whatsappBusiness}\n\n` +
            `¿Agendar? Escribe *1*`;
}

function getErrorMessage(business) {
  return `⚠️ Error\n\nContacta: ${business.whatsappBusiness}`;
}

function isGreeting(msg) {
  const greetings = ['hola', 'hi', 'hello', 'buenas', 'hey'];
  return greetings.some(g => msg.includes(g));
}

module.exports = { processBotMessage, ConversationManager };
