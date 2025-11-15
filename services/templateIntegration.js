const dentalTemplate = require('../templates/bots/dental-template');
const automotiveTemplate = require('../templates/bots/automotive-template');
const barbershopTemplate = require('../templates/bots/barbershop-template');

class TemplateIntegration {
  static getBusinessConfig(business) {
    const template = this.getTemplate(business.businessType);
    return {
      ...business,
      templateConfig: template.config,
      templateMessages: template.messages,
      templateKeywords: template.keywords
    };
  }

  static getTemplate(businessType) {
    const templates = {
      dental: dentalTemplate,
      automotive: automotiveTemplate,
      barbershop: barbershopTemplate
    };
    return templates[businessType] || dentalTemplate;
  }

  // ESTA FUNCIÓN SE INTEGRA CON TU BOT ACTUAL
  static enhanceBotResponse(business, message, currentResponse) {
    const template = this.getTemplate(business.businessType);
    const msg = message.toLowerCase().trim();

    // 1. DETECTAR PALABRAS CLAVE ESPECÍFICAS
    for (let category in template.keywords) {
      if (template.keywords[category].some(keyword => msg.includes(keyword))) {
        
        // 2. MEJORAR LA RESPUESTA SEGÚN EL TIPO DE NEGOCIO
        switch(category) {
          case 'appointment':
            return this.enhanceAppointmentFlow(template, business, currentResponse);
          
          case 'services':
            return this.enhanceServicesResponse(template, business, currentResponse);
          
          case 'emergency':
            return template.messages.emergencyResponse.replace('{{whatsappBusiness}}', business.whatsappBusiness);
          
          default:
            return currentResponse;
        }
      }
    }

    // 3. MEJORAR MENÚ PRINCIPAL
    if (currentResponse.includes('¿Cómo puedo ayudarte?')) {
      return template.menu;
    }

    // 4. MEJORAR BIENVENIDA
    if (currentResponse.includes('¡Bienvenido')) {
      return template.messages.welcome.replace('{{businessName}}', business.businessName) + 
             '\\n\\n' + template.menu;
    }

    return currentResponse;
  }

  static enhanceAppointmentFlow(template, business, currentResponse) {
    // Aquí integras los mensajes específicos del template
    // con tu lógica existente de flujo de citas
    
    if (currentResponse.includes('Selecciona tu servicio')) {
      return template.messages.appointment.serviceSelection + currentResponse;
    }

    if (currentResponse.includes('Excelente elección')) {
      return template.messages.appointment.namePrompt;
    }

    if (currentResponse.includes('Resumen de tu cita')) {
      return template.messages.appointment.confirmation;
    }

    return currentResponse;
  }

  static enhanceServicesResponse(template, business, currentResponse) {
    return template.messages.servicesHeader + '\\n\\n' + 
           currentResponse + '\\n\\n' +
           template.messages.servicesIncluded;
  }

  // FUNCIÓN PARA MEJORAR LOS SERVICIOS DEL NEGOCIO
  static enhanceBusinessServices(business) {
    const template = this.getTemplate(business.businessType);
    
    // Si el negocio no tiene servicios, usar los del template
    if (!business.services || business.services.length === 0) {
      return template.config.defaultServices;
    }

    // Mezclar servicios existentes con servicios default del template
    const existingServices = business.services.map(s => 
      typeof s === 'string' ? s : s.name
    );
    
    const allServices = [...new Set([...existingServices, ...template.config.defaultServices])];
    return allServices;
  }
}

module.exports = TemplateIntegration;
