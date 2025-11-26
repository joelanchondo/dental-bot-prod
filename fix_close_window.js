const fs = require('fs');

let content = fs.readFileSync('routes/calendar-dashboard.js', 'utf8');

// Reemplazar función closeWindow con versión mejorada
const newCloseFunction = `function closeWindow() {
    console.log('🔒 Intentando cerrar ventana...');
    
    // Mostrar mensaje de cierre
    document.getElementById('confirmation-message').innerHTML = 
        '✅ <strong>¡Cita Confirmada!</strong><br><br>' +
        '📅 <strong>Fecha:</strong> ' + moment(selectedDate).format('DD/MM/YYYY') + ' a las ' + selectedTime + '<br>' +
        '🦷 <strong>Servicio:</strong> ' + service + '<br>' +
        '👤 <strong>Paciente:</strong> ' + clientName + '<br><br>' +
        '<strong>✅ Ya puedes cerrar esta ventana y regresar a WhatsApp</strong>';
    
    // Intentar métodos de cierre
    setTimeout(() => {
        try {
            // Método 1: Cerrar ventana si es popup
            if (window.opener && !window.opener.closed) {
                window.close();
                return;
            }
            
            // Método 2: Redirigir a WhatsApp en móvil
            if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                const cleanPhone = phone.replace(/[^0-9]/g, '');
                window.location.href = 'https://wa.me/' + cleanPhone;
                return;
            }
            
            // Método 3: Mostrar instrucciones para desktop
            document.getElementById('confirmation-message').innerHTML += 
                '<br><br><em>En desktop: Presiona Ctrl+W o cierra esta pestaña manualmente</em>';
                
        } catch (error) {
            console.log('⚠️ No se pudo cerrar automáticamente');
        }
    }, 1000);
}`;

content = content.replace(/function closeWindow\(\)[^{]*{[^}]*}/s, newCloseFunction);
fs.writeFileSync('routes/calendar-dashboard.js', content);
console.log('✅ closeWindow mejorada');
