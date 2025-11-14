const Appointment = require('../models/Appointment');

// Estado en memoria (en producción real usar Redis)
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

  console.log(`🤖 [${phone}] Mensaje: "${message}" | Estado: ${state.step || 'inicial'}`);

  try {
    // Plan Básico: respuestas simples
    if (business.plan === 'basico') {
      return getBasicResponse(business, msg);
    }

    // Plan Profesional/Premium: flujo completo
    return await getSmartResponse(business, msg, phone, state);
  } catch (error) {
    console.error('❌ Error procesando mensaje:', error);
    return getErrorMessage(business);
  }
}

// ============================================
// RESPUESTAS PLAN BÁSICO
// ============================================
function getBasicResponse(business, msg) {
  if (msg.includes('horario') || msg === '4') {
    return `🕐 *Horario de Atención*\n\n` +
           `📅 Lunes a Viernes\n${business.schedule.weekdays}\n\n` +
           `📅 Sábados\n${business.schedule.saturday}\n\n` +
           `📅 Domingos\n${business.schedule.sunday}`;
  }

  if (msg.includes('ubicacion') || msg.includes('direccion') || msg === '5') {
    return `📍 *Nuestra Ubicación*\n\n${business.address}\n\n` +
           `📞 Teléfono: ${business.phone}`;
  }

  if (msg.includes('servicio') || msg === '3') {
    return `🦷 *Nuestros Servicios*\n\n` +
           business.services.map(s => `• ${s}`).join('\n') +
           `\n\n📞 Para agendar llama: ${business.phone}`;
  }

  if (msg.includes('agendar') || msg.includes('cita') || msg === '1') {
    return `📅 *Para agendar tu cita*\n\n` +
           `Por favor llámanos:\n📞 ${business.phone}\n\n` +
           `O envíanos:\n` +
           `• Tu nombre completo\n` +
           `• Servicio que necesitas\n` +
           `• Fecha y hora preferida`;
  }

  // Menú principal
  return `👋 ¡Hola! Soy el asistente de *${business.name}*\n\n` +
         `¿En qué puedo ayudarte?\n\n` +
         `1️⃣ Agendar cita\n` +
         `2️⃣ Ver mi cita\n` +
         `3️⃣ Servicios\n` +
         `4️⃣ Horarios\n` +
         `5️⃣ Ubicación\n\n` +
         `Escribe el número de tu opción`;
}

