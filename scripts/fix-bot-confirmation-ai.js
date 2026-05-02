const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../services');
const files = fs.readdirSync(servicesDir).filter(f => f.startsWith('botService'));

files.forEach(file => {
    const filePath = path.join(servicesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace old confirmation message
    content = content.replace(
        /const priceDisplay = selectedService\.price > 0 \? `💰 Precio: \$\$\{selectedService\.price\}\\n` : \(selectedService\.basePrice > 0 \? `💰 Desde: \$\$\{selectedService\.basePrice\}\\n` : ''\);\s*return `✅ Has seleccionado: \*\$\{selectedService\.name\}\*\\n\\n` \+\s*priceDisplay \+\s*\(selectedService\.duration \? `⏱️ Duración: \$\{selectedService\.duration\} min\\n` : ''\) \+\s*\(selectedService\.description \? `📝 \$\{selectedService\.description\}\\n\\n` : '\\n'\) \+\s*'👉 ¿Deseas continuar y agendar este servicio\?\\nResponde \*"sí"\* o \*"no"\*';/g,
        `const priceDisplay = selectedService.price > 0 ? \`💳 Inversión: $\${selectedService.price} MXN\\n\` : (selectedService.basePrice > 0 ? \`💡 Desde: $\${selectedService.basePrice} MXN\\n\` : '');
      
      return \`✨ ¡Excelente elección! Has seleccionado:
*\${selectedService.name}*

\${priceDisplay}\${selectedService.duration ? \`⏱️ Tiempo estimado: \${selectedService.duration} min\\n\` : ''}\${selectedService.description ? \`📝 Nota: \${selectedService.description}\\n\\n\` : '\\n'}👉 ¿Confirmamos y agendamos este servicio?
Responde *"Sí"* para elegir tu horario, o *"No"* para regresar al menú principal.\`;`
    );

    fs.writeFileSync(filePath, content);
});

console.log('✅ Todos los botService actualizados al formato AI Premium');
