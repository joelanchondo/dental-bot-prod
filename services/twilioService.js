const { getTwilioClient, sendWhatsApp } = require('./../config/twilio');
const Business = require('./../models/Business');

class TwilioService {
  async sendAppointmentConfirmation(appointment) {
    try {
      // Obtener el negocio
      const business = await Business.findById(appointment.businessId);
      if (!business) {
        throw new Error('Negocio no encontrado');
      }

      console.log('📱 TwilioService - Teléfono del appointment:', appointment.clientPhone);

      // Formatear fecha
      const appointmentDate = new Date(appointment.dateTime);
      const formattedDate = appointmentDate.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Mensaje de confirmación (Fallback para cuando la ventana 24h esté abierta)
      const message = `✅ *Cita Confirmada*\n\n` +
        `Hola ${appointment.clientName},\n\n` +
        `Tu cita ha sido agendada:\n\n` +
        `📅 *Fecha:* ${formattedDate}\n` +
        `🦷 *Servicio:* ${appointment.service}\n` +
        `🏥 *Clínica:* ${business.businessName}\n\n` +
        `📍 *Dirección:* ${business.address || 'Por confirmar'}\n` +
        `📞 *Teléfono:* ${business.whatsappBusiness}\n\n` +
        ``;

      // Variables para la plantilla Content API de Twilio (Fuera de 24h)
      const templateOpts = {
          contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
          contentVariables: JSON.stringify({
              "1": `${appointmentDate.getDate()}/${appointmentDate.getMonth() + 1}`,
              "2": appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '')
          })
      };

      // Enviar mensaje usando la función de config/twilio.js con soporte a plantillas
      await sendWhatsApp(business, appointment.clientPhone, message, templateOpts);

      console.log(`📱 WhatsApp enviado a ${appointment.clientPhone}`);
      
    } catch (error) {
      console.error('❌ Error en sendAppointmentConfirmation:', error);
      throw error;
    }
  }
}

module.exports = new TwilioService();
