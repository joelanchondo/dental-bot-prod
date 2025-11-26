const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const AppointmentSync = require('../services/appointmentSync');

// GET /dashboard/:businessId - Dashboard PROFESIONAL
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

    const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed').length;
    const pendingAppointments = appointments.filter(apt => apt.status === 'pending').length;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dashboard - ${business.businessName}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          .gradient-bg {
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
          }
          .gold-accent {
            background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
          }
          .stat-card {
            background: white;
            border-left: 4px solid #d97706;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .appointment-card {
            background: white;
            border: 1px solid #e5e7eb;
            transition: all 0.3s ease;
          }
          .appointment-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
        </style>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <!-- Header -->
        <div class="gradient-bg text-white">
          <div class="container mx-auto px-6 py-8">
            <div class="flex justify-between items-center">
              <div>
                <h1 class="text-3xl font-bold">🏢 ${business.businessName}</h1>
                <p class="text-blue-100 mt-2">Panel de control profesional</p>
              </div>
              <div class="text-right">
                <span class="gold-accent px-4 py-2 rounded-full text-white font-bold">${business.plan.toUpperCase()}</span>
                <p class="text-blue-100 mt-2">Estado: <span class="font-bold">${business.status}</span></p>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="container mx-auto px-6 -mt-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <!-- Citas Hoy -->
            <div class="stat-card rounded-lg p-6">
              <div class="flex items-center">
                <div class="gold-accent p-3 rounded-lg">
                  <span class="text-white text-xl">📅</span>
                </div>
                <div class="ml-4">
                  <p class="text-gray-600 text-sm">Citas Hoy</p>
                  <p class="text-2xl font-bold text-gray-800">${todayAppointments.length}</p>
                </div>
              </div>
            </div>

            <!-- Total Citas -->
            <div class="stat-card rounded-lg p-6">
              <div class="flex items-center">
                <div class="gold-accent p-3 rounded-lg">
                  <span class="text-white text-xl">👥</span>
                </div>
                <div class="ml-4">
                  <p class="text-gray-600 text-sm">Total Citas</p>
                  <p class="text-2xl font-bold text-gray-800">${appointments.length}</p>
                </div>
              </div>
            </div>

            <!-- Confirmadas -->
            <div class="stat-card rounded-lg p-6">
              <div class="flex items-center">
                <div class="gold-accent p-3 rounded-lg">
                  <span class="text-white text-xl">✅</span>
                </div>
                <div class="ml-4">
                  <p class="text-gray-600 text-sm">Confirmadas</p>
                  <p class="text-2xl font-bold text-gray-800">${confirmedAppointments}</p>
                </div>
              </div>
            </div>

            <!-- Pendientes -->
            <div class="stat-card rounded-lg p-6">
              <div class="flex items-center">
                <div class="gold-accent p-3 rounded-lg">
                  <span class="text-white text-xl">⏳</span>
                </div>
                <div class="ml-4">
                  <p class="text-gray-600 text-sm">Pendientes</p>
                  <p class="text-2xl font-bold text-gray-800">${pendingAppointments}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenido Principal -->
        <div class="container mx-auto px-6 py-8">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Últimas Citas -->
            <div class="lg:col-span-2">
              <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="gradient-bg text-white px-6 py-4 rounded-t-lg">
                  <h2 class="text-xl font-bold">📋 Últimas Citas</h2>
                </div>
                <div class="p-6">
                  ${appointments.slice(0, 10).map(apt => `
                    <div class="appointment-card rounded-lg p-4 mb-4">
                      <div class="flex justify-between items-start">
                        <div>
                          <h3 class="font-bold text-gray-800">${apt.clientName}</h3>
                          <p class="text-gray-600">${apt.service}</p>
                          <p class="text-sm text-gray-500">
                            ${new Date(apt.dateTime).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            a las ${new Date(apt.dateTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${
                          apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }">
                          ${apt.status}
                        </span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Información del Negocio -->
            <div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="gradient-bg text-white px-6 py-4 rounded-t-lg">
                  <h2 class="text-xl font-bold">🏢 Información</h2>
                </div>
                <div class="p-6">
                  <div class="space-y-4">
                    <div>
                      <p class="text-sm text-gray-600">WhatsApp Business</p>
                      <p class="font-bold text-gray-800">${business.whatsappBusiness}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Email de Contacto</p>
                      <p class="font-bold text-gray-800">${business.contactEmail || 'No especificado'}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Tipo de Negocio</p>
                      <p class="font-bold text-gray-800">${business.businessType}</p>
                    </div>
                  </div>

                  <!-- Estado del Sistema -->
                  <div class="mt-6 p-4 gold-accent rounded-lg text-white">
                    <h3 class="font-bold mb-2">🚀 Sistema Conectado</h3>
                    <p class="text-sm">Dashboard sincronizado con el bot de WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
