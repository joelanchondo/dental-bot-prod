const Appointment = require('../models/Appointment');

// Enhanced user state management with better memory
const userStates = new Map();

// Rich emoji and icon system
const ICONS = {
  welcome: '👋',
  calendar: '📅',
  services: '🦷',
  time: '🕐',
  location: '📍',
  check: '✅',
  cross: '❌',
  star: '⭐',
  sparkle: '✨',
  phone: '📞',
  info: 'ℹ️',
  warning: '⚠️',
  heart: '❤️',
  smile: '😊',
  clock: '⏰',
  medical: '🏥',
  money: '💰',
  emergency: '🚨',
  wave: '👋',
  search: '🔍',
  map: '🗺️',
  car: '🚗',
  accessible: '♿',
  arrow: '➡️',
  back: '⬅️',
  next: '⏭️',
  finish: '🏁'
};

// Service-specific emojis
const SERVICE_ICONS = {
  'Limpieza dental': '✨',
  'Ortodoncia': '🦷',
  'Endodoncia': '🔧',
  'Implantes dentales': '📍',
  'Blanqueamiento': '💎',
  'Extracción de muelas': '🦷'
};

// Dynamic menu templates
const MENUS = {
  welcome: (businessName) => `${ICONS.welcome} *¡Bienvenido a ${businessName}!* ${ICONS.sparkle}\n\n` +
    `Soy tu asistente dental personal ${ICONS.smile}\n\n` +
    `*¿Cómo puedo ayudarte hoy?* ${ICONS.calendar}\n\n` +
    `${ICONS.services} 1️⃣ Agendar cita\n` +
    `${ICONS.clock} 2️⃣ Consultar mi cita\n` +
    `${ICONS.medical} 3️⃣ Nuestros servicios\n` +
    `${ICONS.time} 4️⃣ Horarios de atención\n` +
    `${ICONS.location} 5️⃣ Ubicación y contacto\n` +
    `${ICONS.emergency} 6️⃣ Emergencia dental\n\n` +
    `*También puedes escribir directamente lo que necesitas!*`,
    
  services: (services) => `${ICONS.medical} *Nuestros Servicios Especializados* ${ICONS.star}\n\n` +
    services.map((service, index) => 
      `${SERVICE_ICONS[service] || '🦷'} *${index + 1}.* ${service}`
    ).join('\n\n') + 
    `\n\n${ICONS.info} *Cada servicio incluye evaluación gratuita*\n` +
    `${ICONS.money} *Precios accesibles con múltiples opciones de pago*\n\n` +
    `${ICONS.calendar} ¿Te gustaría agendar una cita para alguno de estos servicios?`,
    
  servicesWithPrices: (services) => `${ICONS.medical} *Servicios y Precios* ${ICONS.money}\n\n` +
    services.map((service, index) => 
      `${SERVICE_ICONS[service] || '🦷'} *${index + 1}.* ${service}\n` +
      `${ICONS.money} Consulta precio en evaluación gratuita`
    ).join('\n\n') + `\n\n${ICONS.heart} *Tu sonrisa es nuestra prioridad*`,
    
  appointmentFlow: {
    serviceSelection: (services) => `${ICONS.calendar} *¡Excelente elección!* ${ICONS.sparkle}\n\n` +
      `${ICONS.services} *¿Qué servicio necesitas?*\n\n` +
      services.map((service, index) => 
        `${SERVICE_ICONS[service] || '🦷'} *${index + 1}.* ${service}`
      ).join('\n\n') +
      `\n${ICONS.info} *Tip: Escribe el número o el nombre del servicio*`,
      
    nameRequest: () => `${ICONS.heart} *Perfecto!* ${ICONS.check}\n\n` +
      `Ahora necesito conocer tu nombre completo ${ICONS.smile}\n\n` +
      `${ICONS.info} *Por favor, escribe tu nombre y apellido*\n` +
      `*Ejemplo: María González López*\n\n` +
      `${ICONS.sparkle} *Estamos a punto de darte esa sonrisa que mereces!*`,
      
    dateSelection: () => `${ICONS.calendar} *¡Hola!* ${ICONS.smile}\n\n` +
      `Ahora agendemos tu cita ${ICONS.clock}\n\n` +
      `${ICONS.info} *¿Para qué día te gustaría tu cita?*\n\n` +
      `*Opciones disponibles:*\n` +
      `📅 Escribe una fecha específica (ej: "martes 15")\n` +
      `🕐 O indica "esta semana", "próxima semana"\n` +
      `⚡ O "lo más pronto posible" para la primera disponibilidad\n\n` +
      `${ICONS.phone} *También puedes llamar para disponibilidad inmediata*`,
      
    timeSelection: (availableTimes) => `${ICONS.clock} *¡Tenemos disponibles estos horarios!* ${ICONS.sparkle}\n\n` +
      `*Elige la mejor opción para ti:*\n\n` +
      availableTimes.map((time, index) => 
        `⏰ *${index + 1}.* ${time}`
      ).join('\n\n') +
      `\n${ICONS.info} *Escribe el número de tu preferencia*`,
      
    confirmation: (appointmentData) => `${ICONS.check} *¡Estamos listos para confirmar!* ${ICONS.star}\n\n` +
      `*Detalles de tu cita:*\n\n` +
      `${ICONS.services} *Servicio:* ${appointmentData.service}\n` +
      `${ICONS.smile} *Nombre:* ${appointmentData.name}\n` +
      `${ICONS.calendar} *Fecha:* ${appointmentData.date}\n` +
      `${ICONS.clock} *Hora:* ${appointmentData.time}\n\n` +
      `${ICONS.heart} *¿Confirmamos esta cita?*\n\n` +
      `${ICONS.check} 1️⃣ Sí, confirmar\n` +
      `${ICONS.cross} 2️⃣ Cambiar fecha/hora\n` +
      `${ICONS.info} 3️⃣ Necesito más información`,
      
    success: (appointmentData) => `${ICONS.sparkle} *¡Cita confirmada exitosamente!* ${ICONS.star}\n\n` +
      `${ICONS.check} *Número de cita:* #${appointmentData.id}\n\n` +
      `*Resumen de tu cita:*\n` +
      `${ICONS.services} ${appointmentData.service}\n` +
      `${ICONS.calendar} ${appointmentData.date} a las ${appointmentData.time}\n\n` +
      `${ICONS.info} *Te enviaremos un recordatorio 24 horas antes*\n` +
      `${ICONS.phone} *Si necesitas cancelar, solo responde "cancelar cita"*\n\n` +
      `${ICONS.heart} *¡Nos vemos pronto! Tu sonrisa lo vale todo*`,
      
    emergency: () => `${ICONS.emergency} *¡Atención de Emergencia!* ${ICONS.warning}\n\n` +
      `Si tienes una emergencia dental grave:\n\n` +
      `${ICONS.phone} *Llama inmediatamente:* [Teléfono de emergencia]\n` +
      `${ICONS.clock} *Horario de emergencia:* 24/7 para casos urgentes\n\n` +
      `${ICONS.info} *Emergencias que atendemos:*\n` +
      `🦷 Dolor severo e insoportable\n` +
      `🦷 Traumatismo dental\n` +
      `🦷 Sangrado prolongado\n` +
      `🦷 Infección o hinchazón severa\n\n` +
      `${ICONS.heart} *Tu salud dental es nuestra prioridad*`
  }
};

