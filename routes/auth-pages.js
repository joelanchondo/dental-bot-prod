const express = require('express');
const router = express.Router();

// ==========================================
// 🎨 ESTILOS COMPARTIDOS
// ==========================================
const getBaseStyles = () => `
    :root {
        --dark-950: #030712;
        --dark-900: #0c1222;
        --dark-800: #111827;
        --dark-700: #1f2937;
        --dark-600: #374151;
        --dark-500: #4b5563;
        --dark-400: #6b7280;
        --dark-300: #9ca3af;
        --dark-200: #d1d5db;
        --dark-100: #e5e7eb;
        --accent-500: #f59e0b;
        --accent-400: #fbbf24;
        --accent-600: #d97706;
        --success-500: #10b981;
        --error-500: #ef4444;
        --error-400: #f87171;
    }

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: var(--dark-950);
        color: var(--dark-100);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow-x: hidden;
    }

    /* Background animation */
    .bg-gradient {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background:
            radial-gradient(ellipse at 20% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(245, 158, 11, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(17, 24, 39, 0.8) 0%, var(--dark-950) 70%);
        pointer-events: none;
        z-index: 0;
    }

    .grid-pattern {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
            linear-gradient(rgba(245, 158, 11, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 158, 11, 0.03) 1px, transparent 1px);
        background-size: 60px 60px;
        pointer-events: none;
        z-index: 0;
    }

    .auth-container {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 480px;
        padding: 20px;
    }

    .auth-container.wide {
        max-width: 560px;
    }

    /* Logo */
    .logo {
        text-align: center;
        margin-bottom: 32px;
    }

    .logo-icon {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, var(--accent-500), var(--accent-400));
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        font-size: 28px;
        box-shadow: 0 8px 32px rgba(245, 158, 11, 0.3);
    }

    .logo h1 {
        font-size: 28px;
        font-weight: 700;
        color: white;
    }

    .logo h1 span {
        background: linear-gradient(90deg, var(--accent-500), var(--accent-400));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .logo p {
        color: var(--dark-400);
        font-size: 14px;
        margin-top: 8px;
    }

    /* Card */
    .auth-card {
        background: rgba(17, 24, 39, 0.6);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 40px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .auth-card h2 {
        font-size: 24px;
        font-weight: 700;
        color: white;
        margin-bottom: 8px;
    }

    .auth-card .subtitle {
        color: var(--dark-400);
        font-size: 14px;
        margin-bottom: 32px;
    }

    /* Form Elements */
    .form-group {
        margin-bottom: 24px;
    }

    .form-group label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: var(--dark-200);
        margin-bottom: 8px;
    }

    .form-group label .required {
        color: var(--accent-500);
    }

    .input-wrapper {
        position: relative;
    }

    .input-wrapper .icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--dark-400);
        font-size: 18px;
        pointer-events: none;
    }

    .input-wrapper input,
    .input-wrapper select {
        width: 100%;
        padding: 14px 16px 14px 48px;
        background: rgba(255, 255, 255, 0.03);
        border: 2px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        color: white;
        font-size: 15px;
        font-family: inherit;
        transition: all 0.3s ease;
    }

    .input-wrapper input:focus,
    .input-wrapper select:focus {
        outline: none;
        border-color: var(--accent-500);
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
    }

    .input-wrapper input::placeholder {
        color: var(--dark-500);
    }

    .input-wrapper select {
        cursor: pointer;
        appearance: none;
    }

    .input-wrapper select option {
        background: var(--dark-800);
        color: white;
    }

    .input-wrapper .toggle-password {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--dark-400);
        cursor: pointer;
        font-size: 18px;
        padding: 4px;
        transition: color 0.3s;
    }

    .input-wrapper .toggle-password:hover {
        color: var(--accent-500);
    }

    /* Password strength */
    .password-strength {
        margin-top: 12px;
    }

    .strength-bar {
        height: 4px;
        background: var(--dark-700);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 8px;
    }

    .strength-fill {
        height: 100%;
        border-radius: 2px;
        transition: all 0.3s ease;
    }

    .strength-fill.weak { width: 25%; background: var(--error-500); }
    .strength-fill.fair { width: 50%; background: #f97316; }
    .strength-fill.good { width: 75%; background: #eab308; }
    .strength-fill.strong { width: 100%; background: var(--success-500); }

    .strength-text {
        font-size: 12px;
        color: var(--dark-400);
    }

    /* Form row */
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    /* Checkbox */
    .checkbox-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .checkbox-group input[type="checkbox"] {
        width: 20px;
        height: 20px;
        accent-color: var(--accent-500);
        cursor: pointer;
    }

    .checkbox-group label {
        color: var(--dark-300);
        font-size: 14px;
        cursor: pointer;
        margin: 0;
    }

    .checkbox-group label a {
        color: var(--accent-500);
        text-decoration: none;
    }

    .checkbox-group label a:hover {
        text-decoration: underline;
    }

    /* Remember & Forgot */
    .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .forgot-link {
        color: var(--accent-500);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: color 0.3s;
    }

    .forgot-link:hover {
        color: var(--accent-400);
    }

    /* Buttons */
    .btn {
        width: 100%;
        padding: 16px 24px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-family: inherit;
        border: none;
    }

    .btn-primary {
        background: linear-gradient(135deg, var(--accent-500), var(--accent-400));
        color: var(--dark-950);
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(245, 158, 11, 0.4);
    }

    .btn-primary:active {
        transform: translateY(0);
    }

    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .btn .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Divider */
    .divider {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 28px 0;
    }

    .divider::before,
    .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
    }

    .divider span {
        color: var(--dark-400);
        font-size: 13px;
        white-space: nowrap;
    }

    /* Social buttons */
    .social-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }

    .btn-social {
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-family: inherit;
    }

    .btn-social:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
    }

    .btn-social svg {
        width: 20px;
        height: 20px;
    }

    /* Links */
    .auth-links {
        text-align: center;
        margin-top: 24px;
    }

    .auth-links a {
        color: var(--dark-300);
        text-decoration: none;
        font-size: 14px;
        transition: color 0.3s;
    }

    .auth-links a:hover {
        color: var(--accent-500);
    }

    .auth-links a strong {
        color: var(--accent-500);
        font-weight: 600;
    }

    /* Alert */
    .alert {
        padding: 14px 16px;
        border-radius: 12px;
        margin-bottom: 24px;
        font-size: 14px;
        display: none;
        align-items: center;
        gap: 12px;
    }

    .alert.show {
        display: flex;
    }

    .alert-error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: var(--error-400);
    }

    .alert-success {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.2);
        color: #6ee7b7;
    }

    .alert-icon {
        font-size: 18px;
        flex-shrink: 0;
    }

    /* Steps indicator */
    .steps-indicator {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 32px;
    }

    .step-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--dark-600);
        transition: all 0.3s;
    }

    .step-dot.active {
        background: var(--accent-500);
        box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
    }

    .step-dot.completed {
        background: var(--success-500);
    }

    /* Plan cards */
    .plan-cards {
        display: grid;
        gap: 12px;
        margin-bottom: 24px;
    }

    .plan-card {
        position: relative;
        padding: 20px;
        background: rgba(255, 255, 255, 0.02);
        border: 2px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .plan-card:hover {
        border-color: rgba(245, 158, 11, 0.3);
        background: rgba(255, 255, 255, 0.04);
    }

    .plan-card.selected {
        border-color: var(--accent-500);
        background: rgba(245, 158, 11, 0.08);
    }

    .plan-card.popular::before {
        content: 'Popular';
        position: absolute;
        top: -10px;
        right: 16px;
        background: linear-gradient(135deg, var(--accent-500), var(--accent-400));
        color: var(--dark-950);
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        text-transform: uppercase;
    }

    .plan-card input {
        display: none;
    }

    .plan-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 12px;
    }

    .plan-icon {
        width: 48px;
        height: 48px;
        background: rgba(245, 158, 11, 0.1);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
    }

    .plan-info h3 {
        color: white;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 2px;
    }

    .plan-info .price {
        color: var(--accent-500);
        font-size: 14px;
        font-weight: 600;
    }

    .plan-features {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .plan-features span {
        font-size: 12px;
        color: var(--dark-300);
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 10px;
        border-radius: 20px;
    }

    /* Business types */
    .business-types {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-bottom: 24px;
    }

    .business-type {
        padding: 16px 12px;
        background: rgba(255, 255, 255, 0.02);
        border: 2px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
    }

    .business-type:hover {
        border-color: rgba(245, 158, 11, 0.3);
    }

    .business-type.selected {
        border-color: var(--accent-500);
        background: rgba(245, 158, 11, 0.08);
    }

    .business-type input {
        display: none;
    }

    .business-type .icon {
        font-size: 28px;
        margin-bottom: 8px;
    }

    .business-type .name {
        font-size: 12px;
        color: var(--dark-200);
        font-weight: 500;
    }

    /* Success state */
    .success-icon {
        width: 80px;
        height: 80px;
        background: rgba(16, 185, 129, 0.15);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
        font-size: 40px;
    }

    .success-message {
        text-align: center;
    }

    .success-message h2 {
        margin-bottom: 12px;
    }

    .success-message p {
        color: var(--dark-400);
        margin-bottom: 32px;
    }

    /* Back link */
    .back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--dark-400);
        text-decoration: none;
        font-size: 14px;
        margin-bottom: 24px;
        transition: color 0.3s;
    }

    .back-link:hover {
        color: var(--accent-500);
    }

    /* Responsive */
    @media (max-width: 560px) {
        .auth-card {
            padding: 28px 20px;
        }

        .form-row {
            grid-template-columns: 1fr;
        }

        .business-types {
            grid-template-columns: repeat(2, 1fr);
        }

        .social-buttons {
            grid-template-columns: 1fr;
        }
    }
`;

