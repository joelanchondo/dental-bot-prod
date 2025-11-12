const Appointment = require('../models/Appointment');

// Estado en memoria
const userStates = new Map();

class ConversationManager {
  static getUserState(phone) {
    if (!userStates.has(phone)) {
      userStates.set(phone, {
        currentFlow: null,
        currentStep: null,
        data: {},
        lastInteraction: new Date()
      });
    }
    return userStates.get(phone);
  }

  static clearUserState(phone) {
    userStates.delete(phone);
  }
}

async function processBotMessage(business, message, phone) {
  const msg = message.toLowerCase().trim();
  const state = ConversationManager.getUserState(phone);
  state.lastInteraction = new Date();

  console.log(`🤖 Procesando: "${message}" de ${phone}, estado: ${state.currentStep}`);

  try {
    const response = await getSmartResponse(business, msg, phone, state);
    console.log(`🤖 Respuesta generada: ${response.substring(0, 100)}...`);
    return response;
  } catch (error) {
    console.error('Error:', error);
    return getErrorMessage();
  }
}

async function getSmartResponse(business, msg, phone, state) {
  // Verificar cita existente
  const existingAppointment = await Appointment.findOne({
    businessId: business._id,
    'patient.phone': phone,
    datetime: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  });

  console.log(`🔍 Estado: ${state.currentStep}, Cita existente: ${!!existingAppointment}`);

  // Flujo de agendar cita
  if (state.currentFlow === 'appointment') {
    return handleAppointmentFlow(business, msg, phone, state);
  }

  // Comandos principales
  if (isGreeting(msg)) {
    ConversationManager.clearUserState(phone);
    return getWelcomeMenu(business, existingAppointment);
  }

  if (msg.includes('agendar') || msg.includes('cita') || msg === '1') {
    if (existingAppointment) {
      return `📅 *Ya tienes una cita programada*\n\n${formatAppointment(existingAppointment)}\n\n¿Quieres cancelarla para agendar una nueva?`;
    }
    state.currentFlow = 'appointment';
    state.currentStep = 'service';
    return getServiceMenu(business);
  }

  if (msg.includes('mi cita') || msg.includes('consultar') || msg === '2') {
    return getAppointmentInfo(existingAppointment);
  }

  if (msg.includes('servicio') || msg === '3') {
    return getServicesMenu(business);
  }

  if (msg.includes('horario') || msg === '4') {
    return getScheduleMenu(business);
  }

  if (msg.includes('ubicacion') || msg.includes('direccion') || msg === '5') {
    return getLocationMenu(business);
  }

  if (msg.includes('cancelar')) {
    return handleCancellation(existingAppointment, phone);
  }

  if (msg === 'menu') {
    ConversationManager.clearUserState(phone);
    return getMainMenu(business, existingAppointment);
  }

  // Si no entiende, mostrar menú principal
  return getMainMenu(business, existingAppointment);
}

async function handleAppointmentFlow(business, msg, phone, state) {
  console.log(`🔄 Flujo cita - Paso: ${state.currentStep}, Mensaje: ${msg}`);

  switch (state.currentStep) {
    case 'service':
      return handleServiceSelection(business, msg, phone, state);

    case 'name':
      return handleNameSelection(business, msg, phone, state);

    case 'date':
      return handleDateSelection(business, msg, phone, state);

    default:
      state.currentStep = 'service';
      return getServiceMenu(business);
  }
}

function handleServiceSelection(business, msg, phone, state) {
  const serviceIndex = parseInt(msg) - 1;

  if (serviceIndex >= 0 && serviceIndex < business.services.length) {
    const selectedService = business.services[serviceIndex];
    state.data.service = selectedService;
    state.currentStep = 'name';

    return `✅ *${selectedService}* - ¡Excelente elección! ✨

¿Cómo te llamas? 📝

*Escribe tu nombre completo:*
(Ejemplo: María González López)`;
  }

  // Buscar por texto
  const matchedService = business.services.find(service =>
    service.toLowerCase().includes(msg)
  );

  if (matchedService) {
    state.data.service = matchedService;
    state.currentStep = 'name';
    return `✅ *${matchedService}* - ¡Perfecto! ✨

¿Cómo te llamas? 📝

*Escribe tu nombre completo:*
(Ejemplo: Carlos Rodríguez)`;
  }

  return `❌ No entendí tu selección. Por favor elige un servicio:

${getServicesList(business)}

*Escribe el número o nombre del servicio*`;
}