// Enhanced state management
function getUserState(phone) {
  if (!userStates.has(phone)) {
    userStates.set(phone, {
      currentStep: null,
      appointmentData: {},
      lastInteraction: Date.now(),
      conversationHistory: [],
      preferences: {}
    });
  }
  return userStates.get(phone);
}

function updateUserState(phone, updates) {
  const state = getUserState(phone);
  Object.assign(state, updates, { lastInteraction: Date.now() });
  userStates.set(phone, state);
}

function clearUserState(phone) {
  userStates.delete(phone);
}

// Clean old states (24 hours)
function cleanupOldStates() {
  const now = Date.now();
  for (const [phone, state] of userStates.entries()) {
    if (now - state.lastInteraction > 24 * 60 * 60 * 1000) {
      userStates.delete(phone);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldStates, 60 * 60 * 1000);

// Enhanced main processing function
async function processBotMessage(business, message, phone) {
  const msg = message.toLowerCase().trim();
  const userState = getUserState(phone);
  
  // Add to conversation history
  userState.conversationHistory.push({
    timestamp: Date.now(),
    message: message,
    isUser: true
  });
  
  try {
    if (business.plan === 'basico') {
      return await getPredefinedResponse(business, msg, phone, userState);
    }
    
    return await getSmartResponse(business, msg, phone, userState);
  } catch (error) {
    console.error('Error processing message:', error);
    return `${ICONS.warning} *Lo siento, tuve un problema técnico* ${ICONS.cross}\n\n` +
           `${ICONS.phone} Por favor, inténtalo de nuevo o llama directamente al ${business.phone}`;
  }
}

// Enhanced predefined responses
async function getPredefinedResponse(business, msg, phone, userState) {
  // Check if user is in appointment flow first
  if (userState.currentStep) {
    return await handleAppointmentFlow(business, msg, phone, userState);
  }
  
  // Handle greetings in any context
  if (msg.includes('hola') || msg.includes('buenos') || msg.includes('buenas')) {
    if (userState.currentStep) {
      return `${ICONS.smile} *¡Hola de nuevo!* ${ICONS.wave}\n\n` +
        `Estamos en el proceso de agendar tu cita ${ICONS.calendar}\n\n` +
        `${ICONS.info} *Estás en el paso de:* ${getCurrentStepDescription(userState.currentStep)}\n\n` +
        `${ICONS.sparkle} *Continuemos donde nos quedamos...*`;
    }
    return MENUS.welcome(business.name);
  }
  
  // Main menu handlers
  if (msg.includes('horario') || msg.includes('hora') || msg === '4') {
    return formatHoursResponse(business);
  }
  
  if (msg.includes('ubicacion') || msg.includes('direccion') || msg.includes('donde') || msg === '5') {
    return formatLocationResponse(business);
  }
  
  if (msg.includes('servicio') || msg.includes('precio') || msg === '3') {
    return MENUS.services(business.services);
  }
  
  if (msg.includes('agendar') || msg.includes('cita') || msg === '1') {
    return startAppointmentFlow(business, phone, userState);
  }
  
  if (msg.includes('mi cita') || msg.includes('consultar') || msg === '2') {
    return await consultAppointment(business, phone, userState);
  }
  
  if (msg.includes('emergencia') || msg === '6') {
    clearUserState(phone);
    return MENUS.appointmentFlow.emergency();
  }
  
  // Default welcome message
  return MENUS.welcome(business.name);
}

// Enhanced smart responses
async function getSmartResponse(business, msg, phone, userState) {
  // Check if user is in appointment flow first
  if (userState.currentStep) {
    return await handleAppointmentFlow(business, msg, phone, userState);
  }
  
  // Handle greetings in any context
  if (msg.includes('hola') || msg.includes('buenos') || msg.includes('buenas')) {
    if (userState.currentStep) {
      return `${ICONS.smile} *¡Hola de nuevo!* ${ICONS.wave}\n\n` +
        `Estamos en el proceso de agendar tu cita ${ICONS.calendar}\n\n` +
        `${ICONS.info} *Estás en el paso de:* ${getCurrentStepDescription(userState.currentStep)}\n\n` +
        `${ICONS.sparkle} *Continuemos donde nos quedamos...*`;
    }
    return MENUS.welcome(business.name);
  }
  
  // Check for existing appointments
  const existingAppointment = await Appointment.findOne({
    businessId: business._id,
    'patient.phone': phone,
    datetime: { $gte: new Date() },
    status: { $in: ['confirmada', 'retrasada'] }
  });
  
  // Handle cancellation
  if (msg.includes('cancelar')) {
    return await handleCancellation(existingAppointment, phone);
  }
  
  // Main menu handlers with enhanced responses
  if (msg.includes('mi cita') || msg.includes('consultar') || msg === '2') {
    return await consultAppointmentSmart(business, existingAppointment, phone, userState);
  }
  
  if (msg.includes('agendar') || msg.includes('cita') || msg === '1') {
    return startAppointmentFlow(business, phone, userState);
  }
  
  if (msg.includes('servicio') || msg.includes('precio') || msg === '3') {
    return MENUS.servicesWithPrices(business.services);
  }
  
  if (msg.includes('horario') || msg.includes('hora') || msg === '4') {
    return formatHoursResponse(business);
  }
  
  if (msg.includes('ubicacion') || msg.includes('direccion') || msg.includes('donde') || msg === '5') {
    return formatLocationResponse(business);
  }
  
  if (msg.includes('emergencia') || msg === '6') {
    clearUserState(phone);
    return MENUS.appointmentFlow.emergency();
  }
  
  // Enhanced default response
  return MENUS.welcome(business.name);
}

// Start appointment flow
function startAppointmentFlow(business, phone, userState) {
  updateUserState(phone, {
    currentStep: 'selecting_service',
    appointmentData: {}
  });
  
  return MENUS.appointmentFlow.serviceSelection(business.services);
}

// Enhanced appointment flow handler
async function handleAppointmentFlow(business, msg, phone, userState) {
  switch (userState.currentStep) {
    case 'selecting_service':
      return await handleServiceSelection(business, msg, phone, userState);
    
    case 'entering_name':
      return await handleNameEntry(business, msg, phone, userState);
    
    case 'selecting_date':
      return await handleDateSelection(business, msg, phone, userState);
    
    case 'selecting_time':
      return await handleTimeSelection(business, msg, phone, userState);
    
    case 'confirming_appointment':
      return await handleAppointmentConfirmation(business, msg, phone, userState);
    
    default:
      clearUserState(phone);
      return MENUS.welcome(business.name);
  }
}

// Enhanced service selection
async function handleServiceSelection(business, msg, phone, userState) {
  const serviceIndex = parseInt(msg) - 1;
  
  if (serviceIndex >= 0 && serviceIndex < business.services.length) {
    const selectedService = business.services[serviceIndex];
    updateUserState(phone, {
      appointmentData: { ...userState.appointmentData, service: selectedService },
      currentStep: 'entering_name'
    });
    
    return MENUS.appointmentFlow.nameRequest();
  }
  
  // Search by service name
  const selectedService = business.services.find(service => 
    service.toLowerCase().includes(msg)
  );
  
  if (selectedService) {
    updateUserState(phone, {
      appointmentData: { ...userState.appointmentData, service: selectedService },
      currentStep: 'entering_name'
    });
    
    return MENUS.appointmentFlow.nameRequest();
  }
  
  // Enhanced error message
  return `${ICONS.cross} *No entendí tu selección* ${ICONS.info}\n\n` +
    `Por favor, elige una de estas opciones:\n\n` +
    business.services.map((s, i) => 
      `${SERVICE_ICONS[s] || '🦷'} *${i + 1}.* ${s}`
    ).join('\n\n') +
    `\n${ICONS.sparkle} *O escribe el nombre del servicio que necesitas*`;
}

// Enhanced name entry
async function handleNameEntry(business, msg, phone, userState) {
  const name = msg.trim();
  
  // Basic validation
  if (name.length < 3 || name.length > 50) {
    return `${ICONS.warning} *Por favor, ingresa un nombre válido*\n\n` +
      `${ICONS.info} Debe tener entre 3 y 50 caracteres\n` +
      `Ejemplo: "María González López"`;
  }
  
  updateUserState(phone, {
    appointmentData: { ...userState.appointmentData, name: name },
    currentStep: 'selecting_date'
  });
  
  return MENUS.appointmentFlow.dateSelection();
}

// Enhanced date selection with better parsing
async function handleDateSelection(business, msg, phone, userState) {
  // Import date handling functions
  const { parseDateInput, generateAvailableTimesForDate, createDateSelectionResponse } = require('./simple-date-handler');
  
  const parsedDate = parseDateInput(msg);
  
  if (parsedDate.error) {
    return `${ICONS.cross} *No entendí la fecha* ${ICONS.info}\n\n` +
      `${ICONS.calendar} *Intenta con estos formatos:*\n\n` +
      `📅 "15 de noviembre"\n` +
      `📅 "martes 15"\n` +
      `📅 "mañana"\n` +
      `📅 "esta semana"\n` +
      `📅 "lo más pronto posible"\n\n` +
      `${ICONS.sparkle} *¿Qué día prefieres para tu cita?*`;
  }
  
  // Generate available times for the selected date
  const availableTimes = generateAvailableTimesForDate(parsedDate.date);
  
  updateUserState(phone, {
    appointmentData: { 
      ...userState.appointmentData, 
      date: parsedDate.formatted,
      datetime: parsedDate.date
    },
    currentStep: 'selecting_time',
    availableTimes: availableTimes
  });
  
  return `${ICONS.calendar} *¡Perfecto!* ✅\n\n` +
    `${ICONS.clock} *Horarios disponibles para ${parsedDate.formatted}:*\n\n` +
    availableTimes.slice(0, 8).map((time, index) => 
      `⏰ *${index + 1}.* ${time}`
    ).join('\n\n') +
    `\n\n${ICONS.info} *Escribe el número de tu preferencia*\n` +
    `${ICONS.phone} *O responde "ver más horarios" para opciones adicionales*`;
}

// Enhanced time selection
async function handleTimeSelection(business, msg, phone, userState) {
  const timeIndex = parseInt(msg) - 1;
  
  if (timeIndex >= 0 && timeIndex < userState.availableTimes.length) {
    const selectedTime = userState.availableTimes[timeIndex];
    
    // Update appointment datetime
    const appointmentDate = new Date(userState.appointmentData.datetime);
    const [hours, minutes] = selectedTime.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes));
    
    updateUserState(phone, {
      appointmentData: {
        ...userState.appointmentData,
        time: selectedTime,
        datetime: appointmentDate,
        id: generateAppointmentId()
      },
      currentStep: 'confirming_appointment'
    });
    
    return MENUS.appointmentFlow.confirmation(userState.appointmentData);
  }
  
  return `${ICONS.cross} *Horario no válido* ${ICONS.info}\n\n` +
    `Por favor, elige un horario de la lista:\n\n` +
    userState.availableTimes.map((time, i) => 
      `⏰ *${i + 1}.* ${time}`
    ).join('\n');
}

