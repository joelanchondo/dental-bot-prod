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

  // Comandos principales - SOLO NÚMEROS
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

1️⃣ *Sí* - Confirmar cita
2️⃣ *No* - Cambiar fecha/hora  
3️⃣ *Cancelar* - Volver al menú

*Escribe el número de tu opción:*`;
}

function handleDateSelection(business, msg, phone, state) {
  // SOLO NÚMEROS para confirmación
  if (msg === '1' || msg.includes('si') || msg.includes('sí') || msg.includes('confirm')) {
    return createAppointment(business, phone, state);
  }

  if (msg === '2' || msg.includes('no') || msg.includes('cambiar')) {
    return `🔄 Para cambiar la fecha, por favor contáctanos directamente:

📞 ${business.phone}

*O escribe "3" para volver al menú.*`;
  }

  if (msg === '3' || msg.includes('cancelar') || msg.includes('menu')) {
    ConversationManager.clearUserState(phone);
    return getMainMenu(business);
  }

  return `❌ No entendí tu respuesta.

*¿Confirmas tu cita para?*
📅 ${state.data.datetime.toLocaleDateString('es-MX')}
⏰ 10:00 AM

1️⃣ *Sí* - Confirmar
2️⃣ *No* - Cambiar fecha
3️⃣ *Cancelar* - Volver al menú

*Escribe el número de tu opción:*`;
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

// ... (el resto de las funciones se mantienen igual)
// [MANTENER TODAS LAS FUNCIONES getWelcomeMenu, getMainMenu, etc. SIN CAMBIOS]

