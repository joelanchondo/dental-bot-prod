/**
 * 📅 GOOGLE CALENDAR SERVICE
 * Integración con Google Calendar para sincronización de citas
 */

const { google } = require('googleapis');
const Business = require('../models/Business');
const User = require('../models/User');

// Configuración OAuth2
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/callback'
);

// Scopes necesarios
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
];

/**
 * Generar URL de autorización
 * @param {string} businessId - ID del negocio para state
 */
function getAuthUrl(businessId) {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        state: businessId, // Para identificar el negocio al regresar
        prompt: 'consent' // Forzar refresh token
    });
}

/**
 * Procesar callback de OAuth y guardar tokens
 * @param {string} code - Código de autorización
 * @param {string} businessId - ID del negocio
 */
async function handleCallback(code, businessId) {
    try {
        const { tokens } = await oauth2Client.getToken(code);

        // Guardar tokens en el negocio
        await Business.findByIdAndUpdate(businessId, {
            'googleCalendar.tokens': tokens,
            'googleCalendar.connected': true,
            'googleCalendar.connectedAt': new Date()
        });

        console.log(`✅ Google Calendar conectado para negocio ${businessId}`);

        return { success: true, tokens };
    } catch (error) {
        console.error('❌ Error en callback OAuth:', error);
        throw error;
    }
}

/**
 * Obtener cliente de Calendar autenticado para un negocio
 * @param {string} businessId - ID del negocio
 */
async function getCalendarClient(businessId) {
    try {
        const business = await Business.findById(businessId);

        if (!business?.googleCalendar?.tokens) {
            throw new Error('Negocio no tiene Google Calendar conectado');
        }

        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        auth.setCredentials(business.googleCalendar.tokens);

        // Verificar si el token expiró y refrescar
        if (business.googleCalendar.tokens.expiry_date < Date.now()) {
            const { credentials } = await auth.refreshAccessToken();

            // Actualizar tokens en DB
            await Business.findByIdAndUpdate(businessId, {
                'googleCalendar.tokens': credentials
            });

            auth.setCredentials(credentials);
        }

        return google.calendar({ version: 'v3', auth });
    } catch (error) {
        console.error('❌ Error obteniendo cliente Calendar:', error);
        throw error;
    }
}

/**
 * Crear evento en Google Calendar
 * @param {string} businessId - ID del negocio
 * @param {object} appointment - Datos de la cita
 */
async function createEvent(businessId, appointment) {
    try {
        const calendar = await getCalendarClient(businessId);
        const business = await Business.findById(businessId);

        const startTime = new Date(appointment.dateTime);
        const endTime = new Date(startTime.getTime() + (appointment.duration || 60) * 60000);

        const event = {
            summary: `${appointment.service || 'Cita'} - ${appointment.clientName || 'Cliente'}`,
            description: `
📱 Teléfono: ${appointment.clientPhone || 'No proporcionado'}
💇 Servicio: ${appointment.service || 'Por confirmar'}
📝 Notas: ${appointment.notes || 'Sin notas'}

Agendado vía ${business.businessName} Bot
      `.trim(),
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'America/Mexico_City'
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'America/Mexico_City'
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 60 },
                    { method: 'popup', minutes: 15 }
                ]
            },
            colorId: '9' // Azul
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });

        console.log(`📅 Evento creado en Calendar: ${response.data.id}`);

        return {
            success: true,
            eventId: response.data.id,
            htmlLink: response.data.htmlLink
        };
    } catch (error) {
        console.error('❌ Error creando evento:', error);
        throw error;
    }
}

/**
 * Actualizar evento existente
 * @param {string} businessId - ID del negocio
 * @param {string} eventId - ID del evento en Google Calendar
 * @param {object} updates - Datos a actualizar
 */
async function updateEvent(businessId, eventId, updates) {
    try {
        const calendar = await getCalendarClient(businessId);

        const eventUpdates = {};

        if (updates.dateTime) {
            const startTime = new Date(updates.dateTime);
            const endTime = new Date(startTime.getTime() + (updates.duration || 60) * 60000);

            eventUpdates.start = {
                dateTime: startTime.toISOString(),
                timeZone: 'America/Mexico_City'
            };
            eventUpdates.end = {
                dateTime: endTime.toISOString(),
                timeZone: 'America/Mexico_City'
            };
        }

        if (updates.service || updates.clientName) {
            eventUpdates.summary = `${updates.service || ''} - ${updates.clientName || ''}`;
        }

        const response = await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            resource: eventUpdates
        });

        console.log(`📅 Evento actualizado: ${eventId}`);

        return { success: true, event: response.data };
    } catch (error) {
        console.error('❌ Error actualizando evento:', error);
        throw error;
    }
}

/**
 * Eliminar evento (cancelar cita)
 * @param {string} businessId - ID del negocio
 * @param {string} eventId - ID del evento
 */
async function deleteEvent(businessId, eventId) {
    try {
        const calendar = await getCalendarClient(businessId);

        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId
        });

        console.log(`🗑️ Evento eliminado: ${eventId}`);

        return { success: true };
    } catch (error) {
        console.error('❌ Error eliminando evento:', error);
        throw error;
    }
}

/**
 * Obtener eventos del día
 * @param {string} businessId - ID del negocio
 * @param {Date} date - Fecha a consultar
 */
async function getEventsForDay(businessId, date = new Date()) {
    try {
        const calendar = await getCalendarClient(businessId);

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
        });

        return {
            success: true,
            events: response.data.items || [],
            count: response.data.items?.length || 0
        };
    } catch (error) {
        console.error('❌ Error obteniendo eventos:', error);
        throw error;
    }
}

/**
 * Verificar disponibilidad en un horario
 * @param {string} businessId - ID del negocio
 * @param {Date} startTime - Hora de inicio
 * @param {number} durationMinutes - Duración en minutos
 */
async function checkAvailability(businessId, startTime, durationMinutes = 60) {
    try {
        const calendar = await getCalendarClient(businessId);

        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

        const response = await calendar.freebusy.query({
            resource: {
                timeMin: startTime.toISOString(),
                timeMax: endTime.toISOString(),
                items: [{ id: 'primary' }]
            }
        });

        const busy = response.data.calendars.primary.busy || [];
        const isAvailable = busy.length === 0;

        return {
            available: isAvailable,
            conflicts: busy
        };
    } catch (error) {
        console.error('❌ Error verificando disponibilidad:', error);
        throw error;
    }
}

/**
 * Desconectar Google Calendar
 * @param {string} businessId - ID del negocio
 */
async function disconnect(businessId) {
    try {
        await Business.findByIdAndUpdate(businessId, {
            $unset: { 'googleCalendar.tokens': 1 },
            'googleCalendar.connected': false,
            'googleCalendar.disconnectedAt': new Date()
        });

        console.log(`🔌 Google Calendar desconectado para ${businessId}`);

        return { success: true };
    } catch (error) {
        console.error('❌ Error desconectando:', error);
        throw error;
    }
}

/**
 * Verificar si un negocio tiene Calendar conectado
 */
async function isConnected(businessId) {
    try {
        const business = await Business.findById(businessId);
        return business?.googleCalendar?.connected && !!business?.googleCalendar?.tokens;
    } catch (error) {
        return false;
    }
}

module.exports = {
    getAuthUrl,
    handleCallback,
    getCalendarClient,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDay,
    checkAvailability,
    disconnect,
    isConnected,
    SCOPES
};
