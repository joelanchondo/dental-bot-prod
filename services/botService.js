const Appointment = require('../models/Appointment');
const { getBusiness, generateServiceMenu, getServiceByIndex, getFormattedPrice } = require('../utils/botMenuGenerator');

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

  console.log(`🤖 [${phone}] Negocio: ${business.businessName} | Mensaje: "${message}" | Plan: ${business.plan || 'N/A'}`);

  try {
    // Obtener negocio actualizado con servicios dinámicos
    const updatedBusiness = await getBusiness(business._id);
    if (!updatedBusiness) {
      return '❌ Error: Negocio no encontrado en la base de datos.';
    }

    // MENÚ PRINCIPAL
    if (isGreeting(msg) || msg === 'menu' || msg === '0') {
      ConversationManager.clearState(phone);
      return generateServiceMenu(updatedBusiness);
    }

    // AGENDAR CITA (número 1)
    if (msg === '1' || msg.includes('agendar') || msg.includes('servicio')) {
      ConversationManager.updateState(phone, {
        flow: 'select_service',
        step: 'show_menu'
      });
      return generateServiceMenu(updatedBusiness);
    }

    // FLUJO DE SELECCIÓN DE SERVICIO (dinámico)
    if (state.flow === 'select_service') {
      return handleServiceSelection(updatedBusiness, msg, phone, state);
    }

    // FLUJO DE AGENDADO (mantener compatibilidad)
    if (state.flow === 'appointment') {
      return handleAppointmentFlow(updatedBusiness, msg, phone, state);
    }

    // OPCIONES ESPECÍFICAS (2-5) mantienen funcionalidad básica
    if (msg === '2') {
      return `📋 *Ver Mis Citas*\n\nEsta función estará disponible pronto.`;
    }

    if (msg === '3') {
      return getServicesInfo(updatedBusiness);
    }

    if (msg === '4') {
      return getScheduleInfo(updatedBusiness);
    }

    if (msg === '5') {
      return getLocationInfo(updatedBusiness);
    }

    // Si el mensaje es un número, es selección de servicio
    const number = parseInt(msg);
    if (!isNaN(number) && number > 0) {
      ConversationManager.updateState(phone, {
        flow: 'select_service',
        step: 'service_selected',
        data: { serviceIndex: number }
      });
      
      const selectedService = getServiceByIndex(updatedBusiness, number);
      if (!selectedService) {
        return '❌ Número inválido. Por favor, elige un número de la lista.\n\n' + 
               generateServiceMenu(updatedBusiness);
      }
      
      return `✅ *${selectedService.name}*\n\n` +
             `💰 Precio: $${selectedService.price}\n` +
             (selectedService.duration ? `⏱️ Duración: ${selectedService.duration} min\n` : '') +
             (selectedService.description ? `📝 ${selectedService.description}\n\n` : '\n') +
             '¿Deseas agendar este servicio? (Responde "sí" o "no")';
    }

    // Por defecto, mostrar menú dinámico
    return generateServiceMenu(updatedBusiness);

  } catch (error) {
    console.error('❌ Error en bot:', error);
    return '❌ Lo siento, hubo un error procesando tu solicitud. Por favor, intenta de nuevo.';
  }
}

async function handleServiceSelection(business, msg, phone, state) {
  switch (state.step) {
    case 'show_menu':
      const number = parseInt(msg);
      if (isNaN(number) || number <= 0) {
        return '❌ Por favor, responde con el número del servicio que deseas.\n\n' +
               generateServiceMenu(business);
      }
      
      const selectedService = getServiceByIndex(business, number);
      if (!selectedService) {
        return '❌ Número inválido. Por favor, elige un número de la lista.\n\n' +
               generateServiceMenu(business);
      }
      
      ConversationManager.updateState(phone, {
        step: 'confirm_service',
        data: { ...state.data, selectedService }
      });
      
      return `✅ *${selectedService.name}*\n\n` +
             `💰 Precio: $${selectedService.price}\n` +
             (selectedService.duration ? `⏱️ Duración: ${selectedService.duration} min\n` : '') +
             (selectedService.description ? `📝 ${selectedService.description}\n\n` : '\n') +
             '¿Deseas agendar este servicio? (Responde "sí" o "no")';

    case 'confirm_service':
      if (msg.includes('sí') || msg.includes('si') || msg.includes('yes')) {
        ConversationManager.updateState(phone, {
          flow: 'appointment',
          step: 'get_name',
          data: { 
            service: state.data.selectedService.name,
            servicePrice: state.data.selectedService.price,
            serviceDuration: state.data.selectedService.duration
          }
        });
        return `📅 *Agendar ${state.data.selectedService.name}*\n\n¿Cuál es tu nombre completo?`;
      } else {
        ConversationManager.clearState(phone);
        return '✅ Entendido. ¿Qué otra cosa necesitas?\n\n' +
               generateServiceMenu(business);
      }

    default:
      ConversationManager.updateState(phone, { step: 'show_menu' });
      return generateServiceMenu(business);
  }
}

