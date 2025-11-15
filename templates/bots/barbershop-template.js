// PLANTILLA BARBERSHOP
const barbershopTemplate = {
  name: "Asistente Barbería",
  
  config: {
    businessType: "barbershop",
    appointmentDuration: 45,
    icon: "💈",
    emergencyKeywords: ["urgente", "evento", "especial"],
    
    businessHours: {
      weekdays: "10:00 AM - 8:00 PM",
      saturday: "9:00 AM - 6:00 PM", 
      sunday: "11:00 AM - 4:00 PM"
    },
    
    defaultServices: [
      "Corte de cabello",
      "Afeitado clásico",
      "Corte y barba",
      "Arreglo de barba",
      "Tinte de cabello",
      "Mascarilla facial",
      "Servicio premium",
      "Corte infantil"
    ]
  },

  messages: {
    welcome: "💈 *¡Bienvenido a {{businessName}}!* ✨\n\n✂️ *Tu estilo, nuestra especialidad*",
    
    servicesHeader: "💈 *Nuestros Servicios de Barbería* ✂️",
    servicesIncluded: "💫 *Incluye:*\n• Consulta de estilo\n• Productos premium\n• Ajuste de barba incluido\n• Terminación con productos",
    
    scheduleHeader: "🕐 *Horarios de Barbería* ⏰",
    
    locationHeader: "📍 *Nuestra Barbería* 🗺️",
    
    emergencyResponse: "💈 *Servicio Express*\n\nPara cortes urgentes o eventos:\n\n📞 *{{whatsappBusiness}}*\n\nTe atendemos prioritariamente",
    
    appointment: {
      serviceSelection: "💈 *Selecciona tu servicio:*\n\n",
      namePrompt: "✅ *{{selectedService}}*\n\nExcelente estilo! ✂️\n\n👤 *¿Cuál es tu nombre completo?*\n\n_(Ejemplo: Carlos Rodríguez)_",
      confirmation: "👋 *Hola {{patientName}}!*\n\n📋 *Resumen de tu reserva:*\n\n💈 Servicio: {{selectedService}}\n📅 Fecha: {{suggestedDate}}\n⏰ Hora: 4:00 PM\n📍 {{businessAddress}}\n\n*¿Confirmas tu cita de barbería?*"
    }
  },

  menu: `*¿En qué puedo ayudarte con tu estilo?*\n\n` +
        `1️⃣ 📅 Agendar cita\n` +
        `2️⃣ 📋 Ver mis reservas\n` +
        `3️⃣ 💈 Servicios\n` +
        `4️⃣ 🕐 Horarios\n` +
        `5️⃣ 📍 Ubicación\n\n` +
        `_Escribe el número o lo que necesites_`,

  keywords: {
    appointment: ["cita", "reservar", "agendar", "corte", "afeitado", "1"],
    services: ["servicios", "precios", "qué hacen", "cortes", "3"],
    schedule: ["horario", "horarios", "cuándo", "4"], 
    location: ["ubicacion", "direccion", "dónde", "barbería", "5"],
    emergency: ["urgente", "evento", "especial", "fiesta", "bodas"]
  }
};

module.exports = barbershopTemplate;
