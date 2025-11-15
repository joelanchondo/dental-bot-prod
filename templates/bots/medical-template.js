// PLANTILLA MÉDICA (fallback)
const medicalTemplate = {
  name: "Asistente Médico",
  
  config: {
    businessType: "medical",
    appointmentDuration: 30,
    icon: "🏥",
    emergencyKeywords: ["emergencia", "urgente", "dolor", "fiebre", "accidente"],
    
    businessHours: {
      weekdays: "9:00 AM - 7:00 PM",
      saturday: "9:00 AM - 2:00 PM", 
      sunday: "Urgencias solamente"
    },
    
    defaultServices: [
      "Consulta general",
      "Chequeo anual",
      "Vacunación",
      "Control prenatal",
      "Dermatología",
      "Pediatría",
      "Ginecología",
      "Medicina interna"
    ]
  },

  messages: {
    welcome: "🏥 *¡Bienvenido a {{businessName}}!* ✨\n\n👨‍⚕️ *Tu salud es nuestra prioridad*",
    
    servicesHeader: "🏥 *Nuestros Servicios Médicos* 👩‍⚕️",
    
    emergencyResponse: "🚨 *Emergencia Médica* 🆘\n\nSi es una emergencia médica:\n\n📞 *{{whatsappBusiness}}*\n\nO acude al hospital más cercano",
  },

  menu: `*¿En qué puedo ayudarte con tu salud?*\n\n` +
        `1️⃣ 📅 Agendar consulta\n` +
        `2️⃣ 📋 Ver mis citas\n` +
        `3️⃣ 🏥 Servicios\n` +
        `4️⃣ 🕐 Horarios\n` +
        `5️⃣ 📍 Ubicación\n\n` +
        `_Escribe el número o lo que necesites_`,

  keywords: {
    appointment: ["consulta", "cita", "agendar", "médico", "doctor", "1"],
    services: ["servicios", "especialidades", "qué hacen", "3"],
    schedule: ["horario", "horarios", "cuándo", "4"], 
    location: ["ubicacion", "direccion", "dónde", "consultorio", "5"],
    emergency: ["emergencia", "urgente", "dolor", "fiebre", "accidente"]
  }
};

module.exports = medicalTemplate;
