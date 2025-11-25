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

case 'get_service':        state.data.service = msg;        ConversationManager.clearState(phone); // Finalizar el flujo de conversación        // --- 🔑 GENERACIÓN DE URL DINÁMICA DEL CALENDARIO ---        const clientPhone = phone.replace('whatsapp:', ''); // Limpiar el prefijo 'whatsapp:'        const BASE_URL = process.env.RENDER_URL; // Usar la variable de entorno de Render                const calendarUrl = `${BASE_URL}/calendar-dashboard?` +                            `businessId=${business._id}` +                            `&clientName=${encodeURIComponent(state.data.name)}` +                            `&service=${encodeURIComponent(state.data.service)}` +                            `&phone=${clientPhone}`;        // -----------------------------------------------------        return `📅 *Selecciona tu cita*

Hola ${state.data.name}, selecciona una fecha y hora disponible para tu servicio: *${state.data.service}*

${calendarUrl}

*La disponibilidad se actualiza en tiempo real.* Si necesitas otra cosa, inicia un nuevo menú.`;    case 'confirm':
    case 'get_service':
      state.data.service = msg;
      state.step = 'confirm';
      
      // Crear cita para mañana a las 10 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      state.data.datetime = tomorrow;

      const dateStr = tomorrow.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });

      return `📋 *Resumen de Cita*\n\n` +
             `👤 *Paciente:* ${state.data.name}\n` +
             `🦷 *Servicio:* ${state.data.service}\n` +
             `📅 *Fecha:* ${dateStr}\n` +
             `⏰ *Hora:* 10:00 AM\n` +
             `📍 *Ubicación:* ${business.address}\n\n` +
             `*¿Confirmar esta cita?*\n\n` +
             `1️⃣ Sí, confirmar\n` +
             `2️⃣ Cambiar fecha\n` +
             `0️⃣ Cancelar`;

    case 'confirm':
      if (msg === '1' || msg.includes('si')) {
        try {
          const appointment = new Appointment({
            businessId: business._id,
            patient: {
              name: state.data.name,
              phone: phone
            },
            service: state.data.service,
            datetime: state.data.datetime,
            status: 'confirmada',
            source: 'whatsapp'
          });

          await appointment.save();
          ConversationManager.clearState(phone);

          return `🎉 *¡Cita Confirmada!*\n\n` +
                 `✅ Tu cita ha sido agendada\n\n` +
                 `📞 *Contacto:* ${business.whatsappBusiness}\n` +
                 `📍 *Dirección:* ${business.address}\n\n` +
                 `¡Te esperamos! 😊`;
        } catch (error) {
          return getErrorMessage(business);
        }
      }
      
      if (msg === '2') {
        return `📞 Para cambiar fecha/hora, contacta:\n${business.whatsappBusiness}`;
      }

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
