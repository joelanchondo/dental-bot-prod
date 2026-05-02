const Business = require('../models/Business');

/**
 * Obtiene un negocio y sus servicios activos
 */
const getBusiness = async (businessId) => {
  return await Business.findById(businessId).select('services businessName slug plan');
};

/**
 * Genera el menú de servicios para WhatsApp
 */
const generateServiceMenu = (business) => {
  let menu = `✨ *Bienvenido a ${business.businessName}* ✨\n`;
  menu += `_Soy tu asistente virtual. Estoy aquí para ayudarte._\n\n`;
  
  if (business.plan === 'premium') {
    menu += `👑 *Socio Premium*\n\n`;
  }
  
  menu += `¿En qué te puedo ayudar hoy? Conoce nuestros servicios destacados:\n\n`;

  const activeServices = business.services.filter(s => s.active);

  if (activeServices.length === 0) {
    return menu + 'Actualmente no tenemos servicios disponibles. ¡Vuelve pronto!';
  }

  activeServices.forEach((service, index) => {
    menu += `🔹 *${index + 1}. ${service.name}*\n`;
    
    if (service.description) {
      menu += `   _${service.description}_\n`;
    }
    
    let details = [];
    if (service.price > 0) details.push(`💳 $${service.price} MXN`);
    else if (service.basePrice > 0) details.push(`💡 Desde $${service.basePrice} MXN`);
    
    if (service.duration) details.push(`⏱️ ${service.duration} min`);

    if (details.length > 0) {
      menu += `   ${details.join('  |  ')}\n`;
    }
    menu += `\n`;
  });

  menu += `⬇️ *Escribe el NÚMERO* del servicio que deseas reservar y prepararé todo para tu cita al instante. 📅`;

  return menu;
};

/**
 * Obtiene un servicio por índice
 */
const getServiceByIndex = (business, index) => {
  const activeServices = business.services.filter(s => s.active);
  return activeServices[index - 1] || null;
};

/**
 * Obtiene precio formateado (maneja la nueva arquitectura)
 */
const getFormattedPrice = (service, businessPlan) => {
  if (service.price > 0) {
    let priceText = `$${service.price}`;
    
    if (service.basePrice > 0 && service.price !== service.basePrice) {
      priceText += ` (Sugerido: $${service.basePrice})`;
    }
    
    if (service.requiresPayment === false) {
      priceText += ' (Pago en consultorio)';
    } else if (businessPlan === 'premium') {
      priceText += ' 💳';
    }
    
    return priceText;
  }
  
  if (service.basePrice > 0) {
    return `Desde: $${service.basePrice} (editable)`;
  }
  
  return 'Consultar precio';
};

module.exports = {
  getBusiness,
  generateServiceMenu,
  getServiceByIndex,
  getFormattedPrice
};
