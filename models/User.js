const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // DATOS DE AUTENTICACIÓN
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },

    // DATOS PERSONALES
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },

    // ROL Y PERMISOS
    role: {
        type: String,
        enum: ['owner', 'admin', 'superadmin'],
        default: 'owner'
    },

    // RELACIÓN CON NEGOCIO
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business'
    },

    // PLAN Y SUSCRIPCIÓN
    subscription: {
        plan: {
            type: String,
            enum: ['basico', 'pro', 'ultra', 'free-trial'],
            default: 'free-trial'
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired', 'pending'],
            default: 'pending'
        },
        startDate: Date,
        endDate: Date,
        mercadopagoSubscriptionId: String,
        lastPaymentDate: Date,
        nextPaymentDate: Date
    },

    // ESTADO DE LA CUENTA
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationExpires: Date,

    // RECUPERACIÓN DE CONTRASEÑA
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // ONBOARDING
    onboardingStep: {
        type: Number,
        default: 0
    },
    onboardingCompleted: {
        type: Boolean,
        default: false
    },

    // PREFERENCIAS
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            whatsapp: { type: Boolean, default: true }
        },
        language: { type: String, default: 'es' },
        timezone: { type: String, default: 'America/Mexico_City' }
    },

    // ACTIVIDAD
    lastLogin: Date,
    loginCount: { type: Number, default: 0 }

}, { timestamps: true });

// 🔐 MIDDLEWARE - Hash password antes de guardar
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 🔐 MÉTODO - Comparar contraseña
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// 🔐 MÉTODO - Generar token de verificación
userSchema.methods.generateVerificationToken = function () {
    this.verificationToken = require('crypto').randomBytes(32).toString('hex');
    this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    return this.verificationToken;
};

// 🔐 MÉTODO - Generar token de reset
userSchema.methods.generateResetToken = function () {
    this.resetPasswordToken = require('crypto').randomBytes(32).toString('hex');
    this.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora
    return this.resetPasswordToken;
};

// 🔐 MÉTODO - Actualizar último login
userSchema.methods.updateLastLogin = async function () {
    this.lastLogin = new Date();
    this.loginCount += 1;
    return await this.save();
};

// 📊 VIRTUAL - Días restantes de suscripción
userSchema.virtual('daysRemaining').get(function () {
    if (!this.subscription.endDate) return 0;
    const now = new Date();
    const diff = this.subscription.endDate - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// 📊 VIRTUAL - Suscripción activa
userSchema.virtual('hasActiveSubscription').get(function () {
    return this.subscription.status === 'active' &&
        this.subscription.endDate > new Date();
});

// INDEX para búsquedas rápidas (email ya indexado por unique:true)
userSchema.index({ businessId: 1 });
userSchema.index({ 'subscription.status': 1 });

module.exports = mongoose.model('User', userSchema);