// Enhanced confirmation
async function handleAppointmentConfirmation(business, msg, phone, userState) {
  if (msg.includes('1') || msg.includes('sí') || msg.includes('confirmar')) {
    // Save appointment to database
    try {
      const appointment = new Appointment({
        businessId: business._id,
        patient: {
          name: userState.appointmentData.name,
          phone: phone
        },
        service: userState.appointmentData.service,
        datetime: userState.appointmentData.datetime,
        status: 'confirmada',
        appointmentId: userState.appointmentData.id
      });
      
      await appointment.save();
      
      const successMessage = MENUS.appointmentFlow.success(userState.appointmentData);
      clearUserState(phone);
      
      return successMessage;
    } catch (error) {
      console.error('Error saving appointment:', error);
      return `${ICONS.warning} *Error al guardar la cita* ${ICONS.cross}\n\n` +
        `${ICONS.phone} Por favor, llama directamente al ${business.phone} para confirmar`;
    }
  }
  
  if (msg.includes('2') || msg.includes('cambiar')) {
    updateUserState(phone, { currentStep: 'selecting_date' });
    return MENUS.appointmentFlow.dateSelection();
  }
  
  if (msg.includes('3') || msg.includes('información')) {
    return `${ICONS.info} *Información adicional:*\n\n` +
      `${ICONS.money} Métodos de pago disponibles\n` +
      `${ICONS.medical} Duración aproximada del procedimiento\n` +
      `${ICONS.phone} Preguntas frecuentes\n\n` +
      `${ICONS.calendar} *¿Deseas confirmar tu cita o necesitas cambiar algo?*`;
  }
  
  return MENUS.appointmentFlow.confirmation(userState.appointmentData);
}

