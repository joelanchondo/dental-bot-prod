const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';
const JWT_EXPIRES_IN = '7d';

// 🔐 MIDDLEWARE - Verificar token JWT
const authenticateToken = async (req, res, next) => {
    try {
        // Obtener token del header o cookie
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                error: 'Acceso denegado',
                message: 'Token no proporcionado'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Buscar usuario
        const user = await User.findById(decoded.userId).populate('businessId');

        if (!user) {
            return res.status(401).json({
                error: 'Acceso denegado',
                message: 'Usuario no encontrado'
            });
        }

        // Agregar usuario al request
        req.user = user;
        req.userId = user._id;
        req.businessId = user.businessId?._id;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Sesión expirada',
                message: 'Por favor inicia sesión nuevamente'
            });
        }

        return res.status(403).json({
            error: 'Token inválido',
            message: 'No se pudo verificar la autenticación'
        });
    }
};

// 🔐 MIDDLEWARE - Verificar rol específico
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'No autenticado'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'No tienes permisos para esta acción'
            });
        }

        next();
    };
};

// 🔐 MIDDLEWARE - Verificar suscripción activa
const requireActiveSubscription = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    const hasActive = req.user.subscription.status === 'active' &&
        req.user.subscription.endDate > new Date();

    if (!hasActive && req.user.subscription.plan !== 'free-trial') {
        return res.status(403).json({
            error: 'Suscripción requerida',
            message: 'Tu suscripción ha expirado. Por favor renueva tu plan.',
            redirectTo: '/planes'
        });
    }

    next();
};

// 🔐 MIDDLEWARE - Verificar plan mínimo
const requirePlan = (...allowedPlans) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const userPlan = req.user.subscription.plan;

        if (!allowedPlans.includes(userPlan)) {
            return res.status(403).json({
                error: 'Plan insuficiente',
                message: `Esta función requiere uno de estos planes: ${allowedPlans.join(', ')}`,
                currentPlan: userPlan,
                requiredPlans: allowedPlans,
                redirectTo: '/upgrade'
            });
        }

        next();
    };
};

// 🔐 MIDDLEWARE - Verificar propiedad del negocio
const requireBusinessOwnership = async (req, res, next) => {
    const businessId = req.params.businessId || req.params.identifier || req.body.businessId;

    if (!businessId) {
        return res.status(400).json({ error: 'ID de negocio requerido' });
    }

    // Superadmin puede acceder a todo
    if (req.user.role === 'superadmin') {
        return next();
    }

    // Verificar que el usuario sea dueño del negocio
    if (req.user.businessId?.toString() !== businessId.toString()) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: 'No tienes permisos para acceder a este negocio'
        });
    }

    next();
};

// 🔧 HELPER - Generar token JWT
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// 🔧 HELPER - Configurar cookie
const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });
};

// 🔐 MIDDLEWARE - Autenticación opcional (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : req.cookies?.token;

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId).populate('businessId');
            if (user) {
                req.user = user;
                req.userId = user._id;
                req.businessId = user.businessId?._id;
            }
        }
    } catch (error) {
        // Ignorar errores - autenticación es opcional
    }

    next();
};

module.exports = {
    authenticateToken,
    requireRole,
    requireActiveSubscription,
    requirePlan,
    requireBusinessOwnership,
    generateToken,
    setTokenCookie,
    optionalAuth,
    JWT_SECRET
};
