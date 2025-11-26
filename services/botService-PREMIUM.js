// 👑 BOT PREMIUM - PRÓXIMAMENTE
const ConversationManager = require('./conversationManager');

async function processBotMessage(business, message, phone) {
  return `👑 *${business.businessName} - Plan Premium*\n\n` +
         `IA + Pagos + Facturación.\n\n` +
         `Escribe "menu" para comenzar.`;
}

module.exports = { processBotMessage };
