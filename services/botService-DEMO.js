const Appointment = require('../models/Appointment');
const { getBusiness, generateServiceMenu, getServiceByIndex } = require('../utils/botMenuGenerator');

// Estado en memoria con TTL de 30 minutos
const conversationStates = new Map();
const STATE_TTL = 30 * 60 * 1000; // 30 minutos

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
    const state = conversationStates.get(phone);

    // Limpiar estados expirados
    if (Date.now() - state.lastUpdate.getTime() > STATE_TTL) {
      conversationStates.delete(phone);
      return this.getState(phone);
    }

    return state;
  }

  static clearState(phone) {
    conversationStates.delete(phone);
  }

  static updateState(phone, updates) {
    const state = this.getState(phone);
    if (updates.data) {
      updates.data = { ...state.data, ...updates.data };
    }
    Object.assign(state, updates, { lastUpdate: new Date() });
  }
}

// ============================================================
// MENSAJES PRINCIPALES - Todo centralizado para fácil edición
// ============================================================

function getMainMenu(business) {
  return `✨ *Bienvenido a ${business.businessName}*

Soy tu asistente virtual. ¿En qué te puedo ayudar?

🔹 *1.* 📅 Agendar una cita
🔹 *2.* 📋 Ver mis citas
🔹 *3.* 🦷 Nuestros servicios
🔹 *4.* 🕒 Horarios
🔹 *5.* 📍 Ubicación

⬇️ Escribe el *número* de la opción que necesitas.`;
}

function getServiceSelectionMenu(business) {
  const services = business.services || [];
  if (services.length === 0) {
    return '❌ No tenemos servicios disponibles en este momento.';
  }

  let menu = `🦷 *Selecciona el servicio que deseas:*\n\n`;
  services.forEach((service, index) => {
    const duration = service.duration ? ` ⏱️ ${service.duration} min` : '';
    const price = service.price > 0 ? ` 💰 $${service.price}` : '';
    menu += `🔹 *${index + 1}.* ${service.name}${duration}${price}\n`;
  });
  menu += `\n⬇️ Escribe el *número* del servicio\n🔹 *0.* ← Volver al menú principal`;
  return menu;
}

// ============================================================
// DETECCIÓN INTELIGENTE DE INTENCIÓN
// ============================================================

function detectIntent(msg) {
  const text = msg.toLowerCase().trim();

  // Saludos
  if (/^(hola|buenos días|buenas tardes|buenas noches|hi|hello|hey|buen día|saludos)/.test(text)) {
    return 'greeting';
  }

  // Quieren agendar
  if (/^(agendar|cita|reservar|reserva|appointment|book|1)$/i.test(text)) {
    return 'schedule';
  }

  // Quieren ver sus citas
  if (/^(mis citas|ver citas|mis reservas|consultar|2)$/i.test(text)) {
    return 'my_appointments';
  }

  // Quieren ver servicios
  if (/^(servicios|qué hacen|qué ofrecen|tratamientos|3)$/i.test(text)) {
    return 'services';
  }

  // Quieren horarios
  if (/^(horario|horarios|qué días|cuándo|cuando|4)$/i.test(text)) {
    return 'schedule_info';
  }

  // Quieren ubicación
  if (/^(ubicación|ubicacion|dónde|donde|dirección|direccion|mapa|5)$/i.test(text)) {
    return 'location';
  }

  // Quieren cancelar
  if (/^(cancelar|cancelación|cancelacio)/i.test(text)) {
    return 'cancel';
  }

  // Confirmaciones
  if (/^(sí|si|yes|confirmar|ok|vale|dale|ya|confirmo)$/i.test(text)) {
    return 'confirm';
  }

  // Negaciones
  if (/^(no|nop|nah|cancelar|nope)$/i.test(text)) {
    return 'deny';
  }

  // Volver atrás
  if (/^(atrás|atras|volver|regresar|menú|menu|0)$/i.test(text)) {
    return 'back';
  }

  return null;
}

// ============================================================
// PROCESAMIENTO PRINCIPAL
// ============================================================

