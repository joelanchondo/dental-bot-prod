const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');

// GET /admin - Dashboard administrativo
router.get('/', async (req, res) => {
  try {
    const businesses = await Business.find().sort({ createdAt: -1 });
    
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .header { background: #dc2626; color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .business-list { background: white; padding: 20px; border-radius: 8px; }
        .business-item { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .btn { padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin: 2px; }
        .btn-delete { background: #dc2626; color: white; }
        .btn-view { background: #2563eb; color: white; }
        .business-info { flex-grow: 1; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Gestión de Clientes - Sistema Dental Bot</p>
    </div>
    
    <div class="business-list">
        <h2>📋 Clientes (${businesses.length})</h2>
        ${businesses.map(business => `
            <div class="business-item">
                <div class="business-info">
                    <strong>${business.businessName}</strong><br>
                    <small>Plan: ${business.plan} | ${business.businessType} | ${new Date(business.createdAt).toLocaleDateString('es-MX')}</small>
                </div>
                <div>
                    <a href="/dashboard/${business._id}" target="_blank" class="btn btn-view">Ver</a>
                    <button class="btn btn-delete" onclick="deleteBusiness('${business._id}')">Eliminar</button>
                </div>
            </div>
        `).join('')}
    </div>

    <script>
        function deleteBusiness(businessId) {
            if (confirm('¿Eliminar este cliente y todas sus citas?')) {
                fetch('/api/admin/businesses/' + businessId, {
                    method: 'DELETE'
                }).then(response => {
                    if (response.ok) {
                        alert('Cliente eliminado');
                        location.reload();
                    } else {
                        alert('Error al eliminar');
                    }
                });
            }
        }
    </script>
</body>
</html>
    `);
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

// DELETE /api/admin/businesses/:id - Eliminar cliente
router.delete('/businesses/:id', async (req, res) => {
  try {
    await Business.findByIdAndDelete(req.params.id);
    await Appointment.deleteMany({ businessId: req.params.id });
    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
