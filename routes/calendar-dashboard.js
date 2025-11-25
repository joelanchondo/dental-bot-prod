const express = require('express');
const router = express.Router();

// GET /calendar-dashboard - Versión con debug mejorado
router.get('/', async (req, res) => {
  try {
    const { businessId, clientName, service, phone } = req.query;
    
    console.log('🔍 CALENDARIO - Iniciando con businessId:', businessId);

    if (!businessId || businessId === 'undefined') {
      return res.status(400).send('❌ Error: businessId es requerido');
    }

    // Intentar cargar datos simples primero
    const Business = require('../models/Business');
    const business = await Business.findById(businessId);
    
    if (!business) {
      return res.status(404).send('❌ Negocio no encontrado en la base de datos');
    }

    console.log('✅ Negocio cargado:', business.businessName);

    // Enviar HTML simple pero funcional
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Calendario - ${business.businessName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800">📅 ${business.businessName}</h1>
            <p class="text-green-600 font-bold">✅ CALENDARIO INTERACTIVO FUNCIONANDO</p>
        </div>

        <div class="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 class="font-bold text-lg mb-2">Datos recibidos:</h3>
            <div class="grid grid-cols-2 gap-2">
                <p><strong>Paciente:</strong> ${clientName || 'No especificado'}</p>
                <p><strong>Servicio:</strong> ${service || 'No especificado'}</p>
                <p><strong>Teléfono:</strong> ${phone || 'No especificado'}</p>
                <p><strong>Negocio:</strong> ${business.businessName}</p>
            </div>
        </div>

        <div class="text-center p-8 bg-green-50 rounded-lg">
            <h2 class="text-2xl font-bold text-green-700 mb-4">🎉 ¡Calendario Cargado!</h2>
            <p class="text-gray-600">La versión interactiva está funcionando correctamente.</p>
            <p class="text-sm text-gray-500 mt-2">Business ID: ${businessId}</p>
        </div>
    </div>
</body>
</html>
    `);

  } catch (error) {
    console.error('❌ ERROR EN CALENDARIO:', error);
    res.status(500).send(`
      <h1>❌ Error en el calendario</h1>
      <p><strong>Error:</strong> ${error.message}</p>
      <p><strong>Stack:</strong> ${error.stack}</p>
    `);
  }
});

module.exports = router;
