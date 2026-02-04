/**
 * 👑 PREMIUM ADMIN DASHBOARD
 * Panel de administración completo con autenticación
 */

const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Credenciales de admin (en producción usar DB)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BotSaaS2026!';

/**
 * GET /admin - Login page
 */
router.get('/', (req, res) => {
  const error = req.query.error;
  res.send(getLoginPage(error));
});

/**
 * POST /admin/login - Procesar login
 */
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    // Establecer cookie de sesión admin
    res.cookie('admin_session', 'authenticated', {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin?error=invalid');
  }
});

/**
 * Middleware para verificar sesión admin
 */
const requireAdmin = (req, res, next) => {
  if (req.cookies?.admin_session === 'authenticated') {
    next();
  } else {
    res.redirect('/admin?error=session');
  }
};

/**
 * GET /admin/dashboard - Dashboard principal
 */
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    // Obtener estadísticas
    const [businesses, users, appointments] = await Promise.all([
      Business.find().sort({ createdAt: -1 }),
      User.find().select('email name subscription createdAt businessId'),
      Appointment.find().sort({ createdAt: -1 }).limit(50)
    ]);

    // Calcular stats
    const stats = {
      totalBusinesses: businesses.length,
      totalUsers: users.length,
      totalAppointments: appointments.length,
      activeSubscriptions: users.filter(u => u.subscription?.status === 'active').length,
      planBreakdown: {
        basico: businesses.filter(b => b.plan === 'basico').length,
        pro: businesses.filter(b => b.plan === 'pro').length,
        ultra: businesses.filter(b => b.plan === 'ultra').length,
        trial: businesses.filter(b => b.plan === 'free-trial').length
      },
      revenue: {
        basico: businesses.filter(b => b.plan === 'basico').length * 299,
        pro: businesses.filter(b => b.plan === 'pro').length * 599,
        ultra: businesses.filter(b => b.plan === 'ultra').length * 999
      }
    };
    stats.totalMRR = stats.revenue.basico + stats.revenue.pro + stats.revenue.ultra;

    res.send(getDashboardPage(stats, businesses, users));
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

/**
 * GET /admin/business/:id - Ver detalle de negocio
 */
