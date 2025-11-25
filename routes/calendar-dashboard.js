const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const moment = require('moment');

// Middleware para verificar que el negocio tenga acceso al calendario
const verifyCalendarAccess = async (req, res, next) => {
  try {
    const business = await Business.findById(req.query.businessId);
    
    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }
    
    if (!business.features.calendarAccess) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: 'Esta función está disponible solo para planes PRO y PREMIUM',
        currentPlan: business.plan,
        upgradeUrl: '/upgrade'
      });
    }
    
    req.business = business;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📅 RUTA PRINCIPAL DEL CALENDARIO
router.get('/calendar', verifyCalendarAccess, async (req, res) => {
  try {
    const { businessId } = req.query;
    const business = req.business;
    
    // Obtener fecha actual o la fecha solicitada
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const startOfMonth = moment(date).startOf('month').toDate();
    const endOfMonth = moment(date).endOf('month').toDate();
    
    // Obtener todas las citas del mes
    const appointments = await Appointment.find({
      businessId: businessId,
      dateTime: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).sort({ dateTime: 1 });
    
    // Estadísticas del mes
    const stats = {
      total: appointments.length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      pending: appointments.filter(a => a.status === 'pending').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length
    };
    
    // Citas de hoy
    const today = moment().startOf('day');
    const todayAppointments = appointments.filter(a => 
      moment(a.dateTime).isSame(today, 'day')
    );
    
    // Próximas citas (próximos 7 días)
    const nextWeek = moment().add(7, 'days').endOf('day');
    const upcomingAppointments = appointments.filter(a => {
      const appointmentDate = moment(a.dateTime);
      return appointmentDate.isAfter(today) && appointmentDate.isBefore(nextWeek);
    });
    
    res.render('calendar-dashboard', {
      business,
      appointments,
      stats,
      todayAppointments,
      upcomingAppointments,
      currentMonth: moment(date).format('MMMM YYYY'),
      currentDate: date
    });
    
  } catch (error) {
    console.error('Error en calendar dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📊 API: Obtener citas por día
router.get('/api/calendar/day/:date', verifyCalendarAccess, async (req, res) => {
  try {
    const { businessId } = req.query;
    const date = new Date(req.params.date);
    
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();
    
    const appointments = await Appointment.find({
      businessId: businessId,
      dateTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ dateTime: 1 });
    
    res.json({
      date: req.params.date,
      appointments: appointments.map(apt => ({
        id: apt._id,
        clientName: apt.clientName,
        clientPhone: apt.clientPhone,
        service: apt.service,
        time: moment(apt.dateTime).format('HH:mm'),
        status: apt.status,
        notes: apt.notes,
        payment: apt.payment
      }))
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📊 API: Obtener resumen del mes
router.get('/api/calendar/month-summary', verifyCalendarAccess, async (req, res) => {
  try {
    const { businessId } = req.query;
    const month = req.query.month ? parseInt(req.query.month) : new Date().getMonth();
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    const appointments = await Appointment.find({
      businessId: businessId,
      dateTime: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });
    
    // Agrupar por día
    const appointmentsByDay = {};
    appointments.forEach(apt => {
      const day = moment(apt.dateTime).format('YYYY-MM-DD');
      if (!appointmentsByDay[day]) {
        appointmentsByDay[day] = {
          count: 0,
          confirmed: 0,
          pending: 0,
          completed: 0,
          cancelled: 0
        };
      }
      appointmentsByDay[day].count++;
      appointmentsByDay[day][apt.status]++;
    });
    
    res.json({
      month,
      year,
      total: appointments.length,
      byDay: appointmentsByDay,
      stats: {
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        pending: appointments.filter(a => a.status === 'pending').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔄 Actualizar estado de cita
router.patch('/api/calendar/appointment/:id', verifyCalendarAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    // Verificar que la cita pertenece al negocio
    if (appointment.businessId.toString() !== req.query.businessId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;
    
    await appointment.save();
    
    res.json({
      success: true,
      appointment: {
        id: appointment._id,
        status: appointment.status,
        notes: appointment.notes
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📈 Estadísticas y reportes (PREMIUM)
router.get('/api/calendar/reports', verifyCalendarAccess, async (req, res) => {
  try {
    const { businessId } = req.query;
    const business = req.business;
    
    // Solo para PREMIUM
    if (business.plan !== 'premium') {
      return res.status(403).json({
        error: 'Esta función está disponible solo para plan PREMIUM',
        currentPlan: business.plan
      });
    }
    
    const startDate = req.query.startDate ? new Date(req.query.startDate) : moment().subtract(30, 'days').toDate();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    const appointments = await Appointment.find({
      businessId: businessId,
      dateTime: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    // Análisis por servicio
    const serviceStats = {};
    appointments.forEach(apt => {
      if (!serviceStats[apt.service]) {
        serviceStats[apt.service] = {
          count: 0,
          revenue: 0,
          completed: 0
        };
      }
      serviceStats[apt.service].count++;
      if (apt.payment && apt.payment.status === 'paid') {
        serviceStats[apt.service].revenue += apt.payment.amount;
      }
      if (apt.status === 'completed') {
        serviceStats[apt.service].completed++;
      }
    });
    
    // Análisis por día de la semana
    const dayOfWeekStats = {
      0: { name: 'Domingo', count: 0 },
      1: { name: 'Lunes', count: 0 },
      2: { name: 'Martes', count: 0 },
      3: { name: 'Miércoles', count: 0 },
      4: { name: 'Jueves', count: 0 },
      5: { name: 'Viernes', count: 0 },
      6: { name: 'Sábado', count: 0 }
    };
    
    appointments.forEach(apt => {
      const dayOfWeek = new Date(apt.dateTime).getDay();
      dayOfWeekStats[dayOfWeek].count++;
    });
    
    // Tasa de conversión
    const conversionRate = appointments.length > 0
      ? (appointments.filter(a => a.status === 'completed').length / appointments.length * 100).toFixed(2)
      : 0;
    
    res.json({
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalAppointments: appointments.length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        noShow: appointments.filter(a => a.status === 'no-show').length,
        conversionRate: `${conversionRate}%`
      },
      serviceStats,
      dayOfWeekStats,
      topServices: Object.entries(serviceStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([service, stats]) => ({ service, ...stats }))
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔍 Buscar citas
router.get('/api/calendar/search', verifyCalendarAccess, async (req, res) => {
  try {
    const { businessId, query } = req.query;
    
    const appointments = await Appointment.find({
      businessId: businessId,
      $or: [
        { clientName: { $regex: query, $options: 'i' } },
        { clientPhone: { $regex: query, $options: 'i' } },
        { service: { $regex: query, $options: 'i' } }
      ]
    }).limit(20).sort({ dateTime: -1 });
    
    res.json({
      results: appointments.map(apt => ({
        id: apt._id,
        clientName: apt.clientName,
        clientPhone: apt.clientPhone,
        service: apt.service,
        dateTime: apt.dateTime,
        status: apt.status
      }))
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