function handleNameSelection(business, msg, phone, state) {
  if (msg.length < 3) {
    return `❌ El nombre parece muy corto. Por favor escribe tu *nombre completo*:

(Ejemplo: Ana García López)`;
  }

  state.data.patientName = msg.trim();
  state.currentStep = 'date';

  // Asignar fecha automática (mañana a las 10:00 AM)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  state.data.datetime = tomorrow;

  return `✅ Nombre registrado: *${msg.trim()}* 👋

📅 *Fecha de cita asignada:*
🗓️ ${tomorrow.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ 10:00 AM

*¿Confirmas esta cita?*

✅ *Sí* - Confirmar cita
🔄 *No* - Cambiar fecha/hora
❌ *Cancelar* - Volver al menú`;
}

function handleDateSelection(business, msg, phone, state) {
  if (msg.includes('si') || msg.includes('sí') || msg.includes('confirm')) {
    // Crear la cita
    return createAppointment(business, phone, state);
  }

  if (msg.includes('no') || msg.includes('cambiar')) {
    return `🔄 Para cambiar la fecha, por favor contáctanos directamente:

📞 ${business.phone}

*O escribe "menu" para volver al inicio.*`;
  }

  if (msg.includes('cancelar')) {
    ConversationManager.clearUserState(phone);
    return getMainMenu(business);
  }

  return `❌ No entendí tu respuesta.

*¿Confirmas tu cita para?*
📅 ${state.data.datetime.toLocaleDateString('es-MX')}
⏰ 10:00 AM

✅ *Sí* - Confirmar
🔄 *No* - Cambiar fecha
❌ *Cancelar* - Volver al menú`;
}

async function createAppointment(business, phone, state) {
  try {
    const appointment = new Appointment({
      businessId: business._id,
      patient: {
        name: state.data.patientName,
        phone: phone
      },
      service: state.data.service,
      datetime: state.data.datetime,
      status: 'confirmed',
      source: 'whatsapp'
    });

    await appointment.save();
    ConversationManager.clearUserState(phone);

    return `🎉 *¡Cita Confirmada Exitosamente!* ✅

📅 *Fecha:* ${state.data.datetime.toLocaleDateString('es-MX')}
⏰ *Hora:* 10:00 AM
🦷 *Servicio:* ${state.data.service}
👤 *Paciente:* ${state.data.patientName}

📍 *Dirección:* ${business.address}
📞 *Teléfono:* ${business.phone}

*Recomendaciones:*
⏱️ Llega 10 minutos antes
📝 Trae identificación oficial
💊 Toma tu medicación habitual

¡Te esperamos! 😊`;
  } catch (error) {
    console.error('Error creating appointment:', error);
    return `❌ *Error al agendar cita*

No pudimos registrar tu cita. Por favor contáctanos directamente:

📞 ${business.phone}

Disculpa las molestias.`;
  }
}

function getWelcomeMenu(business, existingAppointment = null) {
  let message = `👋 *¡Bienvenido a ${business.name}!* 🦷

*Tu sonrisa es nuestra prioridad* ✨`;

  if (existingAppointment) {
    message += `\n\n📋 *Tienes una cita programada* ✅`;
  }

  message += `\n\n*¿En qué puedo ayudarte hoy?*

1️⃣ *AGENDAR CITA* - Nueva consulta
2️⃣ *MIS CITAS* - Ver/Consultar
3️⃣ *SERVICIOS* - Tratamientos
4️⃣ *HORARIOS* - Disponibilidad
5️⃣ *UBICACIÓN* - Dirección

*Escribe el número de tu opción:*`;

  return message;
}

