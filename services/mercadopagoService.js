/**
 * 💳 MERCADOPAGO PAYMENT SERVICE
 * Servicio de pagos para suscripciones SaaS
 * Mercado Libre - Optimizado para México y LatAm
 */

const { MercadoPagoConfig, Preference, Payment, PreApproval } = require('mercadopago');
const User = require('../models/User');
const Business = require('../models/Business');

// Configuración de MercadoPago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN'
});

// Instancias de APIs
const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);
const subscriptionClient = new PreApproval(client);

// Planes de suscripción
const PLANS = {
    basico: {
        id: 'basico',
        name: 'Plan Básico',
        price: 299,
        currency: 'MXN',
        description: 'Respuestas automáticas 24/7, Menú de servicios',
        interval: 'month',
        features: ['Respuestas 24/7', 'Menú de servicios', 'Info de contacto']
    },
    pro: {
        id: 'pro',
        name: 'Plan Pro',
        price: 599,
        currency: 'MXN',
        description: 'Todo de Básico + Agenda, Dashboard, Recordatorios',
        interval: 'month',
        features: ['Todo de Básico', 'Agenda de citas', 'Dashboard Pro', 'Recordatorios']
    },
    ultra: {
        id: 'ultra',
        name: 'Plan Ultra',
        price: 999,
        currency: 'MXN',
        description: 'Todo de Pro + IA personalizada, Marketing, Seguimientos',
        interval: 'month',
        features: ['Todo de Pro', 'IA personalizada', 'Marketing auto', 'Seguimientos']
    }
};

/**
 * Crear preferencia de pago (checkout único)
 */
async function createPaymentPreference(userId, planId, metadata = {}) {
    try {
        const user = await User.findById(userId).populate('businessId');
        const plan = PLANS[planId];

        if (!plan) {
            throw new Error('Plan no válido');
        }

        const preference = await preferenceClient.create({
            body: {
                items: [{
                    id: plan.id,
                    title: plan.name,
                    description: plan.description,
                    quantity: 1,
                    currency_id: plan.currency,
                    unit_price: plan.price
                }],
                payer: {
                    email: user.email,
                    name: user.name
                },
                back_urls: {
                    success: `${process.env.BASE_URL}/payment/success`,
                    failure: `${process.env.BASE_URL}/payment/failure`,
                    pending: `${process.env.BASE_URL}/payment/pending`
                },
                auto_return: 'approved',
                external_reference: JSON.stringify({
                    userId: userId.toString(),
                    planId: planId,
                    businessId: user.businessId?._id?.toString(),
                    ...metadata
                }),
                notification_url: `${process.env.BASE_URL}/api/mercadopago/webhook`,
                statement_descriptor: 'BOTSAAS'
            }
        });

        console.log('✅ Preferencia de pago creada:', preference.id);

        return {
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point
        };
    } catch (error) {
        console.error('❌ Error creando preferencia:', error);
        throw error;
    }
}

/**
 * Crear suscripción recurrente (preapproval)
 */
async function createSubscription(userId, planId) {
    try {
        const user = await User.findById(userId).populate('businessId');
        const plan = PLANS[planId];

        if (!plan) {
            throw new Error('Plan no válido');
        }

        const subscription = await subscriptionClient.create({
            body: {
                reason: `${plan.name} - BotSaaS`,
                external_reference: JSON.stringify({
                    userId: userId.toString(),
                    planId: planId,
                    businessId: user.businessId?._id?.toString()
                }),
                payer_email: user.email,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: plan.price,
                    currency_id: plan.currency
                },
                back_url: `${process.env.BASE_URL}/subscription/callback`,
                notification_url: `${process.env.BASE_URL}/api/mercadopago/webhook`
            }
        });

        console.log('✅ Suscripción creada:', subscription.id);

        // Actualizar usuario con ID de suscripción
        await User.findByIdAndUpdate(userId, {
            'subscription.mercadopagoSubscriptionId': subscription.id,
            'subscription.plan': planId,
            'subscription.status': 'pending'
        });

        return {
            subscriptionId: subscription.id,
            initPoint: subscription.init_point,
            sandboxInitPoint: subscription.sandbox_init_point
        };
    } catch (error) {
        console.error('❌ Error creando suscripción:', error);
        throw error;
    }
}

/**
 * Procesar webhook de MercadoPago
 */
async function handleWebhook(type, data) {
    console.log('📩 Webhook recibido:', type, data);

    try {
        switch (type) {
            case 'payment':
                return await handlePaymentWebhook(data.id);

            case 'subscription_preapproval':
            case 'preapproval':
                return await handleSubscriptionWebhook(data.id);

            default:
                console.log('⚠️ Tipo de webhook no manejado:', type);
                return { handled: false };
        }
    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        throw error;
    }
}

/**
 * Procesar webhook de pago
 */