// ==========================================
// 🔐 PÁGINA DE LOGIN
// ==========================================
router.get('/login', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión - BotSaaS</title>
    <meta name="description" content="Accede a tu panel de control BotSaaS para gestionar tu bot de WhatsApp">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="grid-pattern"></div>

    <div class="auth-container">
        <div class="logo">
            <div class="logo-icon">🤖</div>
            <h1>Bot<span>SaaS</span></h1>
            <p>Automatiza tu atención al cliente con IA</p>
        </div>

        <div class="auth-card">
            <h2>Bienvenido de nuevo</h2>
            <p class="subtitle">Ingresa tus credenciales para continuar</p>

            <div id="alert" class="alert">
                <span class="alert-icon"></span>
                <span class="alert-message"></span>
            </div>

            <form id="loginForm">
                <div class="form-group">
                    <label>Correo electrónico <span class="required">*</span></label>
                    <div class="input-wrapper">
                        <span class="icon">📧</span>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="tu@empresa.com"
                            autocomplete="email"
                            required
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label>Contraseña <span class="required">*</span></label>
                    <div class="input-wrapper">
                        <span class="icon">🔒</span>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            autocomplete="current-password"
                            required
                        >
                        <button type="button" class="toggle-password" onclick="togglePassword('password')">
                            👁️
                        </button>
                    </div>
                </div>

                <div class="form-options">
                    <div class="checkbox-group">
                        <input type="checkbox" id="remember" name="remember">
                        <label for="remember">Recordarme</label>
                    </div>
                    <a href="/auth/forgot-password" class="forgot-link">¿Olvidaste tu contraseña?</a>
                </div>

                <button type="submit" class="btn btn-primary" id="submitBtn">
                    <span class="btn-text">Iniciar Sesión</span>
                </button>
            </form>

            <div class="divider">
                <span>o continúa con</span>
            </div>

            <div class="social-buttons">
                <button type="button" class="btn-social" onclick="socialLogin('google')">
                    <svg viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                        <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                        <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                        <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7## 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                    </svg>
                    Google
                </button>
                <button type="button" class="btn-social" onclick="socialLogin('facebook')">
                    <svg viewBox="0 0 24 24">
                        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                </button>
            </div>

            <div class="auth-links">
                <a href="/auth/register">¿No tienes cuenta? <strong>Créala gratis</strong></a>
            </div>
        </div>
    </div>

    <script>
        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            const btn = input.nextElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
            }
        }

        function showAlert(message, type) {
            const alert = document.getElementById('alert');
            alert.className = 'alert alert-' + type + ' show';
            alert.querySelector('.alert-icon').textContent = type === 'error' ? '❌' : '✅';
            alert.querySelector('.alert-message').textContent = message;
        }

        function socialLogin(provider) {
            showAlert('Inicio con ' + provider + ' próximamente disponible', 'error');
        }

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('submitBtn');
            const btnText = btn.querySelector('.btn-text');
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            btn.disabled = true;
            btnText.innerHTML = '<div class="spinner"></div> Iniciando...';

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('Bienvenido de nuevo', 'success');
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                    }
                    setTimeout(() => {
                        window.location.href = data.redirectTo || '/dashboard';
                    }, 800);
                } else {
                    throw new Error(data.message || 'Credenciales incorrectas');
                }
            } catch (error) {
                showAlert(error.message, 'error');
                btn.disabled = false;
                btnText.textContent = 'Iniciar Sesión';
            }
        });
    </script>
