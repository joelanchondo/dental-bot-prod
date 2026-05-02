const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../services');
const files = fs.readdirSync(servicesDir).filter(f => f.startsWith('botService'));

files.forEach(file => {
    const filePath = path.join(servicesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace confirmation message inside handleServiceSelection
    content = content.replace(
        /return `✅ \*\$\{selectedService\.name\}\*\\n\\n` \+\s*`💰 Precio: \$\$\{selectedService\.price\}\\n` \+\s*\(selectedService\.duration \? `⏱️ Duración: \$\{selectedService\.duration\} min\\n` : ''\) \+\s*\(selectedService\.description \? `📝 \$\{selectedService\.description\}\\n\\n` : '\\n'\) \+\s*'¿Deseas agendar este servicio\? \(Responde "sí" o "no"\)';/g,
        `const priceDisplay = selectedService.price > 0 ? \`💰 Precio: $\${selectedService.price}\\n\` : (selectedService.basePrice > 0 ? \`💰 Desde: $\${selectedService.basePrice}\\n\` : '');
      
      return \`✅ Has seleccionado: *\${selectedService.name}*\\n\\n\` +
             priceDisplay +
             (selectedService.duration ? \`⏱️ Duración: \${selectedService.duration} min\\n\` : '') +
             (selectedService.description ? \`📝 \${selectedService.description}\\n\\n\` : '\\n') +
             '👉 ¿Deseas continuar y agendar este servicio?\\nResponde *"sí"* o *"no"*';`
    );

    fs.writeFileSync(filePath, content);
});

console.log('✅ Todos los botService actualizados');