// ============================================
// RESPUESTAS PLAN PROFESIONAL/PREMIUM
// ============================================
async function getSmartResponse(business, msg, phone, state) {
  // Buscar cita existente
  const existingAppointment = await Appointment.findOne({
    businessId: business._id,
    'patient.phone': phone,
    datetime: { $gte: new Date() },
    status: { $in: ['confirmada', 'pendiente'] }
  });

  // SALUDOS - Mostrar menú principal
  if (isGreeting(msg)) {
    ConversationManager.clearState(phone);
    return getWelcomeMenu(business, existingAppointment);
  }

  // MENÚ - Volver al inicio
  if (msg === 'menu' || msg === 'menú' || msg === '0') {
    ConversationManager.clearState(phone);
    return getMainMenu(business, existingAppointment);
  }

  // Si está en flujo de agendado
  if (state.flow === 'appointment') {
    return handleAppointmentFlow(business, msg, phone, state);
  }

  // Si tiene cita y está en flujo de gestión
  if (state.flow === 'manage_appointment') {
    return handleManageAppointment(business, msg, phone, state, existingAppointment);
  }

  // ============================================
  // OPCIONES DEL MENÚ PRINCIPAL
  // ============================================

  // 1. AGENDAR CITA
  if (msg === '1' || msg.includes('agendar')) {
    if (existingAppointment) {
      ConversationManager.updateState(phone, { 
        flow: 'manage_appointment', 
        step: 'options' 
      });
      return `📋 *Ya tienes una cita programada*\n\n` +
             formatAppointmentDetail(existingAppointment) +
             `\n\n*¿Qué deseas hacer?*\n\n` +
             `1️⃣ Cancelar esta cita\n` +
             `2️⃣ Reagendar (cambiar fecha/hora)\n` +
             `3️⃣ Agendar otra cita adicional\n` +
             `0️⃣ Volver al menú\n\n` +
             `Escribe el número:`;
    }

    ConversationManager.updateState(phone, { 
      flow: 'appointment', 
      step: 'select_service' 
    });
    return getServiceSelectionMenu(business);
  }

  // 2. CONSULTAR MI CITA
  if (msg === '2' || msg.includes('mi cita') || msg.includes('consultar')) {
    if (!existingAppointment) {
      return `❌ *No tienes citas programadas*\n\n` +
             `¿Quieres agendar una?\n\n` +
             `Escribe *1* o *agendar*`;
    }

    ConversationManager.updateState(phone, { 
      flow: 'manage_appointment', 
      step: 'options' 
    });
    return `📅 *Tu Cita Programada*\n\n` +
           formatAppointmentDetail(existingAppointment) +
           `\n\n*Opciones:*\n\n` +
           `1️⃣ Cancelar cita\n` +
           `2️⃣ Reagendar cita\n` +
           `0️⃣ Volver al menú\n\n` +
           `Escribe el número:`;
  }

  // 3. SERVICIOS
  if (msg === '3' || msg.includes('servicio')) {
    return getServicesInfo(business);
  }

  // 4. HORARIOS
  if (msg === '4' || msg.includes('horario')) {
    return getScheduleInfo(business);
  }

  // 5. UBICACIÓN
  if (msg === '5' || msg.includes('ubicacion') || msg.includes('direccion')) {
    return getLocationInfo(business);
  }

  // 6. EMERGENCIA (solo si lo mencionan)
  if (msg.includes('emergencia') || msg.includes('urgente')) {
    return getEmergencyInfo(business);
  }

  // Default: Menú principal
  return getMainMenu(business, existingAppointment);
}

// ============================================
// FLUJO DE AGENDADO
// ============================================
async function handleAppointmentFlow(business, msg, phone, state) {
  switch (state.step) {
    case 'select_service':
      return handleServiceSelection(business, msg, phone, state);
    
    case 'enter_name':
      return handleNameEntry(business, msg, phone, state);
    
    case 'confirm_date':
      return handleDateConfirmation(business, msg, phone, state);
    
    default:
      state.step = 'select_service';
      return getServiceSelectionMenu(business);
  }
}

function handleServiceSelection(business, msg, phone, state) {
  // Por número
  const serviceIndex = parseInt(msg) - 1;
  if (serviceIndex >= 0 && serviceIndex < business.services.length) {
    const service = business.services[serviceIndex];
    state.data.service = service;
    state.step = 'enter_name';
    
    return `✅ *${service}*\n\n` +
           `Excelente elección! 😊\n\n` +
           `👤 *¿Cuál es tu nombre completo?*\n\n` +
           `_(Ejemplo: María González López)_`;
  }

  // Por texto
  const matchedService = business.services.find(s => 
    s.toLowerCase().includes(msg) || msg.includes(s.toLowerCase())
  );
  
  if (matchedService) {
    state.data.service = matchedService;
    state.step = 'enter_name';
    
    return `✅ *${matchedService}*\n\n` +
           `Perfecto! 😊\n\n` +
           `👤 *¿Cuál es tu nombre completo?*\n\n` +
           `_(Ejemplo: Carlos Rodríguez)_`;
  }

  return `❌ No reconocí el servicio\n\n` +
         `Por favor elige un número:\n\n` +
         getServicesList(business);
}

