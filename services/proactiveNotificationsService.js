/**
 * 📣 PROACTIVE NOTIFICATIONS SERVICE
 * Notificaciones proactivas al dueño y seguimientos post-servicio
 */

const Business = require('../models/Business');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { sendWhatsApp } = require('../config/twilio');
const optOutService = require('./optOutService');

// Intervalo de verificación para seguimientos
const FOLLOWUP_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hora

/**
 * Enviar notificación al dueño del negocio
 * @param {string} businessId - ID del negocio
 * @param {string} type - Tipo de notificación
 * @param {object} data - Datos de la notificación
 */
async function notifyOwner(businessId, type, data = {}) {
    try {
        const business = await Business.findById(businessId);
        if (!business) {
            throw new Error('Negocio no encontrado');
        }

        // Buscar al dueño del negocio
        const owner = await User.findOne({ businessId: businessId });
        if (!owner || !owner.phone) {
            console.log('⚠️ No se encontró dueño con teléfono para notificar');
            return { success: false, reason: 'no_owner_phone' };
        }

        // Construir mensaje según tipo
        const message = buildOwnerNotification(type, data, business);

        // Enviar WhatsApp al dueño
        await sendWhatsApp(business, owner.phone, message);

        console.log(`📣 Notificación enviada al dueño (${type}):`, owner.phone);

        return { success: true, type, sentTo: owner.phone };
    } catch (error) {
        console.error('❌ Error notificando al dueño:', error);
        throw error;
    }
}

/**
 * Construir mensaje de notificación para el dueño
 */
function buildOwnerNotification(type, data, business) {
    const messages = {
        new_appointment: `🗓️ *Nueva Cita Agendada*

Cliente: ${data.clientName || 'Sin nombre'}
Teléfono: ${data.clientPhone || 'No proporcionado'}
Servicio: ${data.service || 'Por confirmar'}
Fecha: ${data.dateTime ? new Date(data.dateTime).toLocaleString('es-MX') : 'Pendiente'}

${business.businessName}`,

        appointment_cancelled: `❌ *Cita Cancelada*

Cliente: ${data.clientName || 'Sin nombre'}
Servicio: ${data.service || ''}
Fecha original: ${data.dateTime ? new Date(data.dateTime).toLocaleString('es-MX') : ''}
Razón: ${data.reason || 'No especificada'}`,

        new_message: `💬 *Nuevo Mensaje*

De: ${data.clientPhone || 'Desconocido'}
${data.clientName ? `Cliente: ${data.clientName}` : ''}

"${data.message ? data.message.substring(0, 100) : ''}"...

Responde pronto para mantener la atención al cliente.`,

        daily_summary: `📊 *Resumen del Día*

📅 Citas de hoy: ${data.appointmentsToday || 0}
✅ Completadas: ${data.completed || 0}
❌ Canceladas: ${data.cancelled || 0}
💰 Ingresos estimados: $${data.revenue || 0} MXN

¡Buen día en ${business.businessName}! 💪`,

        low_appointments: `⚠️ *Alerta: Pocas Citas*

Esta semana solo tienes ${data.count || 0} cita(s) agendada(s).

¿Quieres que enviemos promociones a clientes anteriores? Responde "SÍ" para activar.`,

        review_request: `⭐ *Nueva Reseña*

${data.clientName || 'Un cliente'} dejó una reseña:
${data.rating ? '⭐'.repeat(data.rating) : ''}
"${data.comment || 'Sin comentario'}"

${data.rating >= 4 ? '¡Excelente trabajo! 🎉' : 'Responde para mejorar la experiencia.'}`
    };

    return messages[type] || `📣 Notificación de ${business.businessName}`;
}

/**
 * Enviar seguimiento post-servicio a cliente
 * @param {string} appointmentId - ID de la cita
 */
async function sendFollowUp(appointmentId) {
    try {
        const appointment = await Appointment.findById(appointmentId).populate('businessId');

        if (!appointment || !appointment.businessId) {
            throw new Error('Cita no encontrada');
        }

        const business = appointment.businessId;

        // Verificar que plan incluye seguimientos
        if (!['ultra', 'free-trial'].includes(business.plan)) {
            console.log('⚠️ Plan no incluye seguimientos');
            return { success: false, reason: 'plan_not_supported' };
        }

        // Verificar opt-out
        const canSend = await optOutService.canReceiveMessages(
            business._id,
            appointment.clientPhone
        );

        if (!canSend) {
            console.log('📵 Cliente en opt-out, no se envía seguimiento');
            return { success: false, reason: 'opted_out' };
        }

        // Construir mensaje de seguimiento
        const message = buildFollowUpMessage(appointment, business);

        // Enviar
        await sendWhatsApp(business, appointment.clientPhone, message);

        // Marcar seguimiento como enviado
        appointment.followUp = {
            sent: true,
            sentAt: new Date()
        };
        await appointment.save();

        console.log(`✅ Seguimiento enviado a ${appointment.clientPhone}`);

        return { success: true };
    } catch (error) {
        console.error('❌ Error enviando seguimiento:', error);
        throw error;
    }
}

