const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const AppointmentSync = require('../services/appointmentSync');

// GET /dashboard/:businessId - Dashboard del cliente
router.get('/:businessId', async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);
    if (!business) {
      return res.status(404).send('Negocio no encontrado');
    }

    const appointments = await AppointmentSync.syncForDashboard(req.params.businessId);
    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.dateTime);
      const today = new Date();
      return aptDate.toDateString() === today.toDateString();
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dashboard - ${business.businessName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 10px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
          .appointment-item { padding: 10px; border-bottom: 1px solid #eee; }
          .status-confirmed { color: green; }
          .status-pending { color: orange; }
          .status-cancelled { color: red; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏢 ${business.businessName}</h1>
          <p>Plan: ${business.plan} | Estado: ${business.status}</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <h3>📅 Citas Hoy</h3>
            <p>${todayAppointments.length}</p>
          </div>
          <div class="stat-card">
            <h3>👥 Total Citas</h3>
            <p>${appointments.length}</p>
          </div>
          <div class="stat-card">
            <h3>🔄 Estado</h3>
            <p>${business.status}</p>
          </div>
        </div>

        <h2>Últimas Citas</h2>
        <div>
          ${appointments.slice(0, 10).map(apt => `
            <div class="appointment-item">
              <strong>${apt.clientName}</strong> - ${apt.service} 
              <span class="status-${apt.status}">(${apt.status})</span><br>
              <small>${new Date(apt.dateTime).toLocaleDateString('es-MX')} ${new Date(apt.dateTime).toLocaleTimeString('es-MX')}</small>
            </div>
          `).join('')}
        </div>

        <p><strong>WhatsApp:</strong> ${business.whatsappBusiness}</p>
        <p><strong>Email:</strong> ${business.contactEmail}</p>
        
        <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px;">
          <h3>📊 Dashboard Conectado al Bot</h3>
          <p>Las citas mostradas son las reales agendadas por WhatsApp</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).send('Error cargando dashboard');
  }
});

module.exports = router;