</body>
</html>
    `);
});

// ==========================================
// 📝 PÁGINA DE REGISTRO (Multi-step)
// ==========================================
router.get('/register', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crear Cuenta - BotSaaS</title>
    <meta name="description" content="Crea tu cuenta BotSaaS y automatiza tu negocio en minutos">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="grid-pattern"></div>

    <div class="auth-container wide">
        <div class="logo">
            <div class="logo-icon">🤖</div>
            <h1>Bot<span>SaaS</span></h1>
            <p>Crea tu bot en menos de 5 minutos</p>
        </div>

        <div class="auth-card">
            <div class="steps-indicator">
                <div class="step-dot active" data-step="1"></div>
                <div class="step-dot" data-step="2"></div>
                <div class="step-dot" data-step="3"></div>
            </div>

            <div id="alert" class="alert">
                <span class="alert-icon"></span>
                <span class="alert-message"></span>
            </div>

            <form id="registerForm">
                <!-- Step 1: Cuenta -->
                <div class="step-content" id="step1">
                    <h2>Crea tu cuenta</h2>
                    <p class="subtitle">Ingresa tus datos personales</p>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre completo <span class="required">*</span></label>
                            <div class="input-wrapper">
                                <span class="icon">👤</span>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    placeholder="Juan Pérez"
                                    autocomplete="name"
                                    required
                                >
                            </div>
                        </div>
                        <div class="form-group">
                            <label>WhatsApp</label>
                            <div class="input-wrapper">
                                <span class="icon">📱</span>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    placeholder="+52 55 1234 5678"
                                    autocomplete="tel"
                                >
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Correo electrónico <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="icon">📧</span>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="tu@empresa.com"
                                autocomplete="email"
                                required
                            >
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Contraseña <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="icon">🔒</span>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Mínimo 8 caracteres"
                                minlength="6"
                                autocomplete="new-password"
                                required
                            >
                            <button type="button" class="toggle-password" onclick="togglePassword('password')">
                                👁️
                            </button>
                        </div>
                        <div class="password-strength" id="passwordStrength" style="display: none;">
                            <div class="strength-bar">
                                <div class="strength-fill" id="strengthFill"></div>
                            </div>
                            <span class="strength-text" id="strengthText"></span>
                        </div>
                    </div>

                    <button type="button" class="btn btn-primary" onclick="nextStep(2)">
                        Continuar →
                    </button>
                </div>

                <!-- Step 2: Negocio -->
                <div class="step-content" id="step2" style="display: none;">
                    <a href="#" class="back-link" onclick="prevStep(1)">← Volver</a>
                    <h2>Tu negocio</h2>
                    <p class="subtitle">Cuéntanos sobre tu empresa</p>

                    <div class="form-group">
                        <label>Nombre del negocio <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="icon">🏢</span>
                            <input
                                type="text"
                                id="businessName"
                                name="businessName"
                                placeholder="Mi Clínica Dental"
                                required
                            >
                        </div>
                    </div>

                    <label style="display: block; font-size: 14px; font-weight: 500; color: var(--dark-200); margin-bottom: 12px;">
                        Tipo de negocio <span class="required">*</span>
                    </label>

                    <div class="business-types">
                        <label class="business-type" onclick="selectBusinessType('dental')">
                            <input type="radio" name="businessType" value="dental">
                            <div class="icon">🦷</div>
                            <div class="name">Dental</div>
                        </label>
                        <label class="business-type" onclick="selectBusinessType('medical')">
                            <input type="radio" name="businessType" value="medical">
                            <div class="icon">🏥</div>
                            <div class="name">Médico</div>
                        </label>
                        <label class="business-type" onclick="selectBusinessType('spa')">
                            <input type="radio" name="businessType" value="spa">
                            <div class="icon">💆</div>
                            <div class="name">Spa</div>
                        </label>
                        <label class="business-type" onclick="selectBusinessType('nails')">
                            <input type="radio" name="businessType" value="nails">
                            <div class="icon">💅</div>
                            <div class="name">Uñas</div>
                        </label>
                        <label class="business-type" onclick="selectBusinessType('barbershop')">
                            <input type="radio" name="businessType" value="barbershop">
                            <div class="icon">💈</div>
                            <div class="name">Barbería</div>
                        </label>
                        <label class="business-type" onclick="selectBusinessType('automotive')">
                            <input type="radio" name="businessType" value="automotive">
                            <div class="icon">🚗</div>
                            <div class="name">Automotriz</div>
                        </label>
                        <label class="business-type" onclick="selectBusinessType('food')">
                            <input type="radio" name="businessType" value="food">
                            <div class="icon">🍕</div>
                            <div class="name">Nutrición</div>
                        </label>
                        <label class="business-type" onclick="selectBusinessType('other')">
                            <input type="radio" name="businessType" value="other">
                            <div class="icon">⚡</div>
                            <div class="name">Otro</div>
                        </label>
                    </div>

                    <button type="button" class="btn btn-primary" onclick="nextStep(3)">
                        Continuar →
                    </button>
                </div>

                <!-- Step 3: Plan -->
                <div class="step-content" id="step3" style="display: none;">
                    <a href="#" class="back-link" onclick="prevStep(2)">← Volver</a>
                    <h2>Elige tu plan</h2>
                    <p class="subtitle">14 días de prueba gratis en todos los planes</p>

                    <div class="plan-cards">
                        <label class="plan-card" onclick="selectPlan('basico')">
                            <input type="radio" name="plan" value="basico">
                            <div class="plan-header">
                                <div class="plan-icon">💬</div>
                                <div class="plan-info">
                                    <h3>Básico</h3>
                                    <div class="price">$299 MXN/mes</div>
                                </div>
                            </div>
                            <div class="plan-features">
                                <span>Respuestas automáticas</span>
                                <span>100 mensajes/día</span>
                                <span>1 número WhatsApp</span>
                            </div>
                        </label>

                        <label class="plan-card popular selected" onclick="selectPlan('pro')">
                            <input type="radio" name="plan" value="pro" checked>
                            <div class="plan-header">
                                <div class="plan-icon">📅</div>
                                <div class="plan-info">
                                    <h3>Pro</h3>
                                    <div class="price">$599 MXN/mes</div>
                                </div>
                            </div>
                            <div class="plan-features">
                                <span>Todo en Básico</span>
                                <span>Agenda inteligente</span>
                                <span>Dashboard Pro</span>
                                <span>500 mensajes/día</span>
                            </div>
                        </label>

                        <label class="plan-card" onclick="selectPlan('ultra')">
                            <input type="radio" name="plan" value="ultra">
                            <div class="plan-header">
                                <div class="plan-icon">🤖</div>
                                <div class="plan-info">
                                    <h3>Ultra</h3>
                                    <div class="price">$999 MXN/mes</div>
                                </div>
                            </div>
                            <div class="plan-features">
                                <span>Todo en Pro</span>
                                <span>IA Avanzada</span>
                                <span>Seguimientos automáticos</span>
                                <span>Mensajes ilimitados</span>
                            </div>
                        </label>
                    </div>

                    <div class="checkbox-group" style="margin-bottom: 24px;">
                        <input type="checkbox" id="terms" name="terms" required>
                        <label for="terms">
                            Acepto los <a href="/terms" target="_blank">Términos de Servicio</a>
                            y la <a href="/privacy" target="_blank">Política de Privacidad</a>
                        </label>
                    </div>

                    <button type="submit" class="btn btn-primary" id="submitBtn">
                        <span class="btn-text">Crear Mi Cuenta Gratis</span>
                    </button>
                </div>
            </form>

            <div class="auth-links">
                <a href="/auth/login">¿Ya tienes cuenta? <strong>Inicia sesión</strong></a>
            </div>
        </div>
    </div>

    <script>
        let currentStep = 1;

        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            const btn = input.nextElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
            }
        }

        function showAlert(message, type) {
            const alert = document.getElementById('alert');
            alert.className = 'alert alert-' + type + ' show';
            alert.querySelector('.alert-icon').textContent = type === 'error' ? '❌' : '✅';
            alert.querySelector('.alert-message').textContent = message;
        }

        function hideAlert() {
            document.getElementById('alert').classList.remove('show');
        }

        function updateSteps() {
            document.querySelectorAll('.step-dot').forEach((dot, index) => {
                dot.classList.remove('active', 'completed');
                if (index + 1 < currentStep) {
                    dot.classList.add('completed');
                } else if (index + 1 === currentStep) {
                    dot.classList.add('active');
                }
            });

            document.querySelectorAll('.step-content').forEach((content, index) => {
                content.style.display = index + 1 === currentStep ? 'block' : 'none';
            });
        }

        function validateStep(step) {
            hideAlert();

            if (step === 1) {
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;

                if (!name) {
                    showAlert('Ingresa tu nombre', 'error');
                    return false;
                }
                if (!email || !email.includes('@')) {
                    showAlert('Ingresa un email válido', 'error');
                    return false;
                }
                if (password.length < 6) {
                    showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
                    return false;
                }
                return true;
            }

            if (step === 2) {
                const businessName = document.getElementById('businessName').value.trim();
                const businessType = document.querySelector('input[name="businessType"]:checked');

                if (!businessName) {
                    showAlert('Ingresa el nombre de tu negocio', 'error');
                    return false;
                }
                if (!businessType) {
                    showAlert('Selecciona el tipo de negocio', 'error');
                    return false;
                }
                return true;
            }

            return true;
        }

        function nextStep(step) {
            if (validateStep(currentStep)) {
                currentStep = step;
                updateSteps();
            }
        }

        function prevStep(step) {
            currentStep = step;
            updateSteps();
            hideAlert();
        }

        function selectBusinessType(type) {
            document.querySelectorAll('.business-type').forEach(bt => bt.classList.remove('selected'));
            event.currentTarget.classList.add('selected');
        }

        function selectPlan(plan) {
            document.querySelectorAll('.plan-card').forEach(card => card.classList.remove('selected'));
            event.currentTarget.classList.add('selected');
        }

        // Password strength
        document.getElementById('password').addEventListener('input', (e) => {
            const password = e.target.value;
            const strengthDiv = document.getElementById('passwordStrength');
            const fill = document.getElementById('strengthFill');
            const text = document.getElementById('strengthText');

            if (!password) {
                strengthDiv.style.display = 'none';
                return;
            }

            strengthDiv.style.display = 'block';
            let strength = 0;

            if (password.length >= 6) strength++;
            if (password.length >= 8) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;

            fill.className = 'strength-fill';
            if (strength <= 1) {
                fill.classList.add('weak');
                text.textContent = 'Débil';
            } else if (strength === 2) {
                fill.classList.add('fair');
                text.textContent = 'Regular';
            } else if (strength === 3) {
                fill.classList.add('good');
                text.textContent = 'Buena';
            } else {
                fill.classList.add('strong');
                text.textContent = 'Muy fuerte';
            }
        });

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!document.getElementById('terms').checked) {
                showAlert('Debes aceptar los términos de servicio', 'error');
                return;
            }

            const btn = document.getElementById('submitBtn');
            const btnText = btn.querySelector('.btn-text');

            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
                phone: document.getElementById('phone').value.trim(),
                businessName: document.getElementById('businessName').value.trim(),
                businessType: document.querySelector('input[name="businessType"]:checked')?.value,
                plan: document.querySelector('input[name="plan"]:checked')?.value || 'pro'
            };

            btn.disabled = true;
            btnText.innerHTML = '<div class="spinner"></div> Creando cuenta...';

            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('Cuenta creada exitosamente', 'success');
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                    }
                    setTimeout(() => {
                        window.location.href = data.redirectTo || '/dashboard';
                    }, 1000);
                } else {
                    throw new Error(data.message || 'Error al crear cuenta');
                }
            } catch (error) {
                showAlert(error.message, 'error');
                btn.disabled = false;
                btnText.textContent = 'Crear Mi Cuenta Gratis';
            }
        });
    </script>
</body>
</html>
    `);
});

