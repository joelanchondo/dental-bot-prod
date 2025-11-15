// PLANTILLA DENTAL MEJORADA
const dentalTemplate = {
  name: "Asistente Dental",
  
  // CONFIGURACIÓN ESPECÍFICA PARA DENTAL
  config: {
    businessType: "dental",
    appointmentDuration: 60,
    icon: "🦷",
    emergencyKeywords: ["dolor", "urgente", "emergencia", "duele", "hinchado", "sangrado"],
    
    // Horarios específicos para dental
    businessHours: {
      weekdays: "9:00 AM - 6:00 PM",
      saturday: "9:00 AM - 2:00 PM", 
      sunday: "Cerrado"
    },
    
    // Servicios específicos de dental (se mezclan con los del negocio)
    defaultServices: [
      "Limpieza dental",
      "Extracción dental", 
      "Blanqueamiento",
      "Ortodoncia consulta",
      "Endodoncia",
      "Implantes dentales",
      "Coronas y puentes",
      "Prótesis dental"
    ]
  },

  // MENSAJES ESPECÍFICOS PARA DENTAL
  messages: {
    welcome: "👋 *¡Bienvenido a {{businessName}}!* ✨\n\n🦷 *Tu sonrisa es nuestra prioridad*",
    
    servicesHeader: "🏥 *Nuestros Servicios Dentales* ✨",
    servicesIncluded: "💫 *Incluye:*\n• Consulta de evaluación\n• Plan de tratamiento personalizado\n• Seguimiento post-tratamiento",
    
    scheduleHeader: "🕐 *Horarios de Atención Dental* ⏰",
    
    locationHeader: "📍 *Nuestra Clínica Dental* 🗺️",
    
    emergencyResponse: "🚨 *Emergencia Dental* 🆘\n\nSi tienes dolor intenso, hinchazón o sangrado:\n\n📞 *{{whatsappBusiness}}*\n\nAtendemos emergencias dentales inmediatas",
    
    // Mensajes específicos del flujo de cita
    appointment: {
      serviceSelection: "🦷 *Selecciona tu tratamiento dental:*\n\n",
      namePrompt: "✅ *{{selectedService}}*\n\nExcelente elección para tu salud dental! 😊\n\n👤 *¿Cuál es tu nombre completo?*\n\n_(Ejemplo: María González López)_",
      confirmation: "👋 *Hola {{patientName}}!*\n\n📋 *Resumen de tu consulta dental:*\n\n🦷 Tratamiento: {{selectedService}}\n📅 Fecha: {{suggestedDate}}\n⏰ Hora: 10:00 AM\n📍 {{businessAddress}}\n\n*¿Confirmas tu cita dental?*"
    },
    
    confirmedAppointment: `🎉 *¡Consulta Dental Confirmada!*

✅ Tu cita está agendada en nuestra clínica

📋 *Detalles de tu tratamiento:*
👤 {{patientName}}
🦷 {{selectedService}}
📅 {{suggestedDate}}
⏰ 10:00 AM
📍 {{businessAddress}}

📞 Contacto: {{whatsappBusiness}}

*Recomendaciones para tu visita:*
• Llega 10 min antes ⏱️
• Trae estudios previos si los tienes 📋
• Evita comer 2 horas antes si es limpieza 🍽️

Te enviaremos recordatorios de tu cita dental 🔔

¡Cuidamos tu sonrisa! 😊`
  },

  // MENÚ PRINCIPAL ESPECÍFICO PARA DENTAL
  menu: `*¿En qué puedo ayudarte con tu salud dental?*\n\n` +
        `1️⃣ 📅 Agendar consulta dental\n` +
        `2️⃣ 📋 Ver mis citas programadas\n` + 
        `3️⃣ 🏥 Conocer tratamientos\n` +
        `4️⃣ 🕐 Horarios de atención\n` +
        `5️⃣ 📍 Ubicación de la clínica\n\n` +
        `_Escribe el número o lo que necesites_`,

  // PALABRAS CLAVE ESPECÍFICAS PARA DENTAL
  keywords: {
    appointment: ["consulta", "cita", "agendar", "dental", "tratamiento", "limpieza", "ortodoncia", "blanqueamiento", "1"],
    services: ["servicios", "tratamientos", "qué hacen", "precios", "3"],
    schedule: ["horario", "horarios", "cuándo", "4"], 
    location: ["ubicacion", "direccion", "dónde", "clínica", "5"],
    emergency: ["emergencia", "urgente", "dolor", "duele", "hinchado", "sangrado"]
  }
};

module.exports = dentalTemplate;
