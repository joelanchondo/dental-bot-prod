// 🎭 BOT DEMO - VERSIÓN FUNCIONAL PARA VENTAS
// Muestra flujo COMPLETO y REAL para demostraciones

const ConversationManager = require('./conversationManager');

async function processBotMessage(business, message, phone) {
  const msg = message.toLowerCase().trim();
  const state = ConversationManager.getState(phone);

  console.log(`🤖 [DEMO][${phone}] Negocio: ${business.businessName} | Mensaje: "${message}"`);

  try {
    // MENÚ PRINCIPAL
    if (isGreeting(msg) || msg === 'menu' || msg === '0') {
      ConversationManager.clearState(phone);
      return getMainMenu(business);
    }

    // AGENDAR CITA - FLUJO REAL COMPLETO
    if (msg === '1' || msg.includes('agendar')) {
      ConversationManager.updateState(phone, {
        flow: 'appointment',
        step: 'get_name'
      });
      return `📅 *Agendar Cita*\n\n¿Cuál es tu nombre completo?`;
    }

    // FLUJO DE AGENDADO REAL
    if (state.flow === 'appointment') {
      return handleAppointmentFlow(business, msg, phone, state);
    }

    // OTRAS OPCIONES
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

    return getMainMenu(business);

  } catch (error) {
    console.error('❌ Error en BOT DEMO:', error);
    return `¡Hola! Soy el asistente de ${business.businessName}. Escribe "menu" para ver opciones.`;
  }
}

// FUNCIONES DEL FLUJO REAL
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
      const services = ['Limpieza Dental', 'Extracción Dental', 'Blanqueamiento', 'Ortodoncia Consulta'];
      const serviceIndex = parseInt(msg) - 1;
      const serviceName = services[serviceIndex] || 'Consulta Dental';
      
      state.data.service = serviceName;
      ConversationManager.clearState(phone);

      // 🎯 URL DEL CALENDARIO REAL - CON BUSINESS ID REAL
      const clientPhone = phone.replace('whatsapp:', '');
      const BASE_URL = "https://dental-bot-prod.onrender.com";
      
      // Usar business._id REAL (no hardcode) para mostrar flujo completo
      const businessId = business._id || '6925da1ba0579edd59ed7aec';
      
      const calendarUrl = `${BASE_URL}/calendar-dashboard?` +
        `businessId=${businessId}&` +
        `clientName=${encodeURIComponent(state.data.name)}&` +
        `service=${encodeURIComponent(serviceName)}&` +
        `phone=${clientPhone}`;

      return `📅 *Selecciona tu cita*\n\n` +
             `Hola ${state.data.name}, selecciona fecha y hora para tu servicio: *"${serviceName}"*\n\n` +
             `${calendarUrl}\n\n` +
             `✨ *Características que verás:*\n` +
             `• Calendario interactivo real\n` +
             `• Guardado en base de datos\n` +
             `• Confirmación por WhatsApp\n` +
             `• Cierre automático\n\n` +
             `*La disponibilidad se actualiza en tiempo real.*`;

    default:
      ConversationManager.clearState(phone);
      return getMainMenu(business);
  }
}

module.exports = { processBotMessage };