// Enhanced utility functions
function formatHoursResponse(business) {
  return `${ICONS.time} *Horario de Atención* ${ICONS.clock}\n\n` +
    `${ICONS.heart} *Estamos aquí para ti en:*\n\n` +
    `${ICONS.star} *Lunes a Viernes:*\n${business.schedule.weekdays}\n\n` +
    `${ICONS.star} *Sábados:*\n${business.schedule.saturday}\n\n` +
    `${ICONS.star} *Domingos:*\n${business.schedule.sunday}\n\n` +
    `${ICONS.phone} *¿Te gustaría agendar una cita?*\n` +
    `${ICONS.sparkle} *Responde con "agendar" y te asistimos de inmediato*`;
}

function formatLocationResponse(business) {
  return `${ICONS.location} *Nuestra Ubicación* ${ICONS.map}\n\n` +
    `${ICONS.heart} *Nos encuentras en:*\n\n` +
    `📍 ${business.address}\n\n` +
    `${ICONS.phone} *Contacto directo:*\n` +
    `📞 ${business.phone}\n\n` +
    `${ICONS.car} *Estacionamiento disponible*\n` +
    `${ICONS.accessible} *Acceso para personas con discapacidad*\n\n` +
    `${ICONS.calendar} *¿Quieres agendar tu visita?*\n` +
    `${ICONS.sparkle} *Responde "agendar" y te ayudamos*`;
}