function handleNameEntry(business, msg, phone, state) {
  if (msg.length < 3) {
    return `⚠️ El nombre es muy corto\n\n` +
           `Por favor escribe tu *nombre completo*:`;
  }

  state.data.name = capitalizeWords(msg);
  state.step = 'confirm_date';

  // Fecha automática: mañana 10:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  state.data.datetime = tomorrow;

  const dateStr = tomorrow.toLocaleDateString('es-MX', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return `👋 *Hola ${state.data.name}!*\n\n` +
         `📋 *Resumen de tu cita:*\n\n` +
         `🦷 Servicio: ${state.data.service}\n` +
         `📅 Fecha: ${dateStr}\n` +
         `⏰ Hora: 10:00 AM\n` +
         `📍 ${business.address}\n\n` +
         `*¿Confirmas esta cita?*\n\n` +
         `1️⃣ Sí, confirmar\n` +
         `2️⃣ Cambiar fecha/hora\n` +
         `0️⃣ Cancelar\n\n` +
         `Escribe el número:`;
}

async function handleDateConfirmation(business, msg, phone, state) {
  // CONFIRMAR
  if (msg === '1' || msg.includes('si') || msg.includes('sí') || msg.includes('confirm')) {
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

      const dateStr = state.data.datetime.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });

      return `🎉 *¡Cita Confirmada Exitosamente!*\n\n` +
             `✅ Tu cita está agendada\n\n` +
             `📋 *Detalles:*\n` +
             `👤 ${state.data.name}\n` +
             `🦷 ${state.data.service}\n` +
             `📅 ${dateStr}\n` +
             `⏰ 10:00 AM\n` +
             `📍 ${business.address}\n\n` +
             `📞 Contacto: ${business.phone}\n\n` +
             `*Recomendaciones:*\n` +
             `• Llega 10 min antes ⏱️\n` +
             `• Trae identificación 📋\n\n` +
             `Te enviaremos recordatorios 🔔\n\n` +
             `¡Nos vemos pronto! 😊`;
    } catch (error) {
      console.error('Error creando cita:', error);
      return getErrorMessage(business);
    }
  }

  // CAMBIAR FECHA
  if (msg === '2' || msg.includes('cambiar')) {
    return `📞 *Para personalizar tu fecha/hora*\n\n` +
           `Por favor contáctanos directamente:\n\n` +
           `📱 ${business.phone}\n\n` +
           `También puedes escribir *0* para volver al menú`;
  }

  // CANCELAR
  if (msg === '0' || msg.includes('cancelar') || msg.includes('menu')) {
    ConversationManager.clearState(phone);
    return getMainMenu(business);
  }

  return `❌ No entendí tu respuesta\n\n` +
         `*¿Confirmas tu cita?*\n\n` +
         `1️⃣ Sí, confirmar\n` +
         `2️⃣ Cambiar fecha/hora\n` +
         `0️⃣ Cancelar\n\n` +
         `Escribe el número:`;
}

// ============================================
// GESTIÓN DE CITAS EXISTENTES
// ============================================
async function handleManageAppointment(business, msg, phone, state, appointment) {
  // CANCELAR
  if (msg === '1' || msg.includes('cancelar')) {
    try {
      appointment.status = 'cancelada';
      await appointment.save();
      ConversationManager.clearState(phone);

      return `✅ *Cita Cancelada*\n\n` +
             `Tu cita ha sido cancelada exitosamente\n\n` +
             `¿Quieres agendar una nueva?\n\n` +
             `Escribe *1* o *agendar*`;
    } catch (error) {
      return getErrorMessage(business);
    }
  }

  // REAGENDAR
  if (msg === '2' || msg.includes('reagendar')) {
    try {
      appointment.status = 'cancelada';
      await appointment.save();
      
      ConversationManager.updateState(phone, {
        flow: 'appointment',
        step: 'select_service',
        data: {}
      });

      return `🔄 *Cita anterior cancelada*\n\n` +
             `Ahora agendemos tu nueva cita:\n\n` +
             getServiceSelectionMenu(business);
    } catch (error) {
      return getErrorMessage(business);
    }
  }

  // AGENDAR ADICIONAL
  if (msg === '3') {
    ConversationManager.updateState(phone, {
      flow: 'appointment',
      step: 'select_service',
      data: {}
    });
    return getServiceSelectionMenu(business);
  }

  // MENÚ
  if (msg === '0') {
    ConversationManager.clearState(phone);
    return getMainMenu(business);
  }

  return `❌ Opción no válida\n\n` +
         `Escribe el número de tu opción (0-3)`;
}

