// 🎭 BOT DEMO - VERSIÓN ESTABLE (NO CAMBIAR)
// Para demostraciones de ventas - Siempre funciona

const ConversationManager = require('./conversationManager');

async function processBotMessage(business, message, phone) {
  const msg = message.toLowerCase().trim();
  const state = ConversationManager.getState(phone);

  console.log(`🤖 [DEMO][${phone}] Negocio: ${business.businessName} | Mensaje: "${message}"`);

  try {
    // MENÚ PRINCIPAL - SIEMPRE FUNCIONA
    if (isGreeting(msg) || msg === 'menu' || msg === '0') {
      ConversationManager.clearState(phone);
      return getMainMenu(business);
    }

    // AGENDAR CITA - FLUJO COMPLETO Y ESTABLE
    if (msg === '1' || msg.includes('agendar')) {
      ConversationManager.updateState(phone, {
        flow: 'appointment',
        step: 'get_name'
      });
      return `📅 *Agendar Cita*\n\n¿Cuál es tu nombre completo?`;
    }

    // FLUJO DE AGENDADO - PROBADO Y FUNCIONA
    if (state.flow === 'appointment') {
      return handleAppointmentFlow(business, msg, phone, state);
    }

    // OTRAS OPCIONES - RESPuestas fijas
    if (msg === '2') {
      return `📋 *Ver Mis Citas*\n\n✅ En la versión Pro podrás ver todas tus citas programadas.`;
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

    // FALLBACK AL MENÚ PRINCIPAL
    return getMainMenu(business);

  } catch (error) {
    console.error('❌ Error en BOT DEMO:', error);
    return `¡Hola! Soy el asistente de ${business.businessName}. Escribe "menu" para ver opciones.`;
  }
}

// FUNCIONES ESTABLES - NO MODIFICAR
function isGreeting(msg) {
  return ['hola', 'hi', 'hello', 'buenas', 'hey'].includes(msg);
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

function getServicesInfo(business) {
  return `🏥 *Nuestros Servicios*\n\n` +
    `• Limpieza dental profesional\n` +
    `• Extracciones dentales\n` +
    `• Blanqueamiento dental\n` +
    `• Ortodoncia\n` +
    `• Implantes dentales\n\n` +
    `💫 *Incluye consulta de evaluación*`;
}

function getScheduleInfo(business) {
  return `🕐 *Horarios de Atención*\n\n` +
    `Lunes a Viernes: 9:00 AM - 6:00 PM\n` +
    `Sábados: 9:00 AM - 2:00 PM\n` +
    `Domingos: Cerrado`;
}

function getLocationInfo(business) {
  return `📍 *Nuestra Ubicación*\n\n` +
    `Av. Principal #123\n` +
    `Col. Centro\n` +
    `Ciudad de México\n\n` +
    `📞 +52 123 456 7890`;
}

async function handleAppointmentFlow(business, msg, phone, state) {
  switch (state.step) {
    case 'get_name':
      state.data.name = msg;
      state.step = 'get_service';
      return `👋 Hola ${msg}! ¿Qué servicio necesitas?\n\n` + 
             `1️⃣ Limpieza dental\n` +
             `2️⃣ Extracción dental\n` +
             `3️⃣ Blanqueamiento\n` +
             `4️⃣ Ortodoncia consulta`;

    case 'get_service':
      const services = ['Limpieza dental', 'Extracción dental', 'Blanqueamiento', 'Ortodoncia consulta'];
      const serviceIndex = parseInt(msg) - 1;
      const serviceName = services[serviceIndex] || 'Consulta dental';
      
      state.data.service = serviceName;
      ConversationManager.clearState(phone);

      // URL DEL CALENDARIO DEMO - SIEMPRE FUNCIONA
      const clientPhone = phone.replace('whatsapp:', '');
      const BASE_URL = "https://dental-bot-prod.onrender.com";
      
      const calendarUrl = `${BASE_URL}/calendar-dashboard?` +
        `businessId=6925da1ba0579edd59ed7aec&` +
        `clientName=${encodeURIComponent(state.data.name)}&` +
        `service=${encodeURIComponent(serviceName)}&` +
        `phone=${clientPhone}`;

      return `📅 *Selecciona tu cita*\n\n` +
             `Hola ${state.data.name}, selecciona fecha y hora para: *"${serviceName}"*\n\n` +
             `${calendarUrl}\n\n` +
             `*La disponibilidad se actualiza en tiempo real.*`;

    default:
      ConversationManager.clearState(phone);
      return getMainMenu(business);
  }
}

module.exports = { processBotMessage };