async function consultAppointment(business, phone, userState) {
  // This would query the database for existing appointments
  return `${ICONS.calendar} *Consulta de Citas* ${ICONS.search}\n\n` +
    `${ICONS.info} *Para consultar tu cita, necesito:*\n\n` +
    `${ICONS.smile} *Tu nombre completo*\n` +
    `${ICONS.phone} *O tu número de cita (si lo tienes)*\n\n` +
    `${ICONS.heart} *O simplemente llama al ${business.phone}*`;
}

async function consultAppointmentSmart(business, existingAppointment, phone, userState) {
  if (existingAppointment) {
    const fecha = existingAppointment.datetime.toLocaleDateString('es-MX');
    const hora = existingAppointment.datetime.toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit'
    });
    
    return `${ICONS.calendar} *Tu Próxima Cita* ${ICONS.star}\n\n` +
      `${ICONS.check} *Cita confirmada:*\n\n` +
      `${ICONS.services} *Servicio:* ${existingAppointment.service}\n` +
      `${ICONS.calendar} *Fecha:* ${fecha}\n` +
      `${ICONS.clock} *Hora:* ${hora}\n` +
      `${ICONS.phone} *Teléfono:* ${existingAppointment.patient.phone}\n\n` +
      `${ICONS.info} *Opciones disponibles:*\n\n` +
      `${ICONS.cross} 1️⃣ Cancelar cita\n` +
      `${ICONS.calendar} 2️⃣ Reagendar\n` +
      `${ICONS.phone} 3️⃣ Llamar para confirmar`;
  }
  
  return `${ICONS.info} *No tienes citas programadas* ${ICONS.calendar}\n\n` +
    `${ICONS.sparkle} *¡Es momento de cuidar tu sonrisa!*\n\n` +
    `${ICONS.services} *¿Te gustaría agendar una cita?*\n` +
    `${ICONS.phone} *O llámanos al ${business.phone}*`;
}

