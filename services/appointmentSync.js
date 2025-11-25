const Appointment = require('../models/Appointment');

class AppointmentSync {
  static async syncForDashboard(businessId) {
    try {
      const appointments = await Appointment.find({ businessId })
        .sort({ datetime: -1 })
        .limit(50)
        .lean();
      
      // Convertir estructura del bot a estructura del dashboard
      return appointments.map(apt => ({
        _id: apt._id,
        clientName: apt.patient?.name || apt.clientName || 'Sin nombre',
        clientPhone: apt.patient?.phone || apt.clientPhone || 'Sin teléfono',
        service: apt.service || 'Servicio no especificado',
        dateTime: apt.datetime || apt.dateTime,
        status: this.mapStatus(apt.status),
        source: apt.source || 'whatsapp'
      }));
    } catch (error) {
      console.error('❌ Error syncing appointments:', error);
      return [];
    }
  }

  static mapStatus(botStatus) {
    const statusMap = {
      'confirmada': 'confirmed',
      'pendiente': 'pending', 
      'completada': 'completed',
      'cancelada': 'cancelled',
      'en-curso': 'in-progress'
    };
    return statusMap[botStatus] || botStatus;
  }

  static async getTodayAppointments(businessId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await Appointment.find({
        businessId,
        datetime: {
          $gte: today,
          $lt: tomorrow
        }
      }).sort({ datetime: 1 }).lean();

      return appointments.map(apt => ({
        _id: apt._id,
        patient: {
          name: apt.patient?.name || apt.clientName,
          phone: apt.patient?.phone || apt.clientPhone
        },
        service: apt.service,
        datetime: apt.datetime || apt.dateTime,
        status: apt.status,
        delay: 0
      }));
    } catch (error) {
      console.error('❌ Error getting today appointments:', error);
      return [];
    }
  }
}

module.exports = AppointmentSync;
