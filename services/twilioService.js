const twilio = require('./../config/twilio');
const Business = require('./../models/Business');

class TwilioService {
  async sendAppointmentConfirmation(appointment) {
    try {
      // Obtener el negocio
      const business = await Business.findById(appointment.businessId);
      if (!business) {
        throw new Error('Negocio no encontrado');
      }

      // Crear cliente Twilio
      const client = twilio(business);
      
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

      // Mensaje de confirmación
      const message = `✅ *Cita Confirmada*\n\n` +
        `Hola ${appointment.clientName},\n\n` +
        `Tu cita ha sido agendada:\n\n` +
        `📅 *Fecha:* ${formattedDate}\n` +
        `🦷 *Servicio:* ${appointment.service}\n` +
        `🏥 *Clínica:* ${business.businessName}\n\n` +
        `📍 *Dirección:* ${business.address}\n` +
        `📞 *Teléfono:* ${business.whatsappBusiness}\n\n` +
        `¡Te esperamos!`;

      // Enviar mensaje
      await client.messages.create({
        body: message,
        from: `whatsapp:${business.whatsapp.number}`,
        to: `whatsapp:${appointment.clientPhone}`
      });

      console.log(`📱 WhatsApp enviado a ${appointment.clientPhone}`);
      
    } catch (error) {
      console.error('❌ Error en sendAppointmentConfirmation:', error);
      throw error;
    }
  }
}

module.exports = new TwilioService();