// ==========================================
// 🔑 PÁGINA OLVIDÉ CONTRASEÑA
// ==========================================
router.get('/forgot-password', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña - BotSaaS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="grid-pattern"></div>

    <div class="auth-container">
        <div class="logo">
            <div class="logo-icon">🤖</div>
            <h1>Bot<span>SaaS</span></h1>
        </div>

        <div class="auth-card">
            <a href="/auth/login" class="back-link">← Volver al login</a>

            <div id="formView">
                <h2>Recuperar contraseña</h2>
                <p class="subtitle">Te enviaremos un enlace para restablecer tu contraseña</p>

                <div id="alert" class="alert">
                    <span class="alert-icon"></span>
                    <span class="alert-message"></span>
                </div>

                <form id="forgotForm">
                    <div class="form-group">
                        <label>Correo electrónico <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="icon">📧</span>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="tu@empresa.com"
                                autocomplete="email"
                                required
                            >
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary" id="submitBtn">
                        <span class="btn-text">Enviar enlace de recuperación</span>
                    </button>
                </form>
            </div>

            <div id="successView" style="display: none;">
                <div class="success-icon">📧</div>
                <div class="success-message">
                    <h2>Revisa tu correo</h2>
                    <p>Si la cuenta existe, recibirás un enlace para restablecer tu contraseña en los próximos minutos.</p>
                    <a href="/auth/login" class="btn btn-primary">Volver al login</a>
                </div>
            </div>
        </div>
    </div>

    <script>
        function showAlert(message, type) {
            const alert = document.getElementById('alert');
            alert.className = 'alert alert-' + type + ' show';
            alert.querySelector('.alert-icon').textContent = type === 'error' ? '❌' : '✅';
            alert.querySelector('.alert-message').textContent = message;
        }

        document.getElementById('forgotForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('submitBtn');
            const btnText = btn.querySelector('.btn-text');
            const email = document.getElementById('email').value;

            btn.disabled = true;
            btnText.innerHTML = '<div class="spinner"></div> Enviando...';

            try {
                const response = await fetch('/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                document.getElementById('formView').style.display = 'none';
                document.getElementById('successView').style.display = 'block';

            } catch (error) {
                showAlert('Error al enviar el correo', 'error');
                btn.disabled = false;
                btnText.textContent = 'Enviar enlace de recuperación';
            }
        });
    </script>
</body>
</html>
    `);
});

// ==========================================
// 🔑 PÁGINA RESTABLECER CONTRASEÑA
// ==========================================
router.get('/reset-password/:token', (req, res) => {
    const { token } = req.params;

    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Contraseña - BotSaaS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="grid-pattern"></div>

    <div class="auth-container">
        <div class="logo">
            <div class="logo-icon">🤖</div>
            <h1>Bot<span>SaaS</span></h1>
        </div>

        <div class="auth-card">
            <div id="formView">
                <h2>Crear nueva contraseña</h2>
                <p class="subtitle">Ingresa tu nueva contraseña</p>

                <div id="alert" class="alert">
                    <span class="alert-icon"></span>
                    <span class="alert-message"></span>
                </div>

                <form id="resetForm">
                    <input type="hidden" id="token" value="${token}">

                    <div class="form-group">
                        <label>Nueva contraseña <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="icon">🔒</span>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Mínimo 8 caracteres"
                                minlength="6"
                                autocomplete="new-password"
                                required
                            >
                            <button type="button" class="toggle-password" onclick="togglePassword('password')">
                                👁️
                            </button>
                        </div>
                        <div class="password-strength" id="passwordStrength" style="display: none;">
                            <div class="strength-bar">
                                <div class="strength-fill" id="strengthFill"></div>
                            </div>
                            <span class="strength-text" id="strengthText"></span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Confirmar contraseña <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="icon">🔒</span>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Repite tu contraseña"
                                minlength="6"
                                autocomplete="new-password"
                                required
                            >
                            <button type="button" class="toggle-password" onclick="togglePassword('confirmPassword')">
                                👁️
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary" id="submitBtn">
                        <span class="btn-text">Cambiar Contraseña</span>
                    </button>
                </form>
            </div>

            <div id="successView" style="display: none;">
                <div class="success-icon">✅</div>
                <div class="success-message">
                    <h2>Contraseña actualizada</h2>
                    <p>Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión.</p>
                    <a href="/auth/login" class="btn btn-primary">Iniciar Sesión</a>
                </div>
            </div>

            <div id="errorView" style="display: none;">
                <div class="success-icon" style="background: rgba(239, 68, 68, 0.15);">❌</div>
                <div class="success-message">
                    <h2>Enlace inválido</h2>
                    <p>Este enlace ha expirado o es inválido. Solicita uno nuevo.</p>
                    <a href="/auth/forgot-password" class="btn btn-primary">Solicitar nuevo enlace</a>
                </div>
            </div>
        </div>
    </div>

    <script>
        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            const btn = input.nextElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
            }
        }

        function showAlert(message, type) {
            const alert = document.getElementById('alert');
            alert.className = 'alert alert-' + type + ' show';
            alert.querySelector('.alert-icon').textContent = type === 'error' ? '❌' : '✅';
            alert.querySelector('.alert-message').textContent = message;
        }

        // Password strength
        document.getElementById('password').addEventListener('input', (e) => {
            const password = e.target.value;
            const strengthDiv = document.getElementById('passwordStrength');
            const fill = document.getElementById('strengthFill');
            const text = document.getElementById('strengthText');

            if (!password) {
                strengthDiv.style.display = 'none';
                return;
            }

            strengthDiv.style.display = 'block';
            let strength = 0;

            if (password.length >= 6) strength++;
            if (password.length >= 8) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;

            fill.className = 'strength-fill';
            if (strength <= 1) {
                fill.classList.add('weak');
                text.textContent = 'Débil';
            } else if (strength === 2) {
                fill.classList.add('fair');
                text.textContent = 'Regular';
            } else if (strength === 3) {
                fill.classList.add('good');
                text.textContent = 'Buena';
            } else {
                fill.classList.add('strong');
                text.textContent = 'Muy fuerte';
            }
        });

        document.getElementById('resetForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const token = document.getElementById('token').value;

            if (password !== confirmPassword) {
                showAlert('Las contraseñas no coinciden', 'error');
                return;
            }

            const btn = document.getElementById('submitBtn');
            const btnText = btn.querySelector('.btn-text');

            btn.disabled = true;
            btnText.innerHTML = '<div class="spinner"></div> Actualizando...';

            try {
                const response = await fetch('/auth/reset-password/' + token, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                const data = await response.json();

                if (data.success) {
                    document.getElementById('formView').style.display = 'none';
                    document.getElementById('successView').style.display = 'block';
                } else {
                    throw new Error(data.message || 'Error al actualizar contraseña');
                }
            } catch (error) {
                if (error.message.includes('expirado') || error.message.includes('inválido')) {
                    document.getElementById('formView').style.display = 'none';
                    document.getElementById('errorView').style.display = 'block';
                } else {
                    showAlert(error.message, 'error');
                    btn.disabled = false;
                    btnText.textContent = 'Cambiar Contraseña';
                }
            }
        });
    </script>
</body>
</html>
    `);
});

