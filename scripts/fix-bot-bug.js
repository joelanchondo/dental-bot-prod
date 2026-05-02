const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../services');
const files = fs.readdirSync(servicesDir).filter(f => f.startsWith('botService'));

files.forEach(file => {
    const filePath = path.join(servicesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Fix the state bug when selecting numbers from the main menu
    content = content.replace(
        /ConversationManager\.updateState\(phone, \{\s*flow: 'select_service',\s*step: 'service_selected',\s*data: \{ serviceIndex: number \}\s*\}\);\s*const selectedService = getServiceByIndex\(updatedBusiness, number\);/g,
        `const selectedService = getServiceByIndex(updatedBusiness, number);
      if (!selectedService) {
        return '❌ Número inválido. Por favor, elige un número de la lista.\\n\\n' + 
               generateServiceMenu(updatedBusiness);
      }
      
      ConversationManager.updateState(phone, {
        flow: 'select_service',
        step: 'confirm_service',
        data: { selectedService }
      });`
    );
    
    // Clean up duplicate getServiceByIndex if it exists
    content = content.replace(
        /data: \{ selectedService \}\s*\}\);\s*if \(\!selectedService\) \{\s*return '❌ Número inválido\. Por favor, elige un número de la lista\.\\n\\n' \+ \s*generateServiceMenu\(updatedBusiness\);\s*\}/g,
        `data: { selectedService }\n      });`
    );

    // 2. Apply the AI formatting to both confirmation blocks
    // Block 1: in the global number selector
    content = content.replace(
        /const priceDisplay = selectedService\.price > 0 \? `💰 Precio: \$\$\{selectedService\.price\}\\n` : \(selectedService\.basePrice > 0 \? `💰 Desde: \$\$\{selectedService\.basePrice\}\\n` : ''\);\s*return `✅ Has seleccionado: \*\$\{selectedService\.name\}\*\\n\\n` \+\s*priceDisplay \+\s*\(selectedService\.duration \? `⏱️ Duración: \$\{selectedService\.duration\} min\\n` : ''\) \+\s*\(selectedService\.description \? `📝 \$\{selectedService\.description\}\\n\\n` : '\\n'\) \+\s*'👉 ¿Deseas continuar y agendar este servicio\?\\nResponde \*"sí"\* o \*"no"\*';/g,
        `const priceDisplay = selectedService.price > 0 ? \`💳 Inversión: $\${selectedService.price} MXN\\n\` : (selectedService.basePrice > 0 ? \`💡 Sugerido: $\${selectedService.basePrice} MXN\\n\` : '');
      
      return \`✨ ¡Excelente elección! Has seleccionado:\\n*\${selectedService.name}*\\n\\n\${priceDisplay}\${selectedService.duration ? \`⏱️ Tiempo estimado: \${selectedService.duration} min\\n\` : ''}\${selectedService.description ? \`📝 Nota: \${selectedService.description}\\n\\n\` : '\\n'}👉 ¿Confirmamos y agendamos este servicio?\\nResponde *"Sí"* para elegir tu horario, o *"No"* para regresar al menú principal.\`;`
    );

    fs.writeFileSync(filePath, content);
});

console.log('✅ Bug de estado arreglado y estilo AI aplicado');
