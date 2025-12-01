const Business = require('../models/Business');

/**
 * Obtiene un negocio y sus servicios activos
 */
const getBusiness = async (businessId) => {
  return await Business.findById(businessId).select('services businessName slug');
};

/**
 * Genera el menú de servicios para WhatsApp
 */
const generateServiceMenu = (business) => {
  let menu = `*${business.businessName}*\n\nServicios disponibles:\n\n`;

  const activeServices = business.services.filter(s => s.active);

  if (activeServices.length === 0) {
    return menu + 'No hay servicios disponibles en este momento.';
  }

  activeServices.forEach((service, index) => {
    menu += `${index + 1}. *${service.name}*\n`;
    if (service.description) menu += `   ${service.description}\n`;
    menu += `   💰 $${service.price}\n`;
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

module.exports = {
  getBusiness,
  generateServiceMenu,
  getServiceByIndex
};