// ==========================================
// ✅ PÁGINA VERIFICAR EMAIL
// ==========================================
router.get('/verify/:token', async (req, res) => {
    const { token } = req.params;

    // Intentar verificar directamente
    try {
        const response = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/auth/verify/${token}`);
        const data = await response.json();

        const isSuccess = data.success;

        res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificar Email - BotSaaS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="grid-pattern"></div>

    <div class="auth-container">
        <div class="logo">
            <div class="logo-icon">🤖</div>
            <h1>Bot<span>SaaS</span></h1>
        </div>

        <div class="auth-card">
            ${isSuccess ? `
                <div class="success-icon">✅</div>
                <div class="success-message">
                    <h2>Email verificado</h2>
                    <p>Tu correo electrónico ha sido verificado exitosamente. Ya puedes acceder a todas las funciones.</p>
                    <a href="/auth/login" class="btn btn-primary">Ir al Dashboard</a>
                </div>
            ` : `
                <div class="success-icon" style="background: rgba(239, 68, 68, 0.15);">❌</div>
                <div class="success-message">
                    <h2>Enlace inválido</h2>
                    <p>Este enlace de verificación ha expirado o es inválido.</p>
                    <a href="/auth/login" class="btn btn-primary">Ir al Login</a>
                </div>
            `}
        </div>
    </div>
</body>
</html>
        `);
    } catch (error) {
        res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificar Email - BotSaaS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="grid-pattern"></div>

    <div class="auth-container">
        <div class="logo">
            <div class="logo-icon">🤖</div>
            <h1>Bot<span>SaaS</span></h1>
        </div>

        <div class="auth-card">
            <div class="success-icon" style="background: rgba(239, 68, 68, 0.15);">❌</div>
            <div class="success-message">
                <h2>Error de verificación</h2>
                <p>Ocurrió un error al verificar tu email. Por favor intenta de nuevo.</p>
                <a href="/auth/login" class="btn btn-primary">Ir al Login</a>
            </div>
        </div>
    </div>
</body>
</html>
        `);
    }
});

module.exports = router;
