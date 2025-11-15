const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');

// GET /dashboard/:businessId - Dashboard del cliente
router.get('/:businessId', async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);
    if (!business) {
      return res.status(404).send('Negocio no encontrado');
    }

    const appointments = await Appointment.find({ businessId: req.params.businessId })
      .sort({ datetime: -1 })
      .limit(10);

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
            <p>0</p>
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
        <ul>
          ${appointments.map(apt => `
            <li>${apt.patientName} - ${apt.service} - ${new Date(apt.datetime).toLocaleDateString()}</li>
          `).join('')}
        </ul>

        <p><strong>WhatsApp:</strong> ${business.whatsappBusiness}</p>
        <p><strong>Email:</strong> ${business.contactEmail}</p>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Error cargando dashboard');
  }
});

module.exports = router;
