const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Business = require('../models/Business');
const {
    generateToken,
    setTokenCookie,
    authenticateToken
} = require('../middleware/auth');

const serviceCatalogs = require('../config/service-catalogs');

// ==========================================
// 📝 Helper: Generar Servicios por Defecto
// ==========================================
function generateBusinessServices(businessType, plan = "basic") {
    const catalog = serviceCatalogs[businessType];

    if (!catalog) {
        return [{
            name: "Servicio Principal",
            description: "Servicio principal del negocio",
            duration: 60,
            price: 0,
            basePrice: 0,
            active: true,
            category: "general",
            customService: false,
            requiresPayment: false,
            commission: plan === "premium" ? 10 : 0,
            timesBooked: 0,
            revenue: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        }];
    }

    return catalog.map(service => ({
        name: service.name,
        description: `Servicio de ${service.category}`,
        duration: service.duration,
        price: 0,                    // Gratis inicial - editable en dashboard
        basePrice: service.basePrice, // Precio sugerido del catálogo
        active: true,
        category: service.category,
        customService: false,        // Del catálogo
        requiresPayment: false,      // Pago en consultorio por defecto
        commission: plan === "premium" ? 10 : 0,
        timesBooked: 0,
        revenue: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    }));
}

// ==========================================
// 📝 REGISTRO DE USUARIO
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const {
            email,
            password,
            name,
            phone,
            businessName,
            businessType,
            plan = 'free-trial'
        } = req.body;

        // Validaciones básicas
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Campos requeridos',
                message: 'Email, contraseña y nombre son obligatorios'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Contraseña muy corta',
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si email ya existe
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                error: 'Email en uso',
                message: 'Este email ya está registrado'
            });
        }

        // Crear el negocio primero si se proporciona businessName
        let business = null;
        if (businessName && businessType) {
            business = new Business({
                businessName,
                businessType,
                contactEmail: email,
                whatsappBusiness: phone || '',
                plan: plan,
                status: 'active',
                planExpiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días de prueba
                services: generateBusinessServices(businessType, plan)
            });
            await business.save();
            console.log('🏢 Negocio creado:', business._id);
        }

        // Calcular fecha de expiración según plan
        const now = new Date();
        let endDate = new Date(now);

        switch (plan) {
            case 'free-trial':
                endDate.setDate(endDate.getDate() + 14); // 14 días de prueba
                break;
            case 'basico':
            case 'pro':
            case 'ultra':
                endDate.setMonth(endDate.getMonth() + 1); // 1 mes
                break;
        }

        // Crear usuario
        const user = new User({
            email: email.toLowerCase(),
            password,
            name,
            phone,
            businessId: business?._id,
            subscription: {
                plan,
                status: plan === 'free-trial' ? 'active' : 'pending',
                startDate: now,
                endDate: endDate
            }
        });

        // Generar token de verificación
        user.generateVerificationToken();

        await user.save();
        console.log('👤 Usuario creado:', user._id);

        // Generar JWT
        const token = generateToken(user._id);
        setTokenCookie(res, token);

        // TODO: Enviar email de verificación

        res.status(201).json({
            success: true,
            message: 'Cuenta creada exitosamente',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                plan: user.subscription.plan,
                businessId: business?._id
            },
            token,
            redirectTo: business ? `/dashboard-pro/${business._id}` : '/crear-negocio'
        });

    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            error: 'Error de servidor',
            message: 'No se pudo crear la cuenta'
        });
    }
});

// ==========================================
// 🔐 LOGIN
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Campos requeridos',
                message: 'Email y contraseña son obligatorios'
            });
        }

        // Buscar usuario
        const user = await User.findOne({ email: email.toLowerCase() }).populate('businessId');

        if (!user) {
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }

        // Verificar contraseña
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }

        // Actualizar último login
        await user.updateLastLogin();

        // Generar token
        const token = generateToken(user._id);
        setTokenCookie(res, token);

        // Determinar redirección
        let redirectTo = '/dashboard';
        if (user.role === 'superadmin') {
            redirectTo = '/admin';
        } else if (user.businessId) {
            redirectTo = `/dashboard-pro/${user.businessId.slug || user.businessId._id}`;
        } else if (!user.onboardingCompleted) {
            redirectTo = '/auth/register'; // ← Redirige a la página de registro correcta
        }

        res.json({
            success: true,
            message: 'Login exitoso',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.subscription.plan,
                businessId: user.businessId?._id,
                businessName: user.businessId?.businessName
            },
            token,
            redirectTo
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            error: 'Error de servidor',
            message: 'No se pudo iniciar sesión'
        });
    }
});

// ==========================================
// 🚪 LOGOUT
// ==========================================
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Sesión cerrada',
        redirectTo: '/login'
    });
});

// ==========================================
// 👤 OBTENER PERFIL ACTUAL
// ==========================================
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('businessId')
            .select('-password -verificationToken -resetPasswordToken');

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                subscription: user.subscription,
                business: user.businessId,
                onboardingCompleted: user.onboardingCompleted,
                isVerified: user.isVerified,
                preferences: user.preferences
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// ==========================================
// 🔑 OLVIDÉ MI CONTRASEÑA
// ==========================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email requerido'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Por seguridad, no revelar si el email existe
            return res.json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
            });
        }

        // Generar token de reset
        const resetToken = user.generateResetToken();
        await user.save();

        // TODO: Enviar email con link de reset
        const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;
        console.log('🔗 Reset URL:', resetUrl);

        res.json({
            success: true,
            message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
            // Solo en desarrollo:
            ...(process.env.NODE_ENV !== 'production' && { resetUrl })
        });

    } catch (error) {
        console.error('❌ Error en forgot-password:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// ==========================================
// 🔑 RESTABLECER CONTRASEÑA
// ==========================================
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                error: 'Contraseña inválida',
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                error: 'Token inválido',
                message: 'El enlace ha expirado o es inválido'
            });
        }

        // Actualizar contraseña
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente',
            redirectTo: '/login'
        });

    } catch (error) {
        console.error('❌ Error en reset-password:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// ==========================================
// ✅ VERIFICAR EMAIL
// ==========================================
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            verificationToken: token,
            verificationExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                error: 'Token inválido',
                message: 'El enlace de verificación ha expirado o es inválido'
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verificado exitosamente',
            redirectTo: '/dashboard'
        });

    } catch (error) {
        console.error('❌ Error en verificación:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// ==========================================
// 🔄 CAMBIAR CONTRASEÑA (autenticado)
// ==========================================
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Campos requeridos'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        const user = await User.findById(req.userId);

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Contraseña actual incorrecta'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

module.exports = router;
