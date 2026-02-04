const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const moment = require('moment');
const mongoose = require('mongoose');

// =========================================================
// 1. API ROUTES
// =========================================================

// GET - Info del negocio
router.get("/:identifier/data/info", async (req, res) => {
    try {
        let business;
        if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
            business = await Business.findById(req.params.identifier);
        } else {
            business = await Business.findOne({ slug: req.params.identifier });
        }
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });
        res.json({ ...business.toObject(), services: business.services || [] });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET - Servicios
router.get("/:identifier/data/services", async (req, res) => {
    try {
        let business;
        if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
            business = await Business.findById(req.params.identifier);
        } else {
            business = await Business.findOne({ slug: req.params.identifier });
        }
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });
        res.json(business.services || []);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET - Citas
router.get("/:identifier/data/appointments", async (req, res) => {
    try {
        const { identifier } = req.params;
        const { month, year } = req.query;
        let business;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            business = await Business.findById(identifier);
        } else {
            business = await Business.findOne({ slug: identifier });
        }
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const appointments = await Appointment.find({
            businessId: business._id,
            dateTime: { $gte: startDate, $lte: endDate }
        }).sort({ dateTime: 1 });

        res.json(appointments);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET - Analytics
router.get("/:identifier/data/analytics", async (req, res) => {
    try {
        const { identifier } = req.params;
        let business;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            business = await Business.findById(identifier);
        } else {
            business = await Business.findOne({ slug: identifier });
        }
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

        // Last 30 days appointments
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const appointments = await Appointment.find({
            businessId: business._id,
            dateTime: { $gte: thirtyDaysAgo }
        });

        // Group by day
        const dailyData = {};
        appointments.forEach(apt => {
            const day = moment(apt.dateTime).format('YYYY-MM-DD');
            if (!dailyData[day]) dailyData[day] = { count: 0, revenue: 0 };
            dailyData[day].count++;
            dailyData[day].revenue += apt.totalAmount || 0;
        });

        res.json({
            totalAppointments: appointments.length,
            completedAppointments: appointments.filter(a => a.status === 'completed').length,
            cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
            totalRevenue: appointments.reduce((sum, a) => sum + (a.totalAmount || 0), 0),
            dailyData
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST - Crear Servicio
router.post("/:identifier/data/services", async (req, res) => {
    try {
        let business;
        if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
            business = await Business.findById(req.params.identifier);
        } else {
            business = await Business.findOne({ slug: req.params.identifier });
        }
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

        const { name, description, duration, price, category, active, requiresPayment, commission } = req.body;

        const newService = {
            name, description, duration: parseInt(duration || 30), price: parseInt(price || 0),
            category: category || 'general', active: active !== false,
            requiresPayment: requiresPayment === true, commission: parseInt(commission || 0),
            createdAt: new Date(), updatedAt: new Date()
        };

        business.services.push(newService);
        await business.save();
        res.json({ success: true, service: newService, services: business.services });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// PUT - Actualizar Servicio
router.put("/:identifier/data/services/:serviceId", async (req, res) => {
    try {
        let business;
        if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
            business = await Business.findById(req.params.identifier);
        } else {
            business = await Business.findOne({ slug: req.params.identifier });
        }
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

        const service = business.services.id(req.params.serviceId);
        if (!service) return res.status(404).json({ error: "Servicio no encontrado" });

        Object.assign(service, req.body);
        service.updatedAt = new Date();

        await business.save();
        res.json({ success: true, service, services: business.services });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE - Eliminar Servicio
router.delete("/:identifier/data/services/:serviceId", async (req, res) => {
    try {
        let business;
        if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
            business = await Business.findById(req.params.identifier);
        } else {
            business = await Business.findOne({ slug: req.params.identifier });
        }
        if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

        business.services.pull({ _id: req.params.serviceId });
        await business.save();
        res.json({ success: true, services: business.services });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// PUT - Update appointment status
router.put("/:identifier/data/appointments/:appointmentId", async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.appointmentId,
            { status, updatedAt: new Date() },
            { new: true }
        );
        if (!appointment) return res.status(404).json({ error: "Cita no encontrada" });
        res.json({ success: true, appointment });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// =========================================================
// 2. DASHBOARD PRO - ENTERPRISE EDITION
// =========================================================

router.get('/:identifier', async (req, res) => {
    try {
        let business;
        if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
            business = await Business.findById(req.params.identifier);
        } else {
            business = await Business.findOne({ slug: req.params.identifier });
        }

        if (!business) return res.status(404).send('Negocio no encontrado');

        // Get today's appointments count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = await Appointment.countDocuments({
            businessId: business._id,
            dateTime: { $gte: today, $lt: tomorrow }
        });

        // Get this month's stats
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const monthAppointments = await Appointment.find({
            businessId: business._id,
            dateTime: { $gte: monthStart, $lte: monthEnd }
        });

        const monthRevenue = monthAppointments.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
        const completedCount = monthAppointments.filter(a => a.status === 'completed').length;

        res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Pro - ${business.businessName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/min/moment.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/locale/es.js"></script>
    <style>
        :root {
            --bg-primary: #0a0a0f;
            --bg-secondary: #12121a;
            --bg-card: #1a1a24;
            --bg-hover: #22222e;
            --border-color: #2a2a3a;
            --text-primary: #ffffff;
            --text-secondary: #8b8b9e;
            --text-muted: #5a5a6e;
            --accent: #f59e0b;
            --accent-light: #fbbf24;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --info: #3b82f6;
            --purple: #8b5cf6;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
        }

        /* Sidebar */
        .sidebar {
            width: 260px;
            background: var(--bg-secondary);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            position: fixed;
            height: 100vh;
            z-index: 100;
        }

        .sidebar-header {
            padding: 24px;
            border-bottom: 1px solid var(--border-color);
        }

        .sidebar-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: var(--text-primary);
        }

        .sidebar-logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--accent), var(--accent-light));
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .sidebar-logo-text {
            font-size: 18px;
            font-weight: 700;
        }

        .sidebar-logo-text span {
            color: var(--accent);
        }

        .sidebar-nav {
            flex: 1;
            padding: 16px 12px;
            overflow-y: auto;
        }

        .nav-section {
            margin-bottom: 24px;
        }

        .nav-section-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            padding: 0 12px;
            margin-bottom: 8px;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 10px;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 4px;
        }

        .nav-item:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
        }

        .nav-item.active {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
            color: var(--accent);
            border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .nav-item i {
            width: 20px;
            text-align: center;
            font-size: 16px;
        }

        .nav-item .badge {
            margin-left: auto;
            background: var(--accent);
            color: #000;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
        }

        .sidebar-footer {
            padding: 16px;
            border-top: 1px solid var(--border-color);
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: var(--bg-card);
            border-radius: 12px;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--purple), var(--info));
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }

        .user-details {
            flex: 1;
            min-width: 0;
        }

        .user-name {
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .user-plan {
            font-size: 12px;
            color: var(--accent);
            font-weight: 500;
        }

        /* Main Content */
        .main-content {
            flex: 1;
            margin-left: 260px;
            min-height: 100vh;
        }

        /* Top Bar */
        .topbar {
            height: 70px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
            position: sticky;
            top: 0;
            z-index: 50;
        }

        .topbar-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .page-title {
            font-size: 20px;
            font-weight: 700;
        }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .status-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 20px;
            font-size: 13px;
            color: var(--success);
            font-weight: 500;
        }

        .status-badge .dot {
            width: 8px;
            height: 8px;
            background: var(--success);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .topbar-btn {
            width: 40px;
            height: 40px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }

        .topbar-btn:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
        }

        /* Page Content */
        .page-content {
            padding: 32px;
        }

        /* Section */
        .section {
            display: none;
        }

        .section.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.3s;
        }

        .stat-card:hover {
            border-color: rgba(245, 158, 11, 0.3);
            transform: translateY(-2px);
        }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .stat-icon.blue { background: rgba(59, 130, 246, 0.1); color: var(--info); }
        .stat-icon.green { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .stat-icon.yellow { background: rgba(245, 158, 11, 0.1); color: var(--accent); }
        .stat-icon.purple { background: rgba(139, 92, 246, 0.1); color: var(--purple); }

        .stat-trend {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 500;
            padding: 4px 8px;
            border-radius: 6px;
        }

        .stat-trend.up {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .stat-trend.down {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
        }

        .stat-value {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 4px;
            letter-spacing: -0.02em;
        }

        .stat-label {
            font-size: 14px;
            color: var(--text-secondary);
        }

        /* Cards */
        .card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            overflow: hidden;
        }

        .card-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .card-title {
            font-size: 16px;
            font-weight: 600;
        }

        .card-body {
            padding: 24px;
        }

        /* Grid Layouts */
        .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
        }

        .grid-3 {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
        }

        /* Chart Container */
        .chart-container {
            height: 300px;
            position: relative;
        }

        /* Calendar */
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .calendar-nav {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .calendar-nav-btn {
            width: 36px;
            height: 36px;
            background: var(--bg-hover);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }

        .calendar-nav-btn:hover {
            background: var(--accent);
            color: #000;
            border-color: var(--accent);
        }

        .calendar-month {
            font-size: 18px;
            font-weight: 600;
            min-width: 160px;
            text-align: center;
        }

        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 8px;
        }

        .calendar-day-header {
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-muted);
            padding: 8px;
        }

        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            background: var(--bg-hover);
            border: 1px solid transparent;
        }

        .calendar-day:hover {
            border-color: var(--accent);
        }

        .calendar-day.other-month {
            opacity: 0.3;
        }

        .calendar-day.today {
            background: linear-gradient(135deg, var(--accent), var(--accent-light));
            color: #000;
            font-weight: 600;
        }

        .calendar-day.has-appointments::after {
            content: '';
            position: absolute;
            bottom: 6px;
            width: 6px;
            height: 6px;
            background: var(--success);
            border-radius: 50%;
        }

        .calendar-day.today.has-appointments::after {
            background: #000;
        }

        /* Appointments List */
        .appointments-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .appointment-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px;
            background: var(--bg-hover);
            border-radius: 12px;
            border: 1px solid var(--border-color);
            transition: all 0.2s;
        }

        .appointment-item:hover {
            border-color: rgba(245, 158, 11, 0.3);
        }

        .appointment-time {
            min-width: 60px;
            text-align: center;
        }

        .appointment-time-value {
            font-size: 16px;
            font-weight: 600;
        }

        .appointment-time-label {
            font-size: 11px;
            color: var(--text-muted);
        }

        .appointment-divider {
            width: 3px;
            height: 40px;
            background: var(--accent);
            border-radius: 2px;
        }

        .appointment-info {
            flex: 1;
        }

        .appointment-client {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .appointment-service {
            font-size: 13px;
            color: var(--text-secondary);
        }

        .appointment-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }

        .appointment-status.pending {
            background: rgba(245, 158, 11, 0.1);
            color: var(--accent);
        }

        .appointment-status.confirmed {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .appointment-status.completed {
            background: rgba(59, 130, 246, 0.1);
            color: var(--info);
        }

        .appointment-status.cancelled {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
        }

        /* Services Grid */
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        .service-card {
            background: var(--bg-hover);
            border: 1px solid var(--border-color);
            border-radius: 14px;
            padding: 20px;
            transition: all 0.3s;
        }

        .service-card:hover {
            border-color: rgba(245, 158, 11, 0.3);
            transform: translateY(-2px);
        }

        .service-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }

        .service-icon {
            width: 48px;
            height: 48px;
            background: rgba(245, 158, 11, 0.1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }

        .service-price {
            font-size: 20px;
            font-weight: 700;
            color: var(--accent);
        }

        .service-name {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .service-duration {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 16px;
        }

        .service-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 16px;
            border-top: 1px solid var(--border-color);
        }

        .service-status {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
        }

        .service-status .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .service-status.active .dot { background: var(--success); }
        .service-status.active { color: var(--success); }
        .service-status.inactive .dot { background: var(--text-muted); }
        .service-status.inactive { color: var(--text-muted); }

        .service-actions {
            display: flex;
            gap: 8px;
        }

        .service-btn {
            width: 32px;
            height: 32px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }

        .service-btn:hover {
            background: var(--accent);
            color: #000;
            border-color: var(--accent);
        }

        .service-btn.delete:hover {
            background: var(--danger);
            border-color: var(--danger);
            color: #fff;
        }

        /* Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            text-decoration: none;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--accent), var(--accent-light));
            color: #000;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
        }

        .btn-secondary {
            background: var(--bg-hover);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
        }

        .btn-secondary:hover {
            background: var(--bg-card);
            border-color: var(--accent);
        }

        /* Form Elements */
        .form-group {
            margin-bottom: 20px;
        }

        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 8px;
        }

        .form-input {
            width: 100%;
            padding: 12px 16px;
            background: var(--bg-hover);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            font-size: 14px;
            color: var(--text-primary);
            transition: all 0.2s;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--accent);
            background: var(--bg-card);
        }

        .form-input::placeholder {
            color: var(--text-muted);
        }

        /* Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            width: 100%;
            max-width: 480px;
            max-height: 90vh;
            overflow-y: auto;
        }

        .modal-header {
            padding: 24px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-title {
            font-size: 18px;
            font-weight: 700;
        }

        .modal-close {
            width: 36px;
            height: 36px;
            background: var(--bg-hover);
            border: none;
            border-radius: 8px;
            color: var(--text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .modal-close:hover {
            background: var(--danger);
            color: #fff;
        }

        .modal-body {
            padding: 24px;
        }

        .modal-footer {
            padding: 20px 24px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        /* Bot Settings */
        .bot-status-card {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02));
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
        }

        .bot-status-card.inactive {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02));
            border-color: rgba(245, 158, 11, 0.2);
        }

        .bot-status-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .bot-status-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .bot-status-icon {
            width: 48px;
            height: 48px;
            background: rgba(16, 185, 129, 0.15);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: var(--success);
        }

        .bot-status-card.inactive .bot-status-icon {
            background: rgba(245, 158, 11, 0.15);
            color: var(--accent);
        }

        .bot-number {
            font-size: 24px;
            font-weight: 700;
            font-family: 'SF Mono', monospace;
        }

        .bot-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-top: 20px;
        }

        .bot-stat {
            text-align: center;
            padding: 16px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
        }

        .bot-stat-value {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .bot-stat-label {
            font-size: 12px;
            color: var(--text-secondary);
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .empty-state-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .empty-state-text {
            font-size: 14px;
            color: var(--text-secondary);
            margin-bottom: 24px;
        }

        /* Search */
        .search-box {
            position: relative;
            margin-bottom: 24px;
        }

        .search-box i {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
        }

        .search-box input {
            width: 100%;
            padding: 12px 16px 12px 44px;
            background: var(--bg-hover);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            font-size: 14px;
            color: var(--text-primary);
        }

        .search-box input:focus {
            outline: none;
            border-color: var(--accent);
        }

        /* Responsive */
        @media (max-width: 1200px) {
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            .grid-3 {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s;
            }
            .sidebar.open {
                transform: translateX(0);
            }
            .main-content {
                margin-left: 0;
            }
            .stats-grid {
                grid-template-columns: 1fr;
            }
            .page-content {
                padding: 16px;
            }
        }
    </style>
</head>
<body>
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <a href="/" class="sidebar-logo">
                <div class="sidebar-logo-icon">🤖</div>
                <div class="sidebar-logo-text">Bot<span>SaaS</span></div>
            </a>
        </div>

        <nav class="sidebar-nav">
            <div class="nav-section">
                <div class="nav-section-title">Principal</div>
                <div class="nav-item active" data-section="overview">
                    <i class="fas fa-chart-pie"></i>
                    <span>Dashboard</span>
                </div>
                <div class="nav-item" data-section="appointments">
                    <i class="fas fa-calendar-check"></i>
                    <span>Citas</span>
                    <span class="badge" id="today-badge">${todayAppointments}</span>
                </div>
                <div class="nav-item" data-section="calendar">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Calendario</span>
                </div>
            </div>

            <div class="nav-section">
                <div class="nav-section-title">Gestión</div>
                <div class="nav-item" data-section="services">
                    <i class="fas fa-concierge-bell"></i>
                    <span>Servicios</span>
                </div>
                <div class="nav-item" data-section="clients">
                    <i class="fas fa-users"></i>
                    <span>Clientes</span>
                </div>
            </div>

            <div class="nav-section">
                <div class="nav-section-title">Bot & Config</div>
                <div class="nav-item" data-section="bot">
                    <i class="fab fa-whatsapp"></i>
                    <span>WhatsApp Bot</span>
                </div>
                <div class="nav-item" data-section="settings">
                    <i class="fas fa-cog"></i>
                    <span>Configuración</span>
                </div>
            </div>
        </nav>

        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar">🏢</div>
                <div class="user-details">
                    <div class="user-name">${business.businessName}</div>
                    <div class="user-plan">${(business.plan || 'free-trial').toUpperCase()}</div>
                </div>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Top Bar -->
        <header class="topbar">
            <div class="topbar-left">
                <button class="topbar-btn" id="menu-toggle" style="display: none;">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title" id="page-title">Dashboard</h1>
            </div>
            <div class="topbar-right">
                <div class="status-badge">
                    <span class="dot"></span>
                    Bot Activo
                </div>
                <button class="topbar-btn">
                    <i class="fas fa-bell"></i>
                </button>
                <button class="topbar-btn" onclick="window.location.href='/'">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </header>

        <!-- Page Content -->
        <div class="page-content">
            <!-- Overview Section -->
            <section class="section active" id="overview-section">
                <!-- Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon blue">
                                <i class="fas fa-calendar-day"></i>
                            </div>
                            <div class="stat-trend up">
                                <i class="fas fa-arrow-up"></i>
                                <span>12%</span>
                            </div>
                        </div>
                        <div class="stat-value" id="stat-today">${todayAppointments}</div>
                        <div class="stat-label">Citas Hoy</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon green">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-trend up">
                                <i class="fas fa-arrow-up"></i>
                                <span>8%</span>
                            </div>
                        </div>
                        <div class="stat-value" id="stat-completed">${completedCount}</div>
                        <div class="stat-label">Completadas (Mes)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon yellow">
                                <i class="fas fa-dollar-sign"></i>
                            </div>
                            <div class="stat-trend up">
                                <i class="fas fa-arrow-up"></i>
                                <span>15%</span>
                            </div>
                        </div>
                        <div class="stat-value" id="stat-revenue">$${monthRevenue.toLocaleString()}</div>
                        <div class="stat-label">Ingresos (Mes)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon purple">
                                <i class="fas fa-concierge-bell"></i>
                            </div>
                        </div>
                        <div class="stat-value" id="stat-services">${business.services?.length || 0}</div>
                        <div class="stat-label">Servicios Activos</div>
                    </div>
                </div>

                <!-- Charts & Calendar -->
                <div class="grid-3" style="margin-bottom: 32px;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Ingresos (Últimos 7 días)</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="revenueChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Distribución de Servicios</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="servicesChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Today's Appointments -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Citas de Hoy</h3>
                        <button class="btn btn-secondary" onclick="navigateToSection('appointments')">
                            Ver Todas
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="appointments-list" id="today-appointments">
                            <div class="empty-state">
                                <div class="empty-state-icon">📅</div>
                                <div class="empty-state-title">Sin citas para hoy</div>
                                <div class="empty-state-text">Las próximas citas aparecerán aquí</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Appointments Section -->
            <section class="section" id="appointments-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Gestión de Citas</h3>
                        <div style="display: flex; gap: 12px;">
                            <select class="form-input" id="apt-status-filter" style="width: auto;">
                                <option value="all">Todos los estados</option>
                                <option value="pending">Pendientes</option>
                                <option value="confirmed">Confirmadas</option>
                                <option value="completed">Completadas</option>
                                <option value="cancelled">Canceladas</option>
                            </select>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="appointments-list" id="all-appointments">
                            <p style="color: var(--text-secondary);">Cargando citas...</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Calendar Section -->
            <section class="section" id="calendar-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Calendario</h3>
                        <div class="calendar-nav">
                            <button class="calendar-nav-btn" onclick="changeMonth(-1)">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span class="calendar-month" id="calendar-month">Enero 2026</span>
                            <button class="calendar-nav-btn" onclick="changeMonth(1)">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="calendar-grid" id="calendar-grid"></div>
                    </div>
                </div>
            </section>

            <!-- Services Section -->
            <section class="section" id="services-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="font-size: 24px; font-weight: 700;">Mis Servicios</h2>
                    <button class="btn btn-primary" onclick="showServiceModal()">
                        <i class="fas fa-plus"></i>
                        Nuevo Servicio
                    </button>
                </div>

                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="service-search" placeholder="Buscar servicios..." oninput="filterServices()">
                </div>

                <div class="services-grid" id="services-grid">
                    <div class="empty-state">
                        <div class="empty-state-icon">🛠️</div>
                        <div class="empty-state-title">Sin servicios</div>
                        <div class="empty-state-text">Agrega tu primer servicio para empezar</div>
                    </div>
                </div>
            </section>

            <!-- Clients Section -->
            <section class="section" id="clients-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Base de Clientes</h3>
                    </div>
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="empty-state-icon">👥</div>
                            <div class="empty-state-title">Clientes</div>
                            <div class="empty-state-text">Los clientes que agenden citas aparecerán aquí automáticamente</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Bot Section -->
            <section class="section" id="bot-section">
                <div class="bot-status-card ${business.whatsapp?.status === 'active' ? '' : 'inactive'}">
                    <div class="bot-status-header">
                        <div class="bot-status-info">
                            <div class="bot-status-icon">
                                <i class="fab fa-whatsapp"></i>
                            </div>
                            <div>
                                <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">
                                    ${business.whatsapp?.status === 'active' ? 'WhatsApp Conectado' : 'WhatsApp Pendiente'}
                                </div>
                                <div class="bot-number">${business.whatsapp?.number || 'Sin número asignado'}</div>
                            </div>
                        </div>
                        ${business.whatsapp?.status !== 'active' ? `
                        <button class="btn btn-primary" onclick="activateBot()">
                            <i class="fas fa-bolt"></i>
                            Activar Bot
                        </button>
                        ` : ''}
                    </div>
                    ${business.whatsapp?.status === 'active' ? `
                    <div class="bot-stats">
                        <div class="bot-stat">
                            <div class="bot-stat-value">0</div>
                            <div class="bot-stat-label">Mensajes Hoy</div>
                        </div>
                        <div class="bot-stat">
                            <div class="bot-stat-value">0</div>
                            <div class="bot-stat-label">Citas Agendadas</div>
                        </div>
                        <div class="bot-stat">
                            <div class="bot-stat-value">0 min</div>
                            <div class="bot-stat-label">Tiempo Ahorrado</div>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="grid-2">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Mensaje de Bienvenida</h3>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label class="form-label">Saludo inicial</label>
                                <textarea class="form-input" rows="4" placeholder="¡Hola! Bienvenido a ${business.businessName}. ¿En qué puedo ayudarte?">${business.botConfig?.welcomeMessage || ''}</textarea>
                            </div>
                            <button class="btn btn-secondary">Guardar Cambios</button>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Horario de Atención</h3>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label class="form-label">Horario del Bot</label>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <input type="time" class="form-input" value="09:00">
                                    <input type="time" class="form-input" value="18:00">
                                </div>
                            </div>
                            <button class="btn btn-secondary">Guardar Horario</button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Settings Section -->
            <section class="section" id="settings-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Información del Negocio</h3>
                    </div>
                    <div class="card-body">
                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label">Nombre del Negocio</label>
                                <input type="text" class="form-input" value="${business.businessName}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Slug (URL)</label>
                                <input type="text" class="form-input" value="${business.slug}" readonly>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Teléfono</label>
                                <input type="text" class="form-input" value="${business.phone || ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-input" value="${business.email || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dirección</label>
                            <input type="text" class="form-input" value="${business.address || ''}" placeholder="Calle, Número, Colonia, Ciudad">
                        </div>
                        <button class="btn btn-primary">Guardar Cambios</button>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <!-- Service Modal -->
    <div class="modal-overlay" id="service-modal">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title" id="modal-title">Nuevo Servicio</h3>
                <button class="modal-close" onclick="closeServiceModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="service-form" onsubmit="handleServiceSubmit(event)">
                    <input type="hidden" id="service-id">
                    <div class="form-group">
                        <label class="form-label">Nombre del Servicio *</label>
                        <input type="text" class="form-input" id="service-name" placeholder="Ej: Limpieza Dental" required>
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Precio ($)</label>
                            <input type="number" class="form-input" id="service-price" value="0" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Duración (min)</label>
                            <input type="number" class="form-input" id="service-duration" value="30" min="5">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoría</label>
                        <select class="form-input" id="service-category">
                            <option value="general">General</option>
                            <option value="consulta">Consulta</option>
                            <option value="tratamiento">Tratamiento</option>
                            <option value="estetico">Estético</option>
                            <option value="urgencia">Urgencia</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="service-active" checked>
                            <span class="form-label" style="margin: 0;">Servicio activo</span>
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeServiceModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="document.getElementById('service-form').requestSubmit()">
                    Guardar Servicio
                </button>
            </div>
        </div>
    </div>

    <script>
        // === GLOBAL STATE ===
        const businessId = "${business._id}";
        const baseUrl = window.location.pathname.replace(/\\/$/, '');
        let servicesData = ${JSON.stringify(business.services || [])};
        let appointmentsData = [];
        let calendarData = {};
        let currentDate = moment();

        // === INITIALIZATION ===
        document.addEventListener('DOMContentLoaded', () => {
            moment.locale('es');
            initNavigation();
            loadAppointments();
            renderServices();
            renderCalendar();
            initCharts();
        });

        // === NAVIGATION ===
        function initNavigation() {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    const section = item.dataset.section;
                    navigateToSection(section);
                });
            });
        }

        function navigateToSection(section) {
            // Update nav
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelector(\`[data-section="\${section}"]\`)?.classList.add('active');

            // Update section
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(\`\${section}-section\`)?.classList.add('active');

            // Update title
            const titles = {
                overview: 'Dashboard',
                appointments: 'Citas',
                calendar: 'Calendario',
                services: 'Servicios',
                clients: 'Clientes',
                bot: 'WhatsApp Bot',
                settings: 'Configuración'
            };
            document.getElementById('page-title').textContent = titles[section] || 'Dashboard';
        }

        // === APPOINTMENTS ===
        async function loadAppointments() {
            try {
                const res = await fetch(\`\${baseUrl}/data/appointments?month=\${currentDate.month() + 1}&year=\${currentDate.year()}\`);
                if (res.ok) {
                    appointmentsData = await res.json();
                    processAppointments();
                    renderTodayAppointments();
                    renderAllAppointments();
                    renderCalendar();
                }
            } catch (err) {
                console.error('Error loading appointments:', err);
            }
        }

        function processAppointments() {
            calendarData = {};
            appointmentsData.forEach(apt => {
                const date = moment(apt.dateTime).format('YYYY-MM-DD');
                if (!calendarData[date]) calendarData[date] = [];
                calendarData[date].push(apt);
            });
        }

        function renderTodayAppointments() {
            const container = document.getElementById('today-appointments');
            const today = moment().format('YYYY-MM-DD');
            const todayApts = appointmentsData.filter(a => moment(a.dateTime).format('YYYY-MM-DD') === today);

            if (todayApts.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">📅</div>
                        <div class="empty-state-title">Sin citas para hoy</div>
                        <div class="empty-state-text">Las próximas citas aparecerán aquí</div>
                    </div>
                \`;
                return;
            }

            container.innerHTML = todayApts.slice(0, 5).map(apt => renderAppointmentItem(apt)).join('');
        }

        function renderAllAppointments() {
            const container = document.getElementById('all-appointments');
            const filter = document.getElementById('apt-status-filter')?.value || 'all';

            let filtered = appointmentsData;
            if (filter !== 'all') {
                filtered = appointmentsData.filter(a => a.status === filter);
            }

            if (filtered.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-title">Sin citas</div>
                        <div class="empty-state-text">No hay citas para mostrar</div>
                    </div>
                \`;
                return;
            }

            container.innerHTML = filtered.map(apt => renderAppointmentItem(apt)).join('');
        }

        function renderAppointmentItem(apt) {
            const status = apt.status || 'pending';
            const statusLabels = {
                pending: 'Pendiente',
                confirmed: 'Confirmada',
                completed: 'Completada',
                cancelled: 'Cancelada'
            };

            return \`
                <div class="appointment-item">
                    <div class="appointment-time">
                        <div class="appointment-time-value">\${moment(apt.dateTime).format('HH:mm')}</div>
                        <div class="appointment-time-label">\${moment(apt.dateTime).format('DD MMM')}</div>
                    </div>
                    <div class="appointment-divider"></div>
                    <div class="appointment-info">
                        <div class="appointment-client">\${apt.clientName || 'Cliente'}</div>
                        <div class="appointment-service">\${apt.serviceName || 'Servicio'} • \${apt.clientPhone || ''}</div>
                    </div>
                    <span class="appointment-status \${status}">\${statusLabels[status]}</span>
                </div>
            \`;
        }

        document.getElementById('apt-status-filter')?.addEventListener('change', renderAllAppointments);

        // === CALENDAR ===
        function renderCalendar() {
            const grid = document.getElementById('calendar-grid');
            if (!grid) return;

            document.getElementById('calendar-month').textContent = currentDate.format('MMMM YYYY');

            const start = currentDate.clone().startOf('month').startOf('week');
            const end = currentDate.clone().endOf('month').endOf('week');
            const day = start.clone();

            let html = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
                .map(d => \`<div class="calendar-day-header">\${d}</div>\`).join('');

            while (day.isSameOrBefore(end)) {
                const dateStr = day.format('YYYY-MM-DD');
                const isCurrentMonth = day.month() === currentDate.month();
                const isToday = day.isSame(moment(), 'day');
                const hasApts = calendarData[dateStr]?.length > 0;

                let classes = 'calendar-day';
                if (!isCurrentMonth) classes += ' other-month';
                if (isToday) classes += ' today';
                if (hasApts) classes += ' has-appointments';

                html += \`<div class="\${classes}" data-date="\${dateStr}">\${day.date()}</div>\`;
                day.add(1, 'day');
            }

            grid.innerHTML = html;
        }

        function changeMonth(delta) {
            currentDate.add(delta, 'months');
            loadAppointments();
        }

        // === SERVICES ===
        function renderServices() {
            const container = document.getElementById('services-grid');
            const search = document.getElementById('service-search')?.value.toLowerCase() || '';
            const filtered = servicesData.filter(s => s.name.toLowerCase().includes(search));

            if (filtered.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <div class="empty-state-icon">🛠️</div>
                        <div class="empty-state-title">Sin servicios</div>
                        <div class="empty-state-text">Agrega tu primer servicio para empezar</div>
                        <button class="btn btn-primary" onclick="showServiceModal()">
                            <i class="fas fa-plus"></i> Agregar Servicio
                        </button>
                    </div>
                \`;
                return;
            }

            container.innerHTML = filtered.map(s => {
                const isActive = s.active !== false;
                return \`
                    <div class="service-card">
                        <div class="service-header">
                            <div class="service-icon">\${getCategoryIcon(s.category)}</div>
                            <div class="service-price">$\${(s.price || 0).toLocaleString()}</div>
                        </div>
                        <div class="service-name">\${s.name}</div>
                        <div class="service-duration"><i class="far fa-clock"></i> \${s.duration || 30} minutos</div>
                        <div class="service-footer">
                            <div class="service-status \${isActive ? 'active' : 'inactive'}">
                                <span class="dot"></span>
                                \${isActive ? 'Activo' : 'Inactivo'}
                            </div>
                            <div class="service-actions">
                                <button class="service-btn" onclick="editService('\${s._id}')" title="Editar">
                                    <i class="fas fa-pen"></i>
                                </button>
                                <button class="service-btn delete" onclick="deleteService('\${s._id}')" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');

            document.getElementById('stat-services').textContent = servicesData.length;
        }

        function getCategoryIcon(category) {
            const icons = {
                general: '📋',
                consulta: '🩺',
                tratamiento: '💉',
                estetico: '✨',
                urgencia: '🚨',
                dentist: '🦷',
                cleaning: '🧹'
            };
            return icons[category] || '📋';
        }

        function filterServices() {
            renderServices();
        }

        function showServiceModal(id = null) {
            const modal = document.getElementById('service-modal');
            const title = document.getElementById('modal-title');
            const form = document.getElementById('service-form');

            if (id) {
                const service = servicesData.find(s => s._id === id);
                if (service) {
                    title.textContent = 'Editar Servicio';
                    document.getElementById('service-id').value = service._id;
                    document.getElementById('service-name').value = service.name;
                    document.getElementById('service-price').value = service.price || 0;
                    document.getElementById('service-duration').value = service.duration || 30;
                    document.getElementById('service-category').value = service.category || 'general';
                    document.getElementById('service-active').checked = service.active !== false;
                }
            } else {
                title.textContent = 'Nuevo Servicio';
                form.reset();
                document.getElementById('service-id').value = '';
                document.getElementById('service-active').checked = true;
            }

            modal.classList.add('active');
        }

        function editService(id) {
            showServiceModal(id);
        }

        function closeServiceModal() {
            document.getElementById('service-modal').classList.remove('active');
        }

        async function handleServiceSubmit(e) {
            e.preventDefault();
            const id = document.getElementById('service-id').value;
            const url = id ? \`\${baseUrl}/data/services/\${id}\` : \`\${baseUrl}/data/services\`;
            const method = id ? 'PUT' : 'POST';

            const body = {
                name: document.getElementById('service-name').value,
                price: parseInt(document.getElementById('service-price').value) || 0,
                duration: parseInt(document.getElementById('service-duration').value) || 30,
                category: document.getElementById('service-category').value,
                active: document.getElementById('service-active').checked
            };

            try {
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (res.ok) {
                    const data = await res.json();
                    servicesData = data.services;
                    renderServices();
                    closeServiceModal();
                    initCharts();
                } else {
                    alert('Error al guardar el servicio');
                }
            } catch (err) {
                console.error(err);
                alert('Error de conexión');
            }
        }

        async function deleteService(id) {
            if (!confirm('¿Eliminar este servicio?')) return;

            try {
                const res = await fetch(\`\${baseUrl}/data/services/\${id}\`, { method: 'DELETE' });
                if (res.ok) {
                    const data = await res.json();
                    servicesData = data.services;
                    renderServices();
                    initCharts();
                }
            } catch (err) {
                console.error(err);
            }
        }

        // === CHARTS ===
        let revenueChart = null;
        let servicesChart = null;

        function initCharts() {
            initRevenueChart();
            initServicesChart();
        }

        function initRevenueChart() {
            const ctx = document.getElementById('revenueChart');
            if (!ctx) return;
            if (revenueChart) revenueChart.destroy();

            const last7Days = [];
            const labels = [];
            for (let i = 6; i >= 0; i--) {
                const date = moment().subtract(i, 'days');
                labels.push(date.format('ddd'));
                const apts = appointmentsData.filter(a =>
                    moment(a.dateTime).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
                );
                last7Days.push(apts.reduce((sum, a) => sum + (a.totalAmount || 500), 0));
            }

            revenueChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Ingresos',
                        data: last7Days,
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#8b8b9e' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#8b8b9e' }
                        }
                    }
                }
            });
        }

        function initServicesChart() {
            const ctx = document.getElementById('servicesChart');
            if (!ctx) return;
            if (servicesChart) servicesChart.destroy();

            const categories = {};
            servicesData.forEach(s => {
                const cat = s.category || 'general';
                categories[cat] = (categories[cat] || 0) + 1;
            });

            servicesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categories),
                    datasets: [{
                        data: Object.values(categories),
                        backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#8b8b9e', padding: 16 }
                        }
                    }
                }
            });
        }

        // === BOT ACTIVATION ===
        async function activateBot() {
            if (!confirm('¿Activar el bot de WhatsApp?')) return;

            try {
                const res = await fetch('/api/twilio/activate-bot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();
                if (data.success) {
                    alert('¡Bot activado con éxito!');
                    window.location.reload();
                } else {
                    throw new Error(data.error || 'Error al activar');
                }
            } catch (err) {
                alert('Error: ' + err.message);
            }
        }
    </script>
</body>
</html>
        `);
    } catch (error) {
        console.error('Error en dashboard pro:', error);
        res.status(500).send('Error cargando dashboard profesional');
    }
});

module.exports = router;
