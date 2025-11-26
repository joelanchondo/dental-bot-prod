const fs = require('fs');

let content = fs.readFileSync('routes/calendar-dashboard.js', 'utf8');

// Reemplazar la función closeWindow
const newCloseFunction = `function closeWindow() {
  // Intentar cerrar ventana automáticamente
  setTimeout(() => {
    try {
      if (window.opener) {
        window.close();
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        // Redirigir a WhatsApp
        window.location.href = 'https://wa.me/' + phone.replace(/[^0-9]/g, '');
      }
    } catch (error) {
      console.log('No se pudo cerrar automáticamente');
    }
  }, 2000); // Esperar 2 segundos antes de cerrar
  
  // Mostrar mensaje inmediato
  document.getElementById('confirmation-message').innerHTML = 
    '✅ <strong>Cita confirmada exitosamente!</strong><br><br>' +
    '📅 <strong>Fecha:</strong> ' + moment(selectedDate).format('DD/MM/YYYY') + ' a las ' + selectedTime + '<br>' +
    '🦷 <strong>Servicio:</strong> ' + service + '<br>' +
    '👤 <strong>Paciente:</strong> ' + clientName + '<br><br>' +
    'La ventana se cerrará automáticamente...';
}`;

content = content.replace(/function closeWindow\(\)[^{]*{[^}]*}/s, newCloseFunction);
fs.writeFileSync('routes/calendar-dashboard.js', content);
console.log('✅ Función closeWindow mejorada');