async function processBotMessage(business, message, phone) {
  const msg = message.toLowerCase().trim();
  const state = ConversationManager.getState(phone);
  const intent = detectIntent(msg);

  try {
    const updatedBusiness = await getBusiness(business._id);
    if (!updatedBusiness) {
      return '❌ Error: Negocio no encontrado.';
    }

    // ========================================
    // NAVEGACIÓN GLOBAL (funciona desde cualquier punto)
    // ========================================

    if (intent === 'greeting') {
      ConversationManager.clearState(phone);
      return getMainMenu(updatedBusiness);
    }

    if (intent === 'back' && state.flow) {
      // Si está en medio de un flujo, solo vuelve al paso anterior
      if (state.flow === 'select_service' || state.flow === 'appointment') {
        ConversationManager.clearState(phone);
      }
      return getMainMenu(updatedBusiness);
    }

    // ========================================
    // FLUJO DE SELECCIÓN DE SERVICIO
    // ========================================

    if (state.flow === 'select_service') {
      return await handleServiceSelection(updatedBusiness, msg, phone, state, intent);
    }

    // ========================================
    // FLUJO DE AGENDAR CITA
    // ========================================

    if (state.flow === 'appointment') {
      return await handleAppointmentFlow(updatedBusiness, msg, phone, state, intent);
    }

    // ========================================
    // SIN FLUJO ACTIVO - Menú principal
    // ========================================

    // Opción 1: Agendar
    if (intent === 'schedule') {
      ConversationManager.updateState(phone, {
        flow: 'select_service',
        step: 'waiting_service'
      });
      return getServiceSelectionMenu(updatedBusiness);
    }

    // Opción 2: Ver citas
    if (intent === 'my_appointments') {
      return await getMyAppointments(updatedBusiness, phone);
    }

    // Opción 3: Servicios
    if (intent === 'services') {
      return getServiceSelectionMenu(updatedBusiness) + '\n\n💡 *¿Quieres agendar?* Escribe "agendar" o selecciona un número.';
    }

    // Opción 4: Horarios
    if (intent === 'schedule_info') {
      return getScheduleInfo(updatedBusiness);
    }

    // Opción 5: Ubicación
    if (intent === 'location') {
      return getLocationInfo(updatedBusiness);
    }

    // ========================================
    // DETECTAR NÚMEROS SIN FLUJO (intento directo)
    // ========================================

    const number = parseInt(msg);
    if (!isNaN(number) && number > 0 && number <= 5) {
      // Es una opción del menú principal
      switch (number) {
        case 1:
          ConversationManager.updateState(phone, {
            flow: 'select_service',
            step: 'waiting_service'
          });
          return getServiceSelectionMenu(updatedBusiness);
        case 2:
          return await getMyAppointments(updatedBusiness, phone);
        case 3:
          return getServiceSelectionMenu(updatedBusiness) + '\n\n💡 *¿Quieres agendar?* Escribe "agendar" o selecciona un número.';
        case 4:
          return getScheduleInfo(updatedBusiness);
        case 5:
          return getLocationInfo(updatedBusiness);
      }
    }

    // ========================================
    // MENSAJE NO RECONOCIDO - AYUDA INTELIGENTE
    // ========================================

    return `🤔 No estoy seguro de entender "${message}"

 ${getMainMenu(updatedBusiness)}`;

  } catch (error) {
    console.error('❌ Error en bot:', error);
    return '✨ Hola, tuve un pequeño problema técnico. ¿Podrías escribir "hola" para reiniciar nuestra conversación?';
  }
}

// ============================================================
// FLUJO: SELECCIÓN DE SERVICIO
// ============================================================

async function handleServiceSelection(business, msg, phone, state, intent) {
  const number = parseInt(msg);

  // Volver al menú
  if (intent === 'back') {
    ConversationManager.clearState(phone);
    return getMainMenu(business);
  }

  // Esperando selección de servicio
  if (state.step === 'waiting_service') {

    // Detectar número de servicio
    if (!isNaN(number) && number > 0) {
      const selectedService = getServiceByIndex(business, number);

      if (selectedService) {
        ConversationManager.updateState(phone, {
          step: 'confirm_service',
          data: { selectedService }
        });
        return formatConfirmationMessage(selectedService);
      }
    }

    // Si escribió algo que no es un número válido
    return `❌ No encontré ese servicio.

 ${getServiceSelectionMenu(business)}`;
  }

  // Confirmando servicio seleccionado
  if (state.step === 'confirm_service') {

    if (intent === 'confirm') {
      if (!state.data.selectedService) {
        return '✨ Disculpa, ocurrió un error. Vamos a empezar de nuevo:\n\n' + getServiceSelectionMenu(business);
      }

      ConversationManager.updateState(phone, {
        flow: 'appointment',
        step: 'get_name',
        data: {
          service: state.data.selectedService.name,
          servicePrice: state.data.selectedService.price,
          serviceDuration: state.data.selectedService.duration
        }
      });

      return `📅 *¡Perfecto!*\n\nPara tu cita de *${state.data.selectedService.name}*, necesito unos datos:\n\n👉 *¿Cuál es tu nombre completo?*`;
    }

    if (intent === 'deny') {
      ConversationManager.updateState(phone, {
        step: 'waiting_service',
        data: {} // Limpiar servicio seleccionado
      });
      return `👌 *Sin problema.*\n\n${getServiceSelectionMenu(business)}`;
    }

    // No entendió la confirmación
    return `¿Confirmas *${state.data.selectedService.name}*?\n\n👉 Responde *"Sí"* para continuar o *"No"* para elegir otro servicio.`;
  }

  return getMainMenu(business);
}

// ============================================================
// FLUJO: AGENDAR CITA (Recopilar datos)
// ============================================================