/**
 * Construir mensaje de seguimiento
 */
function buildFollowUpMessage(appointment, business) {
    return `👋 *¡Hola ${appointment.clientName || ''}!*

Gracias por visitarnos en ${business.businessName}. 

¿Qué te pareció tu ${appointment.service || 'servicio'}? Tu opinión nos ayuda a mejorar.

⭐ Responde con un número del 1 al 5 para calificarnos.

O si tienes algún comentario, ¡cuéntanos!

Próxima cita recomendada: ${getNextAppointmentSuggestion(appointment)}`;
}

/**
 * Sugerir próxima cita según servicio
 */
function getNextAppointmentSuggestion(appointment) {
    const suggestions = {
        dental: 'en 6 meses para revisión',
        nails: 'en 2-3 semanas para retoque',
        barbershop: 'en 3-4 semanas para mantenimiento',
        spa: 'cuando necesites un momento de relax',
        default: 'pronto para seguir atendiéndote'
    };

    const businessType = appointment.businessId?.businessType || 'default';
    return suggestions[businessType] || suggestions.default;
}

/**
 * Procesar citas completadas y programar seguimientos
 */
async function processCompletedAppointments() {
    try {
        const now = new Date();
        const followUpDelay = 24 * 60 * 60 * 1000; // 24 horas después
        const targetTime = new Date(now.getTime() - followUpDelay);

        // Buscar citas completadas hace 24h sin seguimiento
        const appointments = await Appointment.find({
            status: 'completed',
            dateTime: { $lte: targetTime },
            'followUp.sent': { $ne: true }
        }).populate('businessId').limit(50);

        console.log(`🔍 Encontradas ${appointments.length} citas para seguimiento`);

        for (const appointment of appointments) {
            try {
                await sendFollowUp(appointment._id);
            } catch (error) {
                console.error(`Error en seguimiento ${appointment._id}:`, error.message);
            }
        }

        return { processed: appointments.length };
    } catch (error) {
        console.error('❌ Error procesando seguimientos:', error);
        throw error;
    }
}

/**
 * Enviar resumen diario al dueño
 */
async function sendDailySummary(businessId) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await Appointment.find({
            businessId,
            dateTime: { $gte: today, $lt: tomorrow }
        });

        const stats = {
            appointmentsToday: appointments.length,
            completed: appointments.filter(a => a.status === 'completed').length,
            cancelled: appointments.filter(a => a.status === 'cancelled').length,
            revenue: appointments
                .filter(a => a.status === 'completed')
                .reduce((sum, a) => sum + (a.price || 0), 0)
        };

        await notifyOwner(businessId, 'daily_summary', stats);

        return stats;
    } catch (error) {
        console.error('❌ Error enviando resumen diario:', error);
        throw error;
    }
}

/**
 * Notificar nueva cita al dueño
 */
async function notifyNewAppointment(appointment) {
    try {
        await notifyOwner(appointment.businessId, 'new_appointment', {
            clientName: appointment.clientName,
            clientPhone: appointment.clientPhone,
            service: appointment.service,
            dateTime: appointment.dateTime
        });
    } catch (error) {
        console.error('❌ Error notificando nueva cita:', error);
    }
}

/**
 * Procesar respuesta de calificación
 */
async function processRatingResponse(appointmentId, rating, comment = '') {
    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            throw new Error('Cita no encontrada');
        }

        appointment.rating = {
            score: parseInt(rating),
            comment,
            ratedAt: new Date()
        };
        await appointment.save();

        // Notificar al dueño si es calificación baja
        if (parseInt(rating) <= 3) {
            await notifyOwner(appointment.businessId, 'review_request', {
                clientName: appointment.clientName,
                rating: parseInt(rating),
                comment
            });
        }

        console.log(`⭐ Calificación registrada: ${rating}/5 para ${appointmentId}`);

        return { success: true, rating };
    } catch (error) {
        console.error('❌ Error procesando calificación:', error);
        throw error;
    }
}

module.exports = {
    notifyOwner,
    sendFollowUp,
    processCompletedAppointments,
    sendDailySummary,
    notifyNewAppointment,
    processRatingResponse,
    FOLLOWUP_CHECK_INTERVAL
};
