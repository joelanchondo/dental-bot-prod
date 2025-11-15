// PLANTILLA AUTOMOTRIZ
const automotiveTemplate = {
  name: "Asistente Automotriz",
  
  config: {
    businessType: "automotive",
    appointmentDuration: 120,
    icon: "🔧",
    emergencyKeywords: ["grúa", "descompuesto", "no enciende", "emergencia", "urgencia"],
    
    businessHours: {
      weekdays: "8:00 AM - 8:00 PM",
      saturday: "8:00 AM - 4:00 PM", 
      sunday: "9:00 AM - 2:00 PM"
    },
    
    defaultServices: [
      "Cambio de aceite",
      "Alineación y balanceo",
      "Reparación de frenos",
      "Servicio de transmisión",
      "Diagnóstico computarizado",
      "Lavado y detailing",
      "Reparación eléctrica",
      "Servicio de suspensión"
    ]
  },

  messages: {
    welcome: "🚗 *¡Bienvenido a {{businessName}}!* ✨\n\n🔧 *Expertos en servicio automotriz*",
    
    servicesHeader: "🔧 *Nuestros Servicios Automotrices* 🛠️",
    servicesIncluded: "💫 *Incluye:*\n• Diagnóstico computarizado\n• Garantía en servicios\n• Vehículo de cortesía\n• Limpieza interior incluida",
    
    scheduleHeader: "🕐 *Horarios de Taller* ⏰",
    
    locationHeader: "📍 *Nuestro Taller Mecánico* 🗺️",
    
    emergencyResponse: "🚨 *Emergencia Vial* 🆘\n\nServicio de grúa disponible:\n\n📞 *{{whatsappBusiness}}*\n\nAtendemos emergencias 24/7",
    
    appointment: {
      serviceSelection: "🔧 *Selecciona el servicio para tu auto:*\n\n",
      namePrompt: "✅ *{{selectedService}}*\n\nPerfecto! 🚗\n\n📝 *¿Qué modelo y año es tu auto?*\n\n_(Ejemplo: Honda Civic 2020)_",
      confirmation: "👋 *Hola {{patientName}}!*\n\n📋 *Resumen de tu servicio:*\n\n🔧 Servicio: {{selectedService}}\n🚗 Vehículo: {{vehicleInfo}}\n📅 Fecha: {{suggestedDate}}\n⏰ Hora: 9:00 AM\n📍 {{businessAddress}}\n\n*¿Confirmas esta cita?*"
    }
  },

  menu: `*¿Cómo puedo ayudarte con tu vehículo?*\n\n` +
        `1️⃣ 📅 Agendar servicio\n` +
        `2️⃣ 📋 Ver mis citas\n` +
        `3️⃣ 🔧 Servicios\n` +
        `4️⃣ 🕐 Horarios\n` +
        `5️⃣ 📍 Ubicación\n\n` +
        `_Escribe el número o lo que necesites_`,

  keywords: {
    appointment: ["cita", "servicio", "agendar", "mantenimiento", "reparar", "1"],
    services: ["servicios", "precios", "qué hacen", "mantenimiento", "3"],
    schedule: ["horario", "horarios", "cuándo", "4"], 
    location: ["ubicacion", "direccion", "dónde", "taller", "5"],
    emergency: ["emergencia", "urgente", "grúa", "descompuesto", "no enciende"]
  }
};

module.exports = automotiveTemplate;
