/**
 * 🔔 REMINDER SERVICE
 * Servicio de recordatorios automáticos para citas
 * Envía recordatorios 24h y 1h antes de cada cita
 */

const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const { sendWhatsApp } = require('../config/twilio');

// Intervalo de verificación (en milisegundos)
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

// Estado del servicio
let isRunning = false;
let intervalId = null;

/**
 * Iniciar servicio de recordatorios
 */
function startReminderService() {
    if (isRunning) {
        console.log('⚠️ Servicio de recordatorios ya está corriendo');
        return;
    }

    console.log('🔔 Iniciando servicio de recordatorios...');
    isRunning = true;

    // Ejecutar inmediatamente y luego cada intervalo
    checkAndSendReminders();
    intervalId = setInterval(checkAndSendReminders, CHECK_INTERVAL);

    console.log(`✅ Servicio de recordatorios activo (revisando cada ${CHECK_INTERVAL / 60000} minutos)`);
}

/**
 * Detener servicio de recordatorios
 */
function stopReminderService() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    isRunning = false;
    console.log('🛑 Servicio de recordatorios detenido');
}

/**
 * Verificar y enviar recordatorios pendientes
 */
async function checkAndSendReminders() {
    try {
        const now = new Date();
        console.log(`🔍 Verificando recordatorios: ${now.toISOString()}`);

        // Buscar citas para recordatorio de 24 horas
        await processReminders('24h', 24);

        // Buscar citas para recordatorio de 1 hora
        await processReminders('1h', 1);

    } catch (error) {
        console.error('❌ Error en verificación de recordatorios:', error);
    }
}

/**
 * Procesar recordatorios de un tipo específico
 * @param {string} reminderType - Tipo de recordatorio ('24h' o '1h')
 * @param {number} hoursAhead - Horas antes de la cita
 */
async function processReminders(reminderType, hoursAhead) {
    try {
        const now = new Date();
        const targetTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));

        // Rango de búsqueda (±15 minutos)
        const rangeStart = new Date(targetTime.getTime() - (15 * 60 * 1000));
        const rangeEnd = new Date(targetTime.getTime() + (15 * 60 * 1000));

        // Buscar citas que necesitan recordatorio
        const appointments = await Appointment.find({
            dateTime: { $gte: rangeStart, $lte: rangeEnd },
            status: { $in: ['confirmed', 'pending'] },
            [`reminders.${reminderType}`]: { $ne: true } // Que no se haya enviado aún
        }).populate('businessId');

        if (appointments.length === 0) {
            return;
        }

        console.log(`📋 Encontradas ${appointments.length} citas para recordatorio ${reminderType}`);

        for (const appointment of appointments) {
            try {
                await sendReminder(appointment, reminderType);
            } catch (error) {
                console.error(`❌ Error enviando recordatorio ${appointment._id}:`, error.message);
            }
        }

    } catch (error) {
        console.error(`❌ Error procesando recordatorios ${reminderType}:`, error);
    }
}

/**
 * Enviar recordatorio individual
 * @param {Object} appointment - Cita
 * @param {string} reminderType - Tipo ('24h' o '1h')
 */
async function sendReminder(appointment, reminderType) {
    try {
        const business = appointment.businessId;

        if (!business) {
            console.log(`⚠️ Cita ${appointment._id} sin negocio asociado`);
            return;
        }

        // Verificar que el plan permita recordatorios
        if (!['pro', 'ultra', 'free-trial'].includes(business.plan)) {
            console.log(`⚠️ Plan ${business.plan} no incluye recordatorios`);
            return;
        }

        // Verificar que hay teléfono del cliente
        if (!appointment.clientPhone) {
            console.log(`⚠️ Cita ${appointment._id} sin teléfono de cliente`);
            return;
        }

        // Formatear fecha
        const appointmentDate = new Date(appointment.dateTime);
        const formattedDate = appointmentDate.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        const formattedTime = appointmentDate.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Construir mensaje según tipo de recordatorio
        let message;
        if (reminderType === '24h') {
            message = `🔔 *Recordatorio de Cita*\n\n` +
                `Hola ${appointment.clientName || 'estimado cliente'},\n\n` +
                `Te recordamos que tienes una cita *mañana*:\n\n` +
                `📅 *Fecha:* ${formattedDate}\n` +
                `⏰ *Hora:* ${formattedTime}\n` +
                `🏥 *Lugar:* ${business.businessName}\n` +
                `💇 *Servicio:* ${appointment.service || 'Por confirmar'}\n\n` +
                `📍 ${business.address || ''}\n\n` +
                `¿Necesitas reagendar? Responde a este mensaje.`;
        } else {
            message = `⏰ *Tu cita es en 1 hora*\n\n` +
                `Hola ${appointment.clientName || ''},\n\n` +
                `Te esperamos en ${business.businessName} a las *${formattedTime}*.\n\n` +
                `💇 *Servicio:* ${appointment.service || ''}\n` +
                `📍 ${business.address || 'Dirección del negocio'}\n\n` +
                `¡Te esperamos! 😊`;
        }

        // Enviar WhatsApp
        await sendWhatsApp(business, appointment.clientPhone, message);

        // Marcar recordatorio como enviado
        if (!appointment.reminders) {
            appointment.reminders = {};
        }
        appointment.reminders[reminderType] = true;
        appointment.reminders[`${reminderType}SentAt`] = new Date();
        await appointment.save();

        console.log(`✅ Recordatorio ${reminderType} enviado a ${appointment.clientPhone}`);

    } catch (error) {
        console.error(`❌ Error enviando recordatorio:`, error);
        throw error;
    }
}

/**
 * Enviar recordatorio manual a una cita específica
 * @param {string} appointmentId - ID de la cita
 * @param {string} reminderType - Tipo de recordatorio
 */
async function sendManualReminder(appointmentId, reminderType = 'manual') {
    try {
        const appointment = await Appointment.findById(appointmentId).populate('businessId');

        if (!appointment) {
            throw new Error('Cita no encontrada');
        }

        await sendReminder(appointment, reminderType);

        return { success: true, message: 'Recordatorio enviado' };
    } catch (error) {
        console.error('❌ Error en recordatorio manual:', error);
        throw error;
    }
}

/**
 * Obtener estado del servicio
 */
function getServiceStatus() {
    return {
        isRunning,
        checkInterval: CHECK_INTERVAL,
        checkIntervalMinutes: CHECK_INTERVAL / 60000
    };
}

/**
 * Obtener estadísticas de recordatorios
 */
async function getReminderStats(businessId = null) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const query = {
            dateTime: { $gte: today, $lt: tomorrow }
        };

        if (businessId) {
            query.businessId = businessId;
        }

        const appointments = await Appointment.find(query);

        const stats = {
            totalToday: appointments.length,
            reminders24hSent: appointments.filter(a => a.reminders?.['24h']).length,
            reminders1hSent: appointments.filter(a => a.reminders?.['1h']).length,
            pending24h: appointments.filter(a => !a.reminders?.['24h']).length,
            pending1h: appointments.filter(a => !a.reminders?.['1h']).length
        };

        return stats;
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        throw error;
    }
}

module.exports = {
    startReminderService,
    stopReminderService,
    checkAndSendReminders,
    sendManualReminder,
    getServiceStatus,
    getReminderStats
};
