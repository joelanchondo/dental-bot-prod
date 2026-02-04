/**
 * 📅 GOOGLE CALENDAR ROUTES
 * Rutas para integración con Google Calendar
 */

const express = require('express');
const router = express.Router();
const calendarService = require('../services/googleCalendarService');
const { authenticateToken, requirePlan } = require('../middleware/auth');

/**
 * GET /api/calendar/auth-url
 * Obtener URL de autorización de Google
 */
router.get('/auth-url', authenticateToken, requirePlan('pro', 'ultra'), async (req, res) => {
    try {
        if (!req.user.businessId) {
            return res.status(400).json({
                success: false,
                error: 'Usuario sin negocio asociado'
            });
        }

        const authUrl = calendarService.getAuthUrl(req.user.businessId.toString());
        res.json({ success: true, authUrl });
    } catch (error) {
        console.error('Error generando auth URL:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/calendar/callback
 * Callback de OAuth2 de Google
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state: businessId, error } = req.query;

        if (error) {
            return res.redirect(`/dashboard?calendar_error=${error}`);
        }

        if (!code || !businessId) {
            return res.redirect('/dashboard?calendar_error=missing_params');
        }

        await calendarService.handleCallback(code, businessId);

        res.redirect('/dashboard?calendar_connected=true');
    } catch (error) {
        console.error('Error en callback:', error);
        res.redirect(`/dashboard?calendar_error=${encodeURIComponent(error.message)}`);
    }
});

/**
 * GET /api/calendar/status
 * Verificar estado de conexión
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        if (!req.user.businessId) {
            return res.json({ connected: false, reason: 'no_business' });
        }

        const connected = await calendarService.isConnected(req.user.businessId);
        res.json({ success: true, connected });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/calendar/events
 * Obtener eventos del día
 */
router.get('/events', authenticateToken, requirePlan('pro', 'ultra'), async (req, res) => {
    try {
        const date = req.query.date ? new Date(req.query.date) : new Date();
        const events = await calendarService.getEventsForDay(req.user.businessId, date);
        res.json(events);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/calendar/events
 * Crear evento en calendario
 */
router.post('/events', authenticateToken, requirePlan('pro', 'ultra'), async (req, res) => {
    try {
        const result = await calendarService.createEvent(req.user.businessId, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/calendar/events/:eventId
 * Actualizar evento
 */
router.patch('/events/:eventId', authenticateToken, requirePlan('pro', 'ultra'), async (req, res) => {
    try {
        const result = await calendarService.updateEvent(
            req.user.businessId,
            req.params.eventId,
            req.body
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/calendar/events/:eventId
 * Eliminar evento
 */
router.delete('/events/:eventId', authenticateToken, requirePlan('pro', 'ultra'), async (req, res) => {
    try {
        const result = await calendarService.deleteEvent(
            req.user.businessId,
            req.params.eventId
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/calendar/availability
 * Verificar disponibilidad
 */
router.get('/availability', authenticateToken, requirePlan('pro', 'ultra'), async (req, res) => {
    try {
        const { dateTime, duration = 60 } = req.query;

        if (!dateTime) {
            return res.status(400).json({
                success: false,
                error: 'dateTime requerido'
            });
        }

        const result = await calendarService.checkAvailability(
            req.user.businessId,
            new Date(dateTime),
            parseInt(duration)
        );
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/calendar/disconnect
 * Desconectar Google Calendar
 */
router.post('/disconnect', authenticateToken, async (req, res) => {
    try {
        const result = await calendarService.disconnect(req.user.businessId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
