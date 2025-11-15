const express = require('express');
const router = express.Router();

// GET /onboarding - Dashboard visual de onboarding
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Onboarding - Dental Bot</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .form-container {
            padding: 40px;
        }
        .form-section {
            margin-bottom: 30px;
            padding: 25px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            background: #f9fafb;
        }
        .form-section h3 {
            color: #1f2937;
            margin-bottom: 20px;
            font-size: 1.3rem;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
        }
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #374151;
        }
        .form-group input, .form-group select, .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .btn {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }
        .plan-options {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 10px;
        }
        .plan-option {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        .plan-option.selected {
            border-color: #3b82f6;
            background: #eff6ff;
        }
        .plan-option.demo { border-left: 4px solid #6b7280; }
        .plan-option.basic { border-left: 4px solid #10b981; }
        .plan-option.pro { border-left: 4px solid #3b82f6; }
        .plan-option.premium { border-left: 4px solid #8b5cf6; }
        .result {
            display: none;
            padding: 30px;
            text-align: center;
            background: #f0fdf4;
            border-radius: 10px;
            margin-top: 20px;
        }
        .success { color: #059669; }
        .error { color: #dc2626; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Sistema de Onboarding</h1>
            <p>Creación de clientes para Dental Bot</p>
        </div>
        
        <div class="form-container">
            <form id="onboardingForm">
                <!-- SECCIÓN 1: TIPO DE NEGOCIO -->
                <div class="form-section">
                    <h3>📊 Tipo de Negocio</h3>
                    <div class="form-group">
                        <label for="businessType">Selecciona el tipo de negocio:</label>
                        <select id="businessType" name="businessType" required>
                            <option value="">-- Selecciona --</option>
                            <option value="dental">🦷 Clínica Dental</option>
                            <option value="medical">🏥 Consultorio Médico</option>
                            <option value="automotive">🚗 Servicio Automotriz</option>
                            <option value="barbershop">💈 Barbería</option>
                            <option value="spa">💆 Spa & Bienestar</option>
                            <option value="consulting">💼 Consultoría</option>
                            <option value="other">🔧 Otro</option>
                        </select>
                    </div>
                </div>

                <!-- SECCIÓN 2: DATOS DEL NEGOCIO -->
                <div class="form-section">
                    <h3>🏢 Datos del Negocio</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="businessName">Nombre Comercial *</label>
                            <input type="text" id="businessName" name="businessName" required>
                        </div>
                        <div class="form-group">
                            <label for="legalName">Razón Social</label>
                            <input type="text" id="legalName" name="legalName">
                        </div>
                        <div class="form-group">
                            <label for="rfc">RFC</label>
                            <input type="text" id="rfc" name="rfc" placeholder="Ej: XAXX010101000">
                        </div>
                        <div class="form-group">
                            <label for="managerName">Nombre del Encargado *</label>
                            <input type="text" id="managerName" name="managerName" required>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 3: CONTACTO -->
                <div class="form-section">
                    <h3>📞 Información de Contacto</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="whatsappBusiness">WhatsApp Business *</label>
                            <input type="tel" id="whatsappBusiness" name="whatsappBusiness" 
                                   placeholder="+5215512345678" required>
                        </div>
                        <div class="form-group">
                            <label for="contactEmail">Correo Electrónico *</label>
                            <input type="email" id="contactEmail" name="contactEmail" required>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 4: UBICACIÓN -->
                <div class="form-section">
                    <h3>📍 Ubicación</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="street">Calle y Número</label>
                            <input type="text" id="street" name="address.street">
                        </div>
                        <div class="form-group">
                            <label for="city">Ciudad</label>
                            <input type="text" id="city" name="address.city">
                        </div>
                        <div class="form-group">
                            <label for="state">Estado</label>
                            <input type="text" id="state" name="address.state">
                        </div>
                        <div class="form-group">
                            <label for="postalCode">Código Postal</label>
                            <input type="text" id="postalCode" name="address.postalCode">
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 5: PLAN -->
                <div class="form-section">
                    <h3>💰 Plan de Servicio</h3>
                    <div class="plan-options">
                        <div class="plan-option demo" data-plan="demo">
                            <strong>DEMO</strong>
                            <div>$0</div>
                            <small>7 días prueba</small>
                        </div>
                        <div class="plan-option basic" data-plan="basic">
                            <strong>BÁSICO</strong>
                            <div>$10,000</div>
                            <small>Bot WhatsApp</small>
                        </div>
                        <div class="plan-option pro" data-plan="pro">
                            <strong>PRO</strong>
                            <div>$18,000</div>
                            <small>+ Calendar</small>
                        </div>
                        <div class="plan-option premium" data-plan="premium">
                            <strong>PREMIUM</strong>
                            <div>$25,000</div>
                            <small>+ Facturación</small>
                        </div>
                    </div>
                    <input type="hidden" id="plan" name="plan" value="demo">
                </div>

                <!-- SECCIÓN 6: AGENTE -->
                <div class="form-section">
                    <h3>👤 Agente de Ventas</h3>
                    <div class="form-group">
                        <label for="salesAgent">Nombre del Agente *</label>
                        <input type="text" id="salesAgent" name="salesAgent" required>
                    </div>
                </div>

                <button type="submit" class="btn">🚀 Crear Cliente</button>
            </form>

            <div id="result" class="result"></div>
        </div>
    </div>

    <script>
        // Selección de plan
        document.querySelectorAll('.plan-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.plan-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                document.getElementById('plan').value = this.dataset.plan;
            });
        });

        // Envío del formulario
        document.getElementById('onboardingForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                businessType: formData.get('businessType'),
                businessName: formData.get('businessName'),
                legalName: formData.get('legalName'),
                rfc: formData.get('rfc'),
                managerName: formData.get('managerName'),
                whatsappBusiness: formData.get('whatsappBusiness'),
                contactEmail: formData.get('contactEmail'),
                address: {
                    street: formData.get('address.street'),
                    city: formData.get('address.city'),
                    state: formData.get('address.state'),
                    postalCode: formData.get('address.postalCode')
                },
                plan: formData.get('plan'),
                salesAgent: formData.get('salesAgent')
            };

            try {
                const response = await fetch('/api/onboarding/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                const resultDiv = document.getElementById('result');
                
                if (result.success) {
                    resultDiv.innerHTML = `
                        <h3 class="success">✅ Cliente Creado Exitosamente</h3>
                        <p><strong>Negocio:</strong> ${result.business.businessName}</p>
                        <p><strong>Plan:</strong> ${result.business.plan.toUpperCase()}</p>
                        <p><strong>ID:</strong> ${result.business.id}</p>
                        <p><strong>WhatsApp:</strong> <a href="${result.business.whatsappUrl}" target="_blank">${result.business.whatsappUrl}</a></p>
                        <p><strong>Dashboard:</strong> <a href="${result.business.dashboardUrl}" target="_blank">${result.business.dashboardUrl}</a></p>
                        <p><strong>Setup:</strong> <a href="${result.business.setupUrl}" target="_blank">${result.business.setupUrl}</a></p>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <h3 class="error">❌ Error</h3>
                        <p>${result.error}</p>
                    `;
                }
                
                resultDiv.style.display = 'block';
                resultDiv.scrollIntoView({ behavior: 'smooth' });

            } catch (error) {
                document.getElementById('result').innerHTML = `
                    <h3 class="error">❌ Error de conexión</h3>
                    <p>${error.message}</p>
                `;
                document.getElementById('result').style.display = 'block';
            }
        });
    </script>
</body>
</html>
