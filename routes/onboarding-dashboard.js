const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

// GET /onboarding-dashboard - Dashboard funcional
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Onboarding</title>
    <style>
        body { font-family: Arial; margin: 40px; }
        .container { max-width: 600px; margin: 0 auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏢 Crear Nuevo Negocio</h1>
        <form id="onboardingForm">
            <div class="form-group">
                <label>Nombre del Negocio:</label>
                <input type="text" name="businessName" required>
            </div>
            <div class="form-group">
                <label>WhatsApp Business:</label>
                <input type="tel" name="whatsappBusiness" placeholder="+521234567890" required>
            </div>
            <div class="form-group">
                <label>Email:</label>
                <input type="email" name="contactEmail" required>
            </div>
            <div class="form-group">
                <label>Tipo de Negocio:</label>
                <select name="businessType" required>
                    <option value="dental">🦷 Dental</option>
                    <option value="medical">🏥 Médico</option>
                    <option value="automotive">🚗 Automotriz</option>
                </select>
            </div>
            <button type="submit">Crear Negocio</button>
        </form>
        <div id="result" style="margin-top: 20px; display: none;"></div>
    </div>

    <script>
        document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/api/onboarding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                const resultDiv = document.getElementById('result');
                
                if (result.success) {
                    resultDiv.innerHTML = '<div style="color: green; padding: 10px; background: #f0fff0; border: 1px solid green;">✅ Negocio creado exitosamente! ID: ' + result.business.id + '</div>';
                } else {
                    resultDiv.innerHTML = '<div style="color: red; padding: 10px; background: #fff0f0; border: 1px solid red;">❌ Error: ' + result.error + '</div>';
                }
                
                resultDiv.style.display = 'block';
            } catch (error) {
                alert('Error de conexión: ' + error.message);
            }
        });
    </script>
</body>
</html>
  `);
});

module.exports = router;
