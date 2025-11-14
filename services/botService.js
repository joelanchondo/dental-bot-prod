const Appointment = require('../models/Appointment');

// Estado de conversación temporal (en memoria)
const conversationState = {};

async function processBotMessage(business, message, phone) {
  const msg = message.toLowerCase().trim();
  
  if (business.plan === 'basico') {
    return getPredefinedResponse(business, msg);
  }
  
  return getSmartResponse(business, msg, phone);
}

function getPredefinedResponse(business, msg) {
  if (msg.includes('horario') || msg.includes('hora')) {
    return `🕐 *Horario de ${business.name}*\n\n` +
           `Lunes a Viernes: ${business.schedule.weekdays}\n` +
           `Sábados: ${business.schedule.saturday}\n` +
           `Domingos: ${business.schedule.sunday}`;
  }
  
  if (msg.includes('ubicacion') || msg.includes('ubicado') || msg.includes('direccion') || msg.includes('donde')) {
    return `📍 *Nos encontramos en:*\n\n${business.address}`;
  }
  
  if (msg.includes('servicio') || msg.includes('precio')) {
    return `🦷 *Nuestros Servicios:*\n\n${business.services.map(s => `• ${s}`).join('\n')}\n\n` +
           `Para precios y citas, llámanos al ${business.phone}`;
  }
  
  if (msg.includes('agendar') || msg.includes('cita')) {
    return `📅 Para agendar tu cita, necesito:\n\n` +
           `1️⃣ Tu nombre completo\n` +
           `2️⃣ Tu teléfono\n` +
           `3️⃣ Servicio que necesitas\n` +
           `4️⃣ Fecha y hora que prefieres\n\n` +
           `Por favor envíame estos datos.`;
  }
  
  return business.messages?.welcome || 
         `Hola! 👋 Soy el asistente de *${business.name}*\n\n` +
         `¿En qué puedo ayudarte?\n\n` +
         `• Agendar cita\n• Servicios\n• Horarios\n• Ubicación`;
}

async function getSmartResponse(business, msg, phone) {
  try {
    const state = conversationState[phone] || { step: 'idle' };
    
    const existingAppointment = await Appointment.findOne({
      businessId: business._id,
      'patient.phone': phone,
      datetime: { $gte: new Date() },
      status: { $in: ['confirmada', 'retrasada'] }
    });
    
    // CANCELAR
    if (msg.includes('cancelar')) {
      if (existingAppointment) {
        existingAppointment.status = 'cancelada';
        await existingAppointment.save();
        delete conversationState[phone];
        
        const fecha = existingAppointment.datetime.toLocaleDateString('es-MX');
        return `✅ Tu cita del ${fecha} ha sido cancelada.\n\nSi deseas reagendar, envíanos un mensaje.`;
      }
      return `No encontré ninguna cita activa.\n\n¿Necesitas ayuda con algo más?`;
    }
    
    // CONSULTAR
    if (msg.includes('mi cita') || msg.includes('consultar')) {
      if (existingAppointment) {
        const fecha = existingAppointment.datetime.toLocaleDateString('es-MX');
        const hora = existingAppointment.datetime.toLocaleTimeString('es-MX', {
          hour: '2-digit', minute: '2-digit'
        });
        
        return `📅 *Tu próxima cita:*\n\n` +
               `Fecha: ${fecha}\nHora: ${hora}\n` +
               `Servicio: ${existingAppointment.service}\n\n` +
               `¿Necesitas cancelar o reagendar?`;
      }
      return `No tienes citas programadas.\n\n¿Quieres agendar una?`;
    }
    
    // INICIAR AGENDADO
    if (msg.includes('agendar') || msg.includes('cita')) {
      conversationState[phone] = { step: 'select_service' };
      return `¡Perfecto! 📅\n\n¿Qué servicio necesitas?\n\n` +
             business.services.map((s, i) => `${i + 1}. ${s}`).join('\n') +
             `\n\nEscribe el número del servicio.`;
    }
    
    // PASO 2: SERVICIO
    if (state.step === 'select_service') {
      let selectedService = null;
      
      const serviceNumber = parseInt(msg);
      if (serviceNumber >= 1 && serviceNumber <= business.services.length) {
        selectedService = business.services[serviceNumber - 1];
      } else {
        selectedService = business.services.find(s => 
          msg.includes(s.toLowerCase())
        );
      }
      
      if (selectedService) {
        conversationState[phone] = { 
          step: 'request_name', 
          service: selectedService 
        };
        
        return `Excelente! *${selectedService}*\n\n` +
               `👤 ¿Cuál es tu nombre completo?`;
      }
      
      return `Por favor elige un número del 1 al ${business.services.length}`;
    }
    
    // PASO 3: NOMBRE
    if (state.step === 'request_name') {
      conversationState[phone] = { 
        ...state,
        step: 'request_date',
        name: msg 
      };
      
      return `Perfecto ${msg}! 👍\n\n` +
             `📅 ¿Para qué día prefieres tu cita?\n\n` +
             `Ejemplos:\n` +
             `• "Mañana"\n` +
             `• "Viernes"\n` +
             `• "15 de noviembre"`;
    }
    
    // PASO 4: FECHA
    if (state.step === 'request_date') {
      conversationState[phone] = { 
        ...state,
        step: 'request_time',
        dateText: msg 
      };
      
      return `Entendido! 📅\n\n` +
             `🕐 ¿A qué hora?\n\n` +
             `Horario: ${business.schedule.weekdays}\n\n` +
             `Escribe la hora (ej: "10am" o "3pm")`;
    }
    
    // PASO 5: HORA Y CONFIRMAR
    if (state.step === 'request_time') {
      const { name, service, dateText } = state;
      
      const response = `✅ *Solicitud de cita recibida!*\n\n` +
                      `👤 ${name}\n` +
                      `🦷 ${service}\n` +
                      `📅 ${dateText}\n` +
                      `🕐 ${msg}\n` +
                      `📍 ${business.address}\n\n` +
                      `*Te confirmaremos disponibilidad pronto por este medio.*\n\n` +
                      `📞 También puedes llamar: ${business.phone}`;
      
      delete conversationState[phone];
      
      return response;
    }
    
    // SERVICIOS
    if (msg.includes('servicio') || msg.includes('precio')) {
      return `🦷 *Nuestros Servicios:*\n\n` +
             business.services.map(s => `• ${s}`).join('\n') +
             `\n\nPara precios exactos y agendar, contáctanos.\n\n` +
             `¿Quieres agendar una cita?`;
    }
    
    // HORARIO
    if (msg.includes('horario')) {
      return `🕐 *Horario:*\n\n` +
             `Lunes-Viernes: ${business.schedule.weekdays}\n` +
             `Sábados: ${business.schedule.saturday}\n` +
             `Domingos: ${business.schedule.sunday}\n\n` +
             `¿Agendar cita?`;
    }
    
    // UBICACIÓN
    if (msg.includes('ubicacion') || msg.includes('ubicado') || msg.includes('direccion') || msg.includes('donde')) {
      return `📍 ${business.address}\n\n¿Te ayudo a agendar tu cita?`;
    }
    
    // DEFAULT
    return `Entiendo. ¿En qué puedo ayudarte?\n\n` +
           `• Agendar cita\n` +
           `• Servicios\n` +
           `• Horarios\n` +
           `• Ubicación`;
           
  } catch (error) {
    console.error('❌ Error en getSmartResponse:', error);
    return `⚠️ Hubo un problema técnico.\n\n` +
           `📞 Llámanos: ${business.phone}`;
  }
}

module.exports = { processBotMessage };
