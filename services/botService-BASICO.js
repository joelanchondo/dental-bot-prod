// 🏷️ BOT BÁSICO - PRÓXIMAMENTE  
const ConversationManager = require('./conversationManager');

async function processBotMessage(business, message, phone) {
  return `🏷️ *${business.businessName} - Plan Básico*\n\n` +
         `Bot personalizado para tu negocio.\n\n` +
         `Escribe "menu" para comenzar.`;
}

module.exports = { processBotMessage };