async function handleAppointmentFlow(business, msg, phone, state) {
  switch (state.step) {
    case 'get_name':
      ConversationManager.updateState(phone, {
        step: 'get_phone',
        data: { ...state.data, name: msg }
      });
      return `📞 *Confirmación de Teléfono*\n\nPor favor confirma tu número de WhatsApp (solo dígitos, sin espacios ni símbolos):`;

    case 'get_phone':
      const clientPhone = msg.replace(/\D/g, '');
      if (clientPhone.length < 10) {
        return '❌ Número inválido. Por favor ingresa solo dígitos (ejemplo: 5512345678):';
      }
      
      ConversationManager.updateState(phone, {
        step: 'select_date',
        data: { ...state.data, phone: clientPhone }
      });
      
      const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
      const calendarUrl = `${BASE_URL}/calendar-dashboard?` +
        `businessId=${business._id}&` +
        `clientName=${encodeURIComponent(state.data.name)}&` +
        `service=${encodeURIComponent(state.data.service)}&` +
        `phone=${clientPhone}`;

      return `📅 *Selecciona tu cita*\n\nHola ${state.data.name}, selecciona una fecha y hora disponible para tu servicio: *"${state.data.service}"*\n\n${calendarUrl}\n\n*La disponibilidad se actualiza en tiempo real.* Si necesitas otra cosa, escribe "menú".`;

    default:
      ConversationManager.updateState(phone, { step: 'get_name' });
      return `📅 *Agendar Cita*\n\n¿Cuál es tu nombre completo?`;
  }
}

// Funciones auxiliares (mantener compatibilidad)
function isGreeting(msg) {
  const greetings = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello', 'hey'];
  return greetings.some(g => msg.includes(g));
}

function getServicesInfo(business) {
  // Usar servicios dinámicos si existen
  if (business.services && business.services.length > 0) {
    const activeServices = business.services.filter(s => s.active);
    if (activeServices.length > 0) {
      let response = `🦷 *Servicios de ${business.businessName}*\n\n`;
      activeServices.forEach(service => {
        response += `• *${service.name}*`;
        if (service.price) response += ` - $${service.price}`;
        if (service.duration) response += ` (${service.duration} min)`;
        if (service.description) response += `\n   ${service.description}`;
        response += '\n\n';
      });
      return response;
    }
  }
  
  // Fallback a texto estático
  return `🦷 *Nuestros Servicios*\n\n` +
         `• Limpieza dental completa\n` +
         `• Blanqueamiento dental\n` +
         `• Ortodoncia (brackets)\n` +
         `• Implantes dentales\n` +
         `• Carillas estéticas\n` +
         `• Urgencias dentales\n\n` +
         `*Para ver precios y agendar, escribe "1" o "agendar".*`;
}

function getScheduleInfo(business) {
  return `🕒 *Horario de Atención*\n\n` +
         `• Lunes a Viernes: 9:00 AM - 7:00 PM\n` +
         `• Sábados: 9:00 AM - 2:00 PM\n` +
         `• Domingos: Cerrado\n\n` +
         `*Para emergencias fuera de horario, llama al: ${business.phone || 'N/A'}*`;
}

function getLocationInfo(business) {
  return `📍 *Nuestra Ubicación*\n\n` +
         `Dirección: ${business.address || 'Por definir'}\n\n` +
         `*¿Necesitas indicaciones?* Responde "maps" para obtener enlace.`;
}

module.exports = {
  processBotMessage,
  ConversationManager
};
