// Simulamos la situación
const business = { services: undefined };
const businessServices = business.services || [];
console.log("businessServices:", businessServices);
console.log("businessServices.length:", businessServices.length);
console.log("Template result:", `Total: ${businessServices.length}`);
