const fs = require('fs');

// Leer el archivo
const filePath = './routes/onboarding-complete.js';
let content = fs.readFileSync(filePath, 'utf8');

// Encontrar y corregir el error de sintaxis
const wrongCode = `                    // FIX DEFINITIVO: phoneNumber NUNCA será null
                    console.log("🔍 DEBUG - whatsappBusiness:", formData.get("whatsappBusiness"));
                    console.log("🔍 DEBUG - phoneNumber result:", formData.get("whatsappBusiness") || "biz-" + Date.now() + "-" + Math.random().toString(36).substr(2));
                    addressStreet: formData.get('addressStreet'),`;

const fixedCode = `                    // FIX DEFINITIVO: phoneNumber NUNCA será null
                    phoneNumber: formData.get("whatsappBusiness") || "biz-" + Date.now() + "-" + Math.random().toString(36).substr(2),
                    addressStreet: formData.get('addressStreet'),`;

// Reemplazar el código incorrecto
content = content.replace(wrongCode, fixedCode);

// Guardar el archivo corregido
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Error de sintaxis corregido en onboarding-complete.js');
