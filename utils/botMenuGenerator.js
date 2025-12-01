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
  let menu = `*${business.businessName}*\n\n`;
  
  if (business.plan === 'premium') {
    menu += `👑 *Plan Premium Activado*\n\n`;
  }
  
  menu += `Servicios disponibles:\n\n`;

  const activeServices = business.services.filter(s => s.active);

  if (activeServices.length === 0) {
    return menu + 'No hay servicios disponibles en este momento.';
  }

  activeServices.forEach((service, index) => {
    menu += `${index + 1}. *${service.name}*\n`;
    if (service.description) menu += `   ${service.description}\n`;
    
    // Lógica inteligente de precios
    if (service.price > 0) {
      // Precio ya establecido por el negocio
      menu += `   💰 $${service.price}`;
      if (service.basePrice > 0 && service.price !== service.basePrice) {
        menu += ` (Sugerido: $${service.basePrice})`;
      }
      if (service.requiresPayment === false) {
        menu += ` (Pago en consultorio)`;
      } else if (business.plan === 'premium') {
        menu += ` 💳 (Pago online disponible)`;
      }
      menu += `\n`;
    } else if (service.basePrice > 0) {
      // Precio 0 pero tenemos sugerencia del catálogo
      menu += `   💰 Desde: $${service.basePrice} (editable en tu dashboard)\n`;
    } else {
      // Sin precio ni sugerencia
      menu += `   💰 Consultar precio\n`;
    }
    
    if (service.duration) menu += `   ⏱️ ${service.duration} min\n`;
    menu += `\n`;
  });

  menu += 'Responde con el número del servicio que deseas.';

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
