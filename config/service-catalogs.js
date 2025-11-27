// 🎯 CATÁLOGOS MAESTROS DE SERVICIOS POR INDUSTRIA
const serviceCatalogs = {
  // 🏥 MÉDICO
  medical: [
    { name: "Consulta General", basePrice: 500, duration: 30, category: "consultas" },
    { name: "Consulta Especialidad", basePrice: 800, duration: 45, category: "consultas" },
    { name: "Estudios de Laboratorio", basePrice: 1200, duration: 60, category: "estudios" },
    { name: "Rayos X", basePrice: 600, duration: 30, category: "estudios" },
    { name: "Ultrasonido", basePrice: 1500, duration: 45, category: "estudios" },
    { name: "Vacunación", basePrice: 300, duration: 15, category: "procedimientos" },
    { name: "Curaciones", basePrice: 400, duration: 20, category: "procedimientos" },
    { name: "Inyecciones", basePrice: 200, duration: 10, category: "procedimientos" },
    { name: "Revisión Prenatal", basePrice: 600, duration: 40, category: "especialidades" },
    { name: "Control de Diabetes", basePrice: 500, duration: 30, category: "especialidades" }
  ],

  // 🦷 DENTAL
  dental: [
    { name: "Limpieza Dental", basePrice: 600, duration: 45, category: "preventivo" },
    { name: "Consulta de Valoración", basePrice: 300, duration: 30, category: "consultas" },
    { name: "Extracción Dental", basePrice: 800, duration: 40, category: "cirugias" },
    { name: "Resina Dental", basePrice: 500, duration: 50, category: "restauraciones" },
    { name: "Blanqueamiento Dental", basePrice: 2000, duration: 60, category: "esteticos" },
    { name: "Calza/Amalgama", basePrice: 700, duration: 55, category: "restauraciones" },
    { name: "Corona Dental", basePrice: 2500, duration: 90, category: "protesis" },
    { name: "Limpieza Profunda", basePrice: 1200, duration: 60, category: "preventivo" },
    { name: "Ortodoncia/Consulta", basePrice: 800, duration: 40, category: "ortodoncia" },
    { name: "Urgencia Dental", basePrice: 1000, duration: 30, category: "emergencias" }
  ],

  // 💆 SPA & SALUD
  spa: [
    { name: "Masaje Relajante", basePrice: 600, duration: 60, category: "masajes" },
    { name: "Masaje Descontracturante", basePrice: 800, duration: 60, category: "masajes" },
    { name: "Facial de Limpieza", basePrice: 500, duration: 45, category: "faciales" },
    { name: "Tratamiento Anti-Acne", basePrice: 700, duration: 50, category: "faciales" },
    { name: "Depilación Cera", basePrice: 300, duration: 30, category: "depilacion" },
    { name: "Pedicure Spa", basePrice: 400, duration: 60, category: "pies_manos" },
    { name: "Manicure Spa", basePrice: 350, duration: 45, category: "pies_manos" },
    { name: "Exfoliación Corporal", basePrice: 600, duration: 40, category: "corporales" },
    { name: "Tratamiento Reductor", basePrice: 900, duration: 70, category: "corporales" },
    { name: "Paquete Spa Completo", basePrice: 1800, duration: 120, category: "paquetes" }
  ],

  // 💅 UÑAS & BELLEZA
  nails: [
    { name: "Manicure Básico", basePrice: 150, duration: 40, category: "manos" },
    { name: "Pedicure Básico", basePrice: 200, duration: 50, category: "pies" },
    { name: "Uñas Acrílicas", basePrice: 400, duration: 90, category: "esculpidas" },
    { name: "Uñas de Gel", basePrice: 350, duration: 80, category: "esculpidas" },
    { name: "Retoque de Acrílicas", basePrice: 250, duration: 60, category: "mantenimiento" },
    { name: "Retoque de Gel", basePrice: 220, duration: 55, category: "mantenimiento" },
    { name: "Decoración de Uñas", basePrice: 100, duration: 20, category: "decoracion" },
    { name: "Esmaltado Semi-Permanente", basePrice: 180, duration: 45, category: "esmaltado" },
    { name: "Paquete Manos + Pies", basePrice: 300, duration: 80, category: "paquetes" },
    { name: "Limpieza Profunda", basePrice: 120, duration: 25, category: "limpieza" }
  ],

  // 💈 BARBERS
  barbershop: [
    { name: "Corte de Cabello", basePrice: 150, duration: 30, category: "cortes" },
    { name: "Arreglo de Barba", basePrice: 100, duration: 20, category: "barba" },
    { name: "Corte + Barba", basePrice: 220, duration: 45, category: "combo" },
    { name: "Afeitado Clásico", basePrice: 120, duration: 25, category: "barba" },
    { name: "Tinte de Cabello", basePrice: 300, duration: 60, category: "color" },
    { name: "Mechas/Canaletas", basePrice: 400, duration: 90, category: "color" },
    { name: "Tratamiento Capilar", basePrice: 200, duration: 30, category: "tratamientos" },
    { name: "Corte Infantil", basePrice: 120, duration: 25, category: "cortes" },
    { name: "Corte + Tinte", basePrice: 400, duration: 75, category: "combo" },
    { name: "Servicio VIP Completo", basePrice: 500, duration: 120, category: "premium" }
  ],

  // 🚗 SERVICIO MECÁNICO
  automotive: [
    { name: "Cambio de Aceite", basePrice: 300, duration: 30, category: "mantenimiento" },
    { name: "Afinación Mayor", basePrice: 1200, duration: 120, category: "motor" },
    { name: "Afinación Menor", basePrice: 800, duration: 60, category: "motor" },
    { name: "Cambio de Frenos", basePrice: 900, duration: 90, category: "frenos" },
    { name: "Alineación y Balanceo", basePrice: 600, duration: 60, category: "suspension" },
    { name: "Cambio de Batería", basePrice: 500, duration: 20, category: "electrico" },
    { name: "Diagnóstico Computarizado", basePrice: 400, duration: 30, category: "diagnostico" },
    { name: "Reparación de Transmisión", basePrice: 2500, duration: 180, category: "transmision" },
    { name: "Servicio de Clutch", basePrice: 1500, duration: 120, category: "transmision" },
    { name: "Reparación Eléctrica", basePrice: 700, duration: 60, category: "electrico" }
  ],

  // 🍕 COMIDA
  food: [
    { name: "Consulta Nutricional", basePrice: 500, duration: 45, category: "nutricion" },
    { name: "Plan Alimenticio Personalizado", basePrice: 800, duration: 60, category: "nutricion" },
    { name: "Asesoría en Dietas", basePrice: 400, duration: 30, category: "nutricion" },
    { name: "Control de Peso", basePrice: 600, duration: 40, category: "seguimiento" },
    { name: "Plan para Deportistas", basePrice: 900, duration: 60, category: "especializados" },
    { name: "Asesoría Vegana/Vegetariana", basePrice: 500, duration: 45, category: "especializados" },
    { name: "Plan Familiar", basePrice: 1200, duration: 75, category: "familia" },
    { name: "Consulta Pediátrica", basePrice: 600, duration: 40, category: "pediatria" },
    { name: "Seguimiento Mensual", basePrice: 300, duration: 25, category: "seguimiento" },
    { name: "Taller de Alimentación Saludable", basePrice: 1000, duration: 90, category: "talleres" }
  ]
};

module.exports = serviceCatalogs;
