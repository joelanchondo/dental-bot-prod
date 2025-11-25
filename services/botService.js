const Appointment = require('../models/Appointment');
const TemplateIntegration = require('./templateIntegration');

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

  console.log("🔍 [BOT DEBUG] Business object received:", JSON.stringify({
    _id: business._id,
    businessName: business.businessName, 
    businessType: business.businessType,
    whatsappBusiness: business.whatsappBusiness,
    plan: business.plan,
    hasId: !!business._id,
    idType: typeof business._id
  }, null, 2));

  console.log("🔍 [BOT DEBUG] Business object:", JSON.stringify(business, null, 2));
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

  console.log(`🤖 [${phone}] Negocio: ${business.businessName} | Mensaje: "${message}" | Estado: ${state.step || 'inicial'}`);

  try {
    // 1. MEJORAR EL NEGOCIO CON CONFIGURACIÓN DEL TEMPLATE
    const enhancedBusiness = TemplateIntegration.getBusinessConfig(business);

    // 2. MEJORAR LOS SERVICIOS SI ES NECESARIO
    enhancedBusiness.services = TemplateIntegration.enhanceBusinessServices(business);

    if (enhancedBusiness.plan === 'basico') {
      const basicResponse = getBasicResponse(enhancedBusiness, msg);
      return TemplateIntegration.enhanceBotResponse(enhancedBusiness, msg, basicResponse);
    }

    const smartResponse = await getSmartResponse(enhancedBusiness, msg, phone, state);

    // 3. MEJORAR LA RESPUESTA FINAL CON EL TEMPLATE
    return TemplateIntegration.enhanceBotResponse(enhancedBusiness, msg, smartResponse);

  } catch (error) {
    console.error('❌ Error procesando mensaje:', error);
    return "⚠️ Lo siento, hubo un error. Por favor intenta de nuevo o contacta al: " + business.whatsappBusiness;
  }
}

function getBasicResponse(business, msg) {
  if (msg.includes('horario') || msg === '4') {
    return `🕐 *Horario de Atención*\n\n` +
           `📅 Lunes a Viernes\n${business.schedule.weekdays}\n\n` +
           `📅 Sábados\n${business.schedule.saturday}\n\n` +
           `📅 Domingos\n${business.schedule.sunday}`;
  }

  if (msg.includes('ubicacion') || msg.includes('direccion') || msg === '5') {
    return `📍 *Nuestra Ubicación*\n\n${business.address}\n\n` +
           `📞 WhatsApp: ${business.whatsappBusiness}`;
  }

  if (msg.includes('servicio') || msg === '3') {
    const servicesList = business.services.map(s => typeof s === 'object' ? s.name : s).map(s => `• ${s}`).join('\n');
    return `🦷 *Nuestros Servicios*\n\n` +
           servicesList +
           `\n\n📞 Para agendar: ${business.whatsappBusiness}`;
  }

  if (msg.includes('agendar') || msg.includes('cita') || msg === '1') {
    return `📅 *Para agendar tu cita*\n\n` +
           `Por favor escríbenos:\n📱 ${business.whatsappBusiness}\n\n` +
           `O inicia el proceso aquí:\n` +
           `• Escribe *1* para agendar cita`;
  }

  return `👋 ¡Hola! Soy el asistente de *${business.businessName}*\n\n` +
         `¿En qué puedo ayudarte?\n\n` +
         `1️⃣ Agendar cita\n` +
         `2️⃣ Ver mi cita\n` +
         `3️⃣ Servicios\n` +
         `4️⃣ Horarios\n` +
         `5️⃣ Ubicación\n\n` +
         `Escribe el número de tu opción`;
}

async function getSmartResponse(business, msg, phone, state) {
  const existingAppointment = await Appointment.findOne({
    businessId: business._id,
    'patient.phone': phone,
    datetime: { $gte: new Date() },
    status: { $in: ['confirmada', 'pendiente'] }
  });

  if (isGreeting(msg)) {
    ConversationManager.clearState(phone);
    return getWelcomeMenu(business, existingAppointment);
  }

  if (msg === 'menu' || msg === 'menú' || msg === '0') {
    ConversationManager.clearState(phone);
    return getMainMenu(business, existingAppointment);
  }

  if (state.flow === 'appointment') {
    return handleAppointmentFlow(business, msg, phone, state);
  }

  if (state.flow === 'manage_appointment') {
    return handleManageAppointment(business, msg, phone, state, existingAppointment);
  }

  // OPCIONES DEL MENÚ
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

  if (msg === '3' || msg.includes('servicio')) {
    return getServicesInfo(business);
  }

  if (msg === '4' || msg.includes('horario')) {
    return getScheduleInfo(business);
  }

  if (msg === '5' || msg.includes('ubicacion') || msg.includes('direccion')) {
    return getLocationInfo(business);
  }

  if (msg.includes('emergencia') || msg.includes('urgente')) {
    return getEmergencyInfo(business);
  }

  return getMainMenu(business, existingAppointment);
}

