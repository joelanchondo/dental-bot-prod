const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');

// GET /admin - Dashboard administrativo principal
router.get('/', async (req, res) => {
  try {
    const businesses = await Business.find().sort({ createdAt: -1 });
    const totalAppointments = await Appointment.countDocuments();
    const activeBusinesses = await Business.countDocuments({ status: 'active' });
    const demoBusinesses = await Business.countDocuments({ plan: 'demo' });

    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Dental Bot</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .header { background: #dc2626; color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .stat-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .business-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .business-item { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .btn { padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin: 2px; text-decoration: none; display: inline-block; }
        .btn-delete { background: #dc2626; color: white; }
        .btn-edit { background: #2563eb; color: white; }
        .btn-view { background: #059669; color: white; }
        .business-info { flex-grow: 1; }
        .business-actions { display: flex; gap: 5px; }
        .tab-container { margin: 20px 0; }
        .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
        .tab { padding: 10px 20px; background: #e5e7eb; border-radius: 5px; cursor: pointer; }
        .tab.active { background: #2563eb; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚙️ Dashboard Administrativo</h1>
        <p>Sistema Dental Bot - Control Total</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <h3>🏢 Total Negocios</h3>
            <div style="font-size: 2rem; font-weight: bold;">${businesses.length}</div>
        </div>
        <div class="stat-card">
            <h3>📅 Total Citas</h3>
            <div style="font-size: 2rem; font-weight: bold;">${totalAppointments}</div>
        </div>
        <div class="stat-card">
            <h3>✅ Activos</h3>
            <div style="font-size: 2rem; font-weight: bold;">${activeBusinesses}</div>
        </div>
        <div class="stat-card">
            <h3>🆓 Demos</h3>
            <div style="font-size: 2rem; font-weight: bold;">${demoBusinesses}</div>
        </div>
    </div>

    <div class="tab-container">
        <div class="tabs">
            <div class="tab active" onclick="showTab('clients')">📋 Clientes</div>
            <div class="tab" onclick="showTab('onboarding')">🚀 Onboarding</div>
            <div class="tab" onclick="showTab('analytics')">📊 Analytics</div>
        </div>

        <!-- TAB CLIENTES -->
        <div id="tab-clients" class="tab-content active">
            <div class="business-list">
                <h2>📋 Gestión de Clientes (${businesses.length})</h2>
                ${businesses.map(business => \`
                    <div class="business-item">
                        <div class="business-info">
                            <strong>\${business.businessName}</strong><br>
                            <small>
                                Plan: <strong>\${business.plan}</strong> | 
                                Tipo: \${business.businessType} | 
                                Agente: \${business.salesAgent || 'N/A'} |
                                Creado: \${new Date(business.createdAt).toLocaleDateString()}
                            </small><br>
                            <small>📞 \${business.whatsappBusiness} | 📧 \${business.contactEmail}</small>
                        </div>
                        <div class="business-actions">
                            <a href="/dashboard/\${business._id}" target="_blank" class="btn btn-view">👁️ Ver</a>
                            <button class="btn btn-edit" onclick="editBusiness('\${business._id}')">✏️ Editar</button>
                            <button class="btn btn-delete" onclick="deleteBusiness('\${business._id}')">🗑️ Eliminar</button>
                        </div>
                    </div>
                \`).join('')}
            </div>
        </div>

        <!-- TAB ONBOARDING -->
        <div id="tab-onboarding" class="tab-content">
            <div style="background: white; padding: 20px; border-radius: 8px;">
                <h2>🚀 Crear Nuevo Cliente</h2>
                <p><a href="/onboarding" target="_blank" class="btn btn-edit">Abrir Onboarding</a></p>
                <p><small>Usa el formulario de onboarding para crear nuevos clientes</small></p>
            </div>
        </div>

        <!-- TAB ANALYTICS -->
        <div id="tab-analytics" class="tab-content">
            <div style="background: white; padding: 20px; border-radius: 8px;">
                <h2>📊 Analytics</h2>
                <p>Próximamente: Gráficos y estadísticas avanzadas</p>
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Ocultar todos los tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Mostrar tab seleccionado
            document.getElementById('tab-' + tabName).classList.add('active');
            event.target.classList.add('active');
        }

        function deleteBusiness(businessId) {
            if (confirm('¿Estás seguro de eliminar este negocio? Se eliminarán todas las citas relacionadas.')) {
                fetch(\`/api/admin/businesses/\${businessId}\`, {
                    method: 'DELETE'
                }).then(response => {
                    if (response.ok) {
                        alert('Negocio eliminado correctamente');
                        location.reload();
                    } else {
                        alert('Error al eliminar el negocio');
                    }
                });
            }
        }

        function editBusiness(businessId) {
            // Redirigir a página de edición (podemos crear después)
            window.open(\`/admin/edit/\${businessId}\`, '_blank');
        }
    </script>
</body>
</html>
    `);
  } catch (error) {
    res.status(500).send('Error cargando dashboard admin: ' + error.message);
  }
});

// DELETE /api/admin/businesses/:id - Eliminar negocio
router.delete('/businesses/:id', async (req, res) => {
  try {
    await Business.findByIdAndDelete(req.params.id);
    // También eliminar citas relacionadas
    await Appointment.deleteMany({ businessId: req.params.id });
    res.json({ success: true, message: 'Negocio y sus citas eliminados correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