async function handleAppointmentFlow(business, msg, phone, state, intent) {

  // Permitir cancelar en cualquier momento
  if (intent === 'cancel' || intent === 'deny') {
    ConversationManager.clearState(phone);
    return '✅ *Proceso cancelado.*\n\n' + getMainMenu(business);
  }

  // Paso 1: Obtener nombre
  if (state.step === 'get_name') {
    // Validar que no sea solo números o muy corto
    const nameClean = msg.replace(/\d/g, '').trim();
    if (nameClean.length < 2) {
      return '❌ Por favor escribe tu nombre completo (solo letras):';
    }

    ConversationManager.updateState(phone, {
      step: 'get_phone',
      data: { name: nameClean }
    });

    return `📞 *Gracias, ${nameClean.split(' ')[0]}.*\n\n¿Cuál es tu *número de WhatsApp* para enviarte el recordatorio?\n\n👉 Escribe los 10 dígitos (ej: 5512345678)`;
  }

  // Paso 2: Obtener teléfono
  if (state.step === 'get_phone') {
    const cleanPhone = msg.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      return `❌ El número está incompleto (${cleanPhone.length} dígitos).\n\n👉 Por favor escribe los 10 dígitos de tu WhatsApp:`;
    }

    if (cleanPhone.length > 10) {
      return `❌ El número tiene muchos dígitos (${cleanPhone.length}).\n\n👉 Solo necesito 10 dígitos:`;
    }

    ConversationManager.updateState(phone, {
      step: 'completed',
      data: { phone: cleanPhone }
    });

    // Generar enlace al calendario
    const calendarUrl = `${process.env.BASE_URL}/calendar-dashboard?` +
      `businessId=${business._id}&` +
      `clientName=${encodeURIComponent(state.data.name)}&` +
      `service=${encodeURIComponent(state.data.service)}&` +
      `phone=${cleanPhone}`;

    return `🎉 *¡Todo listo, ${state.data.name.split(' ')[0]}!*\n\n` +
      `📋 *Resumen:*\n` +
      `• Servicio: *${state.data.service}*\n` +
      `• Nombre: *${state.data.name}*\n` +
      `• Teléfono: *${cleanPhone}*\n\n` +
      `🔗 *Elige tu fecha y hora aquí:*\n${calendarUrl}\n\n` +
      `⏰ *Nota:* La disponibilidad se actualiza en tiempo real.\n\n` +
      `🔹 Escribe *"hola"* para volver al menú cuando termines.`;
  }

  return getMainMenu(business);
}

// ============================================================
// FUNCIONES DE SOPORTE
// ============================================================

async function getMyAppointments(business, phone) {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const appointments = await Appointment.find({
    businessId: business._id,
    clientPhone: { $regex: cleanPhone }
  }).sort({ dateTime: 1 }).limit(5);

  if (appointments.length === 0) {
    return `🔎 *No encontré citas* vinculadas a tu número.\n\n¿Quieres agendar una? Escribe *"1"* o *"agendar"*.`;
  }

  let response = `📅 *Tus Citas en ${business.businessName}:*\n\n`;

  appointments.forEach((app, i) => {
    const date = new Date(app.dateTime);
    const formattedDate = date.toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit'
    });

    response += `${i + 1}. *${app.service}*\n`;
    response += `   🗓️ ${formattedDate} | 🕒 ${formattedTime}\n`;
    response += `   ${app.status === 'confirmed' ? '✅ Confirmada' : '⏳ Pendiente'}\n\n`;
  });

  return response + '👉 Para cancelar o reagendar, contáctanos directamente.';
}

function formatConfirmationMessage(service) {
  let priceLine = '';
  if (service.price > 0) {
    priceLine = `   💰 Precio: $${service.price} MXN\n`;
  } else if (service.basePrice > 0) {
    priceLine = `   💰 Desde: $${service.basePrice} MXN\n`;
  }

  let durationLine = '';
  if (service.duration) {
    durationLine = `   ⏱️ Duración: ${service.duration} min\n`;
  }

  return `✨ *Has seleccionado:*\n` +
    `   🦷 ${service.name}\n` +
    `${priceLine}${durationLine}\n` +
    `👉 *¿Confirmas este servicio?*\n` +
    `   Escribe *"Sí"* para continuar\n` +
    `   Escribe *"No"* para elegir otro`;
}

function getScheduleInfo(business) {
  return `🕒 *Horario de Atención*\n\n` +
    `• Lunes a Viernes: 9:00 AM - 7:00 PM\n` +
    `• Sábados: 9:00 AM - 2:00 PM\n` +
    `• Domingos: Cerrado\n\n` +
    `📞 *Emergencias:* ${business.phone || 'Escríbenos por este chat'}`;
}

function getLocationInfo(business) {
  const address = business.address || 'Consultorio VERENA';
  return `📍 *Nuestra Ubicación*\n\n` +
    `   ${address}\n\n` +
    `🔹 Escribe *"hola"* para volver al menú.`;
}

module.exports = {
  processBotMessage,
  ConversationManager
};