function getMainMenu(business, existingAppointment = null) {
  if (existingAppointment) {
    return `📋 *Menú Principal*

1️⃣ *AGENDAR* - Nueva cita
2️⃣ *VER CITA* - ${formatAppointmentShort(existingAppointment)}
3️⃣ *SERVICIOS* - Tratamientos
4️⃣ *HORARIOS* - Disponibilidad
5️⃣ *UBICACIÓN* - Dirección

*Escribe el número de tu opción:*`;
  }

  return getWelcomeMenu(business);
}

function getServiceMenu(business) {
  return `🦷 *AGENDAR CITA* 📅

*Selecciona el servicio que necesitas:*

${getServicesList(business)}

*Escribe el número o nombre del servicio:*`;
}

function getServicesList(business) {
  return business.services.map((service, index) =>
    `${index + 1}. ${service}`
  ).join('\n');
}

function getServicesMenu(business) {
  return `🦷 *NUESTROS SERVICIOS* ✨

${business.services.map(service => `• ${service}`).join('\n')}

💫 *Consulta de evaluación GRATIS*
📋 *Plan de tratamiento personalizado*

*¿Quieres agendar tu consulta?*
Escribe "1" o "AGENDAR"`;
}

function getScheduleMenu(business) {
  return `🕐 *HORARIOS DE ATENCIÓN* ⏰

Lunes a Viernes: ${business.schedule.weekdays}
Sábados: ${business.schedule.saturday}
Domingos: ${business.schedule.sunday}

*¿Quieres agendar una cita?*
Escribe "1" o "AGENDAR"`;
}

function getLocationMenu(business) {
  return `📍 *NUESTRA UBICACIÓN* 🗺️

${business.address}

*¿Necesitas ayuda para llegar?*
Escribe "1" para agendar cita o contáctanos:
📞 ${business.phone}`;
}

function getAppointmentInfo(appointment) {
  if (!appointment) {
    return `❌ *No tienes citas programadas*

¿Te gustaría agendar una?
Escribe "1" o "AGENDAR"`;
  }

  return `📅 *TU CITA PROGRAMADA* ✅

${formatAppointment(appointment)}

*Opciones:*
❌ *CANCELAR* - Cancelar esta cita
🔄 *REAGENDAR* - Cambiar fecha/hora
📋 *MENU* - Volver al menú`;
}

function formatAppointment(appointment) {
  const fecha = appointment.datetime.toLocaleDateString('es-MX');
  const hora = appointment.datetime.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit'
  });

  return `🗓️ *Fecha:* ${fecha}
⏰ *Hora:* ${hora}
🦷 *Servicio:* ${appointment.service}
👤 *Paciente:* ${appointment.patient.name}
📊 *Estado:* ${appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}`;
}

function formatAppointmentShort(appointment) {
  const fecha = appointment.datetime.toLocaleDateString('es-MX');
  return `${fecha} - ${appointment.service}`;
}

async function handleCancellation(appointment, phone) {
  if (!appointment) {
    return `❌ *No tienes citas activas para cancelar*

¿Quieres agendar una nueva cita?
Escribe "1" o "AGENDAR"`;
  }

  try {
    appointment.status = 'cancelled';
    await appointment.save();
    ConversationManager.clearUserState(phone);

    return `✅ *Cita Cancelada Exitosamente*

Tu cita del ${appointment.datetime.toLocaleDateString('es-MX')} ha sido cancelada.

¿Necesitas agendar una nueva cita?
Escribe "1" o "AGENDAR"`;
  } catch (error) {
    return `❌ *Error al cancelar cita*

Por favor contáctanos directamente para cancelar.`;
  }
}

function isGreeting(msg) {
  const greetings = ['hola', 'hi', 'hello', 'buenas', 'saludos', 'hey', 'ola'];
  return greetings.some(greeting => msg.includes(greeting));
}

function getErrorMessage() {
  return `❌ *¡Ups! Algo salió mal*

No pude procesar tu mensaje. Por favor intenta de nuevo.

*Escribe "MENU" para volver al inicio.*`;
}

module.exports = {
  processBotMessage,
  ConversationManager
};
