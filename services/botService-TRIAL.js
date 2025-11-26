// 🧪 BOT TRIAL - PRÓXIMAMENTE
const ConversationManager = require('./conversationManager');

async function processBotMessage(business, message, phone) {
  return `🧪 *Modo Prueba - ${business.businessName}*\n\n` +
         `Estás en la versión de prueba. Funcionalidades limitadas.\n\n` +
         `Escribe "menu" para ver opciones.`;
}

module.exports = { processBotMessage };