async function handleCancellation(existingAppointment, phone) {
  if (existingAppointment) {
    existingAppointment.status = 'cancelada';
    await existingAppointment.save();
    
    const fecha = existingAppointment.datetime.toLocaleDateString('es-MX');
    
    clearUserState(phone);
    
    return `${ICONS.check} *Cita Cancelada Exitosamente* ${ICONS.cross}\n\n` +
      `${ICONS.info} *Tu cita del ${fecha} ha sido cancelada*\n\n` +
      `${ICONS.heart} *Si deseas reagendar, estamos aquí para ayudarte*\n` +
      `${ICONS.sparkle} *Esperamos verte pronto*`;
  }
  
  return `${ICONS.info} *No encontré citas activas para cancelar* ${ICONS.search}\n\n` +
    `${ICONS.calendar} *¿Te gustaría agendar una nueva cita?*`;
}

// Helper function to get current step description
function getCurrentStepDescription(step) {
  const descriptions = {
    'selecting_service': 'Selección de servicio',
    'entering_name': 'Ingreso de tu nombre',
    'selecting_date': 'Selección de fecha',
    'selecting_time': 'Selección de hora',
    'confirming_appointment': 'Confirmación de cita'
  };
  return descriptions[step] || 'Proceso de agendamiento';
}

// Utility functions
function generateAvailableTimes() {
  const times = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(time);
    }
  }
  return times;
}

function generateAppointmentId() {
  return 'CITA' + Date.now().toString().slice(-8);
}

module.exports = { 
  processBotMessage,
  clearUserState,
  getUserState,
  updateUserState
};