// ============================================
// MENÚS Y FORMATOS
// ============================================
function getWelcomeMenu(business, existingAppointment) {
  let menu = `👋 *¡Bienvenido a ${business.name}!* ✨\n\n`;
  
  if (existingAppointment) {
    menu += `📋 *Tienes una cita programada* ✅\n\n`;
  }

  menu += `🦷 *Tu sonrisa es nuestra prioridad*\n\n` +
          `*¿Cómo puedo ayudarte?*\n\n` +
          `1️⃣ 📅 Agendar cita\n` +
          `2️⃣ 📋 Ver mis citas\n` +
          `3️⃣ 🏥 Servicios\n` +
          `4️⃣ 🕐 Horarios\n` +
          `5️⃣ 📍 Ubicación\n\n` +
          `_Escribe el número o lo que necesites_`;

  return menu;
}

function getMainMenu(business, existingAppointment) {
  return getWelcomeMenu(business, existingAppointment);
}

function getServiceSelectionMenu(business) {
  return `🦷 *Selecciona tu servicio:*\n\n` +
         getServicesList(business) +
         `\n\n_Escribe el número del servicio_`;
}

function getServicesList(business) {
  return business.services
    .map((service, i) => `${i + 1}️⃣ ${service}`)
    .join('\n');
}

function getServicesInfo(business) {
  return `🏥 *Nuestros Servicios* ✨\n\n` +
         business.services.map(s => `• ${s}`).join('\n') +
         `\n\n💫 *Incluye:*\n` +
         `• Consulta de evaluación\n` +
         `• Plan de tratamiento personalizado\n` +
         `• Seguimiento post-tratamiento\n\n` +
         `¿Quieres agendar?\n` +
         `Escribe *1* o *agendar*`;
}

function getScheduleInfo(business) {
  return `🕐 *Horarios de Atención* ⏰\n\n` +
         `📅 *Lunes a Viernes*\n${business.schedule.weekdays}\n\n` +
         `📅 *Sábados*\n${business.schedule.saturday}\n\n` +
         `📅 *Domingos*\n${business.schedule.sunday}\n\n` +
         `¿Agendar cita? Escribe *1*`;
}

function getLocationInfo(business) {
  return `📍 *Nuestra Ubicación* 🗺️\n\n` +
         `${business.address}\n\n` +
         `📞 *Contacto:*\n${business.phone}\n\n` +
         `¿Agendar cita? Escribe *1*`;
}

function getEmergencyInfo(business) {
  return `🚨 *Emergencia Dental* 🆘\n\n` +
         `Si tienes una emergencia, contáctanos inmediatamente:\n\n` +
         `📞 *${business.phone}*\n\n` +
         `Atendemos emergencias en horario laboral\n\n` +
         `Escribe *0* para volver al menú`;
}

function formatAppointmentDetail(appointment) {
  const fecha = appointment.datetime.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const hora = appointment.datetime.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `📅 *Fecha:* ${fecha}\n` +
         `⏰ *Hora:* ${hora}\n` +
         `🦷 *Servicio:* ${appointment.service}\n` +
         `👤 *Paciente:* ${appointment.patient.name}`;
}

function getErrorMessage(business) {
  return `⚠️ *Ups! Algo salió mal*\n\n` +
         `Por favor intenta de nuevo o contáctanos:\n\n` +
         `📞 ${business.phone}\n\n` +
         `Escribe *menu* para volver al inicio`;
}

// ============================================
// UTILIDADES
// ============================================
function isGreeting(msg) {
  const greetings = ['hola', 'hi', 'hello', 'buenas', 'hey', 'ola', 'buenos dias', 'buenas tardes', 'buenas noches'];
  return greetings.some(g => msg.includes(g));
}

function capitalizeWords(str) {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

module.exports = { processBotMessage, ConversationManager };
