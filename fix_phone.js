const fs = require('fs');

// Leer el archivo
let content = fs.readFileSync('routes/appointments-api.js', 'utf8');

// Reemplazar la sección del teléfono
const newContent = content.replace(
  /let formattedPhone = clientPhone;[\s\S]*?formattedPhone = "whatsapp:" \+ formattedPhone;/,
  `// Asegurar formato correcto del número
    let formattedPhone = clientPhone.trim(); // Eliminar espacios
    if (!formattedPhone.startsWith("whatsapp:")) {
      formattedPhone = "whatsapp:" + formattedPhone;
    }
    // Asegurar que tenga + y formato correcto
    formattedPhone = formattedPhone.replace("whatsapp:", "whatsapp:+").replace(/[^0-9+]/g, "");
    formattedPhone = formattedPhone.replace("whatsapp:++", "whatsapp:+"); // Evitar ++
    console.log('📱 Teléfono formateado:', formattedPhone);`
);

fs.writeFileSync('routes/appointments-api.js', newContent);
console.log('✅ Teléfono corregido en appointments-api.js');
