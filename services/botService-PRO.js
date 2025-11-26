// 🚀 BOT PRO - PRÓXIMAMENTE
const ConversationManager = require('./conversationManager');

async function processBotMessage(business, message, phone) {
  return `🚀 *${business.businessName} - Plan Pro*\n\n` +
         `Dashboard + Calendario avanzado.\n\n` +
         `Escribe "menu" para comenzar.`;
}

module.exports = { processBotMessage };