async function handlePaymentWebhook(paymentId) {
    try {
        const payment = await paymentClient.get({ id: paymentId });
        console.log('💰 Pago recibido:', payment.status, payment.status_detail);

        if (!payment.external_reference) {
            console.log('⚠️ Sin external_reference');
            return { handled: false };
        }

        const reference = JSON.parse(payment.external_reference);
        const { userId, planId, businessId } = reference;

        if (payment.status === 'approved') {
            // Pago aprobado - activar suscripción
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);

            await User.findByIdAndUpdate(userId, {
                'subscription.plan': planId,
                'subscription.status': 'active',
                'subscription.startDate': new Date(),
                'subscription.endDate': endDate,
                'subscription.lastPaymentDate': new Date()
            });

            // Actualizar plan del negocio
            if (businessId) {
                await Business.findByIdAndUpdate(businessId, {
                    plan: planId,
                    status: 'active'
                });

                // 🤖 AUTO-SETUP: Configurar bot automáticamente
                try {
                    const botSetupService = require('./botSetupService');
                    await botSetupService.onPaymentCompleted(userId, planId);
                    console.log('🤖 Bot configurado automáticamente tras pago');
                } catch (botError) {
                    console.error('⚠️ Error en auto-setup de bot:', botError.message);
                }
            }

            console.log('✅ Suscripción activada para usuario:', userId);
            return { handled: true, status: 'activated', userId, planId };
        }

        if (payment.status === 'rejected') {
            console.log('❌ Pago rechazado:', payment.status_detail);
            return { handled: true, status: 'rejected', reason: payment.status_detail };
        }

        return { handled: true, status: payment.status };
    } catch (error) {
        console.error('❌ Error procesando pago webhook:', error);
        throw error;
    }
}

/**
 * Procesar webhook de suscripción
 */
async function handleSubscriptionWebhook(preapprovalId) {
    try {
        const subscription = await subscriptionClient.get({ id: preapprovalId });
        console.log('📋 Suscripción actualizada:', subscription.status);

        if (!subscription.external_reference) {
            return { handled: false };
        }

        const reference = JSON.parse(subscription.external_reference);
        const { userId, planId, businessId } = reference;

        let status = 'pending';
        let endDate = null;

        switch (subscription.status) {
            case 'authorized':
            case 'active':
                status = 'active';
                endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 1);
                break;
            case 'paused':
                status = 'paused';
                break;
            case 'cancelled':
                status = 'cancelled';
                break;
        }

        await User.findByIdAndUpdate(userId, {
            'subscription.status': status,
            'subscription.mercadopagoSubscriptionId': preapprovalId,
            ...(endDate && { 'subscription.endDate': endDate })
        });

        if (businessId && status === 'active') {
            await Business.findByIdAndUpdate(businessId, {
                plan: planId,
                status: 'active'
            });
        }

        console.log('✅ Suscripción actualizada:', status);
        return { handled: true, status };
    } catch (error) {
        console.error('❌ Error procesando suscripción webhook:', error);
        throw error;
    }
}

/**
 * Cancelar suscripción
 */
async function cancelSubscription(userId) {
    try {
        const user = await User.findById(userId);

        if (!user?.subscription?.mercadopagoSubscriptionId) {
            throw new Error('No hay suscripción activa');
        }

        await subscriptionClient.update({
            id: user.subscription.mercadopagoSubscriptionId,
            body: { status: 'cancelled' }
        });

        await User.findByIdAndUpdate(userId, {
            'subscription.status': 'cancelled'
        });

        console.log('✅ Suscripción cancelada para usuario:', userId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error cancelando suscripción:', error);
        throw error;
    }
}

/**
 * Obtener detalles de pago
 */
async function getPayment(paymentId) {
    try {
        return await paymentClient.get({ id: paymentId });
    } catch (error) {
        console.error('❌ Error obteniendo pago:', error);
        throw error;
    }
}

/**
 * Verificar estado de suscripción
 */
async function checkSubscriptionStatus(userId) {
    try {
        const user = await User.findById(userId);

        if (!user?.subscription?.mercadopagoSubscriptionId) {
            return { active: false, reason: 'no_subscription' };
        }

        const subscription = await subscriptionClient.get({
            id: user.subscription.mercadopagoSubscriptionId
        });

        const isActive = ['authorized', 'active'].includes(subscription.status);

        return {
            active: isActive,
            status: subscription.status,
            plan: user.subscription.plan,
            endDate: user.subscription.endDate
        };
    } catch (error) {
        console.error('❌ Error verificando suscripción:', error);
        return { active: false, reason: 'error', error: error.message };
    }
}

module.exports = {
    PLANS,
    createPaymentPreference,
    createSubscription,
    handleWebhook,
    cancelSubscription,
    getPayment,
    checkSubscriptionStatus
};