router.get('/business/:id', requireAdmin, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    const owner = await User.findOne({ businessId: req.params.id });
    const appointments = await Appointment.find({ businessId: req.params.id })
      .sort({ createdAt: -1 }).limit(20);

    if (!business) {
      return res.redirect('/admin/dashboard?error=not_found');
    }

    res.send(getBusinessDetailPage(business, owner, appointments));
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

/**
 * DELETE /admin/api/business/:id - Eliminar negocio
 */
router.delete('/api/business/:id', requireAdmin, async (req, res) => {
  try {
    await Business.findByIdAndDelete(req.params.id);
    await Appointment.deleteMany({ businessId: req.params.id });
    await User.updateMany({ businessId: req.params.id }, { $unset: { businessId: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /admin/logout - Cerrar sesión
 */
router.post('/logout', (req, res) => {
  res.clearCookie('admin_session');
  res.redirect('/admin');
});

// ============ TEMPLATES ============

function getLoginPage(error) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - BotSaaS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 50px;
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        .logo { font-size: 3em; margin-bottom: 10px; }
        h1 { color: white; font-size: 1.5em; margin-bottom: 10px; }
        .subtitle { color: rgba(255,255,255,0.6); margin-bottom: 30px; }
        .error {
            background: rgba(239,68,68,0.2);
            border: 1px solid #ef4444;
            color: #fca5a5;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        input {
            width: 100%;
            padding: 15px 20px;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            background: rgba(255,255,255,0.05);
            color: white;
            font-size: 1em;
            margin-bottom: 20px;
        }
        input:focus { outline: none; border-color: #6366f1; }
        input::placeholder { color: rgba(255,255,255,0.4); }
        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(99,102,241,0.4);
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">👑</div>
        <h1>Admin BotSaaS</h1>
        <p class="subtitle">Panel de Control</p>
        
        ${error ? `<div class="error">${error === 'invalid' ? '❌ Contraseña incorrecta' : '🔒 Sesión expirada'}</div>` : ''}
        
        <form method="POST" action="/admin/login">
            <input type="password" name="password" placeholder="Contraseña de administrador" required autofocus>
            <button type="submit">Acceder al Panel</button>
        </form>
    </div>
</body>
</html>`;
}

function getDashboardPage(stats, businesses, users) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Admin - BotSaaS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #0f0f1a;
            color: white;
            min-height: 100vh;
        }
        .navbar {
            background: rgba(255,255,255,0.05);
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .navbar-brand { font-size: 1.3em; font-weight: 700; }
        .navbar-brand span { color: #6366f1; }
        .btn-logout {
            background: rgba(239,68,68,0.2);
            border: 1px solid #ef4444;
            color: #fca5a5;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 30px; }
        
        /* Stats Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1));
            border: 1px solid rgba(99,102,241,0.3);
            border-radius: 16px;
            padding: 25px;
        }
        .stat-card.revenue { background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1)); border-color: rgba(34,197,94,0.3); }
        .stat-card.users { background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.1)); border-color: rgba(59,130,246,0.3); }
        .stat-card.appointments { background: linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.1)); border-color: rgba(249,115,22,0.3); }
        .stat-icon { font-size: 2em; margin-bottom: 10px; }
        .stat-value { font-size: 2.5em; font-weight: 700; }
        .stat-label { color: rgba(255,255,255,0.6); margin-top: 5px; }
        
        /* Plan Pills */
        .plan-pills { display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap; }
        .pill {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: 600;
        }
        .pill-basico { background: rgba(156,163,175,0.2); color: #9ca3af; }
        .pill-pro { background: rgba(99,102,241,0.2); color: #a5b4fc; }
        .pill-ultra { background: rgba(249,115,22,0.2); color: #fdba74; }
        .pill-trial { background: rgba(34,197,94,0.2); color: #86efac; }
        
        /* Tables */
        .section-title {
            font-size: 1.3em;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .table-container {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            overflow: hidden;
            margin-bottom: 40px;
        }
        table { width: 100%; border-collapse: collapse; }
        th {
            background: rgba(255,255,255,0.05);
            padding: 15px 20px;
            text-align: left;
            font-weight: 600;
            color: rgba(255,255,255,0.7);
            font-size: 0.85em;
            text-transform: uppercase;
        }
        td { padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        tr:hover { background: rgba(255,255,255,0.02); }
        .plan-badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.8em;
            font-weight: 600;
        }
        .plan-basico { background: #374151; color: #9ca3af; }
        .plan-pro { background: #4338ca; color: white; }
        .plan-ultra { background: #c2410c; color: white; }
        .plan-free-trial { background: #166534; color: white; }
        .btn-action {
            padding: 6px 12px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: 0.85em;
            margin-right: 5px;
        }
        .btn-view { background: #3b82f6; color: white; text-decoration: none; }
        .btn-delete { background: #ef4444; color: white; }
        .status-active { color: #22c55e; }
        .status-inactive { color: #ef4444; }
        
        /* Empty state */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: rgba(255,255,255,0.5);
        }
        .empty-state .icon { font-size: 4em; margin-bottom: 20px; opacity: 0.3; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-brand">👑 Bot<span>SaaS</span> Admin</div>
        <form action="/admin/logout" method="POST" style="display:inline;">
            <button class="btn-logout" type="submit">🚪 Cerrar Sesión</button>
        </form>
    </nav>
    
    <div class="container">
        <!-- Stats Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">🏢</div>
                <div class="stat-value">${stats.totalBusinesses}</div>
                <div class="stat-label">Negocios Totales</div>
                <div class="plan-pills">
                    <span class="pill pill-trial">${stats.planBreakdown.trial} Trial</span>
                    <span class="pill pill-basico">${stats.planBreakdown.basico} Básico</span>
                    <span class="pill pill-pro">${stats.planBreakdown.pro} Pro</span>
                    <span class="pill pill-ultra">${stats.planBreakdown.ultra} Ultra</span>
                </div>
            </div>
            <div class="stat-card revenue">
                <div class="stat-icon">💰</div>
                <div class="stat-value">$${stats.totalMRR.toLocaleString()}</div>
                <div class="stat-label">MRR (Ingresos Mensuales)</div>
            </div>
            <div class="stat-card users">
                <div class="stat-icon">👥</div>
                <div class="stat-value">${stats.totalUsers}</div>
                <div class="stat-label">Usuarios Registrados</div>
            </div>
            <div class="stat-card appointments">
                <div class="stat-icon">📅</div>
                <div class="stat-value">${stats.totalAppointments}</div>
                <div class="stat-label">Citas Totales</div>
            </div>
        </div>
        
        <!-- Businesses Table -->
        <h2 class="section-title">🏢 Negocios</h2>
        <div class="table-container">
            ${businesses.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Negocio</th>
                        <th>Tipo</th>
                        <th>Plan</th>
                        <th>WhatsApp</th>
                        <th>Creado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${businesses.map(b => `
                    <tr>
                        <td><strong>${b.businessName}</strong></td>
                        <td>${b.businessType || '-'}</td>
                        <td><span class="plan-badge plan-${b.plan}">${b.plan}</span></td>
                        <td>${b.whatsappBusiness || b.whatsapp?.number || '-'}</td>
                        <td>${new Date(b.createdAt).toLocaleDateString('es-MX')}</td>
                        <td>
                            <a href="/admin/business/${b._id}" class="btn-action btn-view">👁️ Ver</a>
                            <button class="btn-action btn-delete" onclick="deleteBusiness('${b._id}', '${b.businessName}')">🗑️</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : `
            <div class="empty-state">
                <div class="icon">🏢</div>
                <p>No hay negocios registrados aún</p>
            </div>
            `}
        </div>
        
        <!-- Users Table -->
        <h2 class="section-title">👥 Usuarios</h2>
        <div class="table-container">
            ${users.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Nombre</th>
                        <th>Plan</th>
                        <th>Estado</th>
                        <th>Registrado</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.slice(0, 20).map(u => `
                    <tr>
                        <td>${u.email}</td>
                        <td>${u.name || '-'}</td>
                        <td><span class="plan-badge plan-${u.subscription?.plan || 'free-trial'}">${u.subscription?.plan || 'N/A'}</span></td>
                        <td class="${u.subscription?.status === 'active' ? 'status-active' : 'status-inactive'}">
                            ${u.subscription?.status === 'active' ? '✅ Activo' : '⏸️ Inactivo'}
                        </td>
                        <td>${new Date(u.createdAt).toLocaleDateString('es-MX')}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : `
            <div class="empty-state">
                <div class="icon">👥</div>
                <p>No hay usuarios registrados aún</p>
            </div>
            `}
        </div>
    </div>
    
    <script>
        function deleteBusiness(id, name) {
            if (confirm('¿Eliminar "' + name + '" y todos sus datos?')) {
                fetch('/admin/api/business/' + id, { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            location.reload();
                        } else {
                            alert('Error: ' + data.error);
                        }
                    });
            }
        }
    </script>
</body>
</html>`;
}

function getBusinessDetailPage(business, owner, appointments) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${business.businessName} - Admin</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #0f0f1a;
            color: white;
            min-height: 100vh;
        }
        .navbar {
            background: rgba(255,255,255,0.05);
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .navbar-brand { font-size: 1.3em; font-weight: 700; }
        .back-link { color: #6366f1; text-decoration: none; }
        .container { max-width: 1200px; margin: 0 auto; padding: 30px; }
        
        .business-header {
            background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1));
            border: 1px solid rgba(99,102,241,0.3);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
        }
        .business-name { font-size: 2em; margin-bottom: 10px; }
        .business-meta { color: rgba(255,255,255,0.6); display: flex; gap: 20px; flex-wrap: wrap; }
        .meta-item { display: flex; align-items: center; gap: 5px; }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 25px;
        }
        .info-card h3 { margin-bottom: 20px; font-size: 1.1em; }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .info-label { color: rgba(255,255,255,0.5); }
        
        .plan-badge {
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .plan-basico { background: #374151; }
        .plan-pro { background: #4338ca; }
        .plan-ultra { background: #c2410c; }
        .plan-free-trial { background: #166534; }
        
        .appointments-table {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            overflow: hidden;
        }
        table { width: 100%; border-collapse: collapse; }
        th { background: rgba(255,255,255,0.05); padding: 15px; text-align: left; }
        td { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    </style>
</head>
<body>
    <nav class="navbar">
        <a href="/admin/dashboard" class="back-link">← Volver al Dashboard</a>
        <div class="navbar-brand">👑 BotSaaS Admin</div>
    </nav>
    
    <div class="container">
        <div class="business-header">
            <h1 class="business-name">${business.businessName}</h1>
            <div class="business-meta">
                <span class="meta-item">📂 ${business.businessType}</span>
                <span class="meta-item">📅 Creado: ${new Date(business.createdAt).toLocaleDateString('es-MX')}</span>
                <span class="meta-item"><span class="plan-badge plan-${business.plan}">${business.plan.toUpperCase()}</span></span>
            </div>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>📞 Información de Contacto</h3>
                <div class="info-row">
                    <span class="info-label">WhatsApp</span>
                    <span>${business.whatsappBusiness || business.whatsapp?.number || 'No configurado'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email</span>
                    <span>${business.contactEmail || 'No configurado'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Dirección</span>
                    <span>${business.address || 'No configurada'}</span>
                </div>
            </div>
            
            <div class="info-card">
                <h3>👤 Dueño</h3>
                ${owner ? `
                <div class="info-row">
                    <span class="info-label">Nombre</span>
                    <span>${owner.name || 'No especificado'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email</span>
                    <span>${owner.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Estado</span>
                    <span>${owner.subscription?.status === 'active' ? '✅ Activo' : '⏸️ Inactivo'}</span>
                </div>
                ` : '<p style="color: rgba(255,255,255,0.5);">Sin dueño asignado</p>'}
            </div>
            
            <div class="info-card">
                <h3>⚙️ Configuración Bot</h3>
                <div class="info-row">
                    <span class="info-label">Bot Activo</span>
                    <span>${business.botEnabled !== false ? '✅ Sí' : '❌ No'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Servicios</span>
                    <span>${business.services?.length || 0}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Google Calendar</span>
                    <span>${business.googleCalendar?.connected ? '✅ Conectado' : '❌ No'}</span>
                </div>
            </div>
        </div>
        
        <h2 style="margin-bottom: 20px;">📅 Últimas Citas</h2>
        <div class="appointments-table">
            ${appointments.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Servicio</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${appointments.map(a => `
                    <tr>
                        <td>${a.clientName || 'Sin nombre'}</td>
                        <td>${a.service || '-'}</td>
                        <td>${new Date(a.dateTime).toLocaleString('es-MX')}</td>
                        <td>${a.status}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<p style="padding: 30px; text-align: center; color: rgba(255,255,255,0.5);">Sin citas registradas</p>'}
        </div>
    </div>
</body>
</html>`;
}

module.exports = router;