async function handleAppointmentFlow(business, msg, phone, state) {
  switch (state.step) {
    case 'select_service':
      return handleServiceSelection(business, msg, phone, state);

    case 'enter_name':
      return handleNameEntry(business, msg, phone, state);

    case 'select_date':
      return handleDateSelection(business, msg, phone, state);

    default:
      state.step = 'select_service';
      return getServiceSelectionMenu(business);
  }
}

function handleServiceSelection(business, msg, phone, state) {
  const serviceIndex = parseInt(msg) - 1;
  const servicesList = business.services.map(s => typeof s === 'object' ? s.name : s);
  
  if (serviceIndex >= 0 && serviceIndex < servicesList.length) {
    const service = servicesList[serviceIndex];
    state.data.service = service;
    state.step = 'enter_name';

    return `✅ *${service}*\n\n` +
           `Excelente elección! 😊\n\n` +
           `👤 *¿Cuál es tu nombre completo?*\n\n` +
           `_(Ejemplo: María González López)_`;
  }

  const matchedService = servicesList.find(s =>
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
  state.step = 'select_date';

  // Generar link al calendario visual
  const baseUrl = process.env.BASE_URL || 'https://dental-bot-prod.onrender.com';
  const calendarUrl = `${baseUrl}/calendar-dashboard?businessId=${business._id}&clientName=${encodeURIComponent(state.data.name)}&service=${encodeURIComponent(state.data.service)}&phone=${encodeURIComponent(phone)}`;

  return `👋 *Hola ${state.data.name}!*\n\n` +
         `📋 *Resumen de tu cita:*\n\n` +
         `🦷 Servicio: ${state.data.service}\n` +
         `👤 Paciente: ${state.data.name}\n\n` +
         `📅 *Para seleccionar fecha y hora:*\n\n` +
         `Haz clic en este enlace para elegir en el calendario:\n` +
         `${calendarUrl}\n\n` +
         `_Una vez que elijas la fecha, te confirmaremos por aquí_`;
}

function handleDateSelection(business, msg, phone, state) {
  return `📅 *Selección de Fecha*\n\n` +
         `Por favor usa el enlace del calendario que te envié anteriormente para seleccionar fecha y hora visualmente.\n\n` +
         `¿Necesitas que te reenvíe el enlace?`;
}

async function handleDateConfirmation(business, msg, phone, state) {
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
             `📞 Contacto: ${business.whatsappBusiness}\n\n` +
             `*Recomendaciones:*\n` +
             `• Llega 10 min antes ⏱️\n` +
             `• Trae identificación 📋\n\n` +
             `Te enviaremos recordatorios 🔔\n\n` +
             `¡Nos vemos pronto! 😊`;
    } catch (error) {
      console.error('Error al crear la cita:', error);
      return getErrorMessage(business);
    }
  }

  if (msg === '2' || msg.includes('cambiar')) {
    return `📞 *Para personalizar tu fecha/hora*\n\n` +
           `Por favor contáctanos directamente:\n\n` +
           `📱 ${business.whatsappBusiness}\n\n` +
           `También puedes escribir *0* para volver al menú`;
  }

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

async function handleManageAppointment(business, msg, phone, state, appointment) {
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

  if (msg === '3') {
    ConversationManager.updateState(phone, {
      flow: 'appointment',
      step: 'select_service',
      data: {}
    });
    return getServiceSelectionMenu(business);
  }

  if (msg === '0') {
    ConversationManager.clearState(phone);
    return getMainMenu(business);
  }

  return `❌ Opción no válida\n\nEscribe el número de tu opción (0-3)`;
}

function getWelcomeMenu(business, existingAppointment) {
  let menu = `👋 *¡Bienvenido a ${business.businessName}!* ✨\n\n`;

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
  const servicesList = business.services.map(s => typeof s === 'object' ? s.name : s);
  return servicesList
    .map((service, i) => `${i + 1}️⃣ ${service}`)
    .join('\n');
}

function getServicesInfo(business) {
  const servicesList = business.services.map(s => typeof s === 'object' ? s.name : s);
  return `🏥 *Nuestros Servicios* ✨\n\n` +
         servicesList.map(s => `• ${s}`).join('\n') +
         `\n\n💫 *Incluye:*\n` +
         `• Consulta de evaluación\n` +
         `• Plan de tratamiento personalizado\n` +
         `• Seguimiento post-tratamiento\n\n` +
         `¿Quieres agendar?\nEscribe *1* o *agendar*`;
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
         `📞 *Contacto:*\n${business.whatsappBusiness}\n\n` +
         `¿Agendar cita? Escribe *1*`;
}

function getEmergencyInfo(business) {
  return `🚨 *Emergencia Dental* 🆘\n\n` +
         `Si tienes una emergencia, contáctanos inmediatamente:\n\n` +
         `📞 *${business.whatsappBusiness}*\n\n` +
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
         `📞 ${business.whatsappBusiness}\n\n` +
         `Escribe *menu* para volver al inicio`;
}

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
