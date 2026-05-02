const fs = require('fs');
const filePath = './routes/dashboard-pro.js';

// Leer el archivo completo
let content = fs.readFileSync(filePath, 'utf8');

// =============================================
// REEMPLAZAR COMPLETAMENTE LA PESTAÑA SERVICIOS
// =============================================

// Buscar y reemplazar toda la sección de servicios
const oldServicesSection = content.match(/<div id="tab-services" class="tab-content">[\s\S]*?<\/div>\s*<\/div>/);
if (oldServicesSection) {
  const newServicesSection = `        <div id="tab-services" class="tab-content">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">🛠️ Mis Servicios - DATOS REALES</h2>
                <p class="text-gray-600 mb-6">Estos son los servicios reales de tu negocio cargados desde MongoDB.</p>

                <!-- SERVICIOS EN TIEMPO REAL -->
                <div class="mb-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">📋 Servicios Activos</h3>
                    <div id="real-services-list" class="space-y-3">
                        <div class="text-center py-8 text-gray-500">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p>Cargando servicios desde MongoDB...</p>
                        </div>
                    </div>
                </div>

                <!-- ESTADÍSTICAS EN TIEMPO REAL -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                        <div class="text-2xl font-bold text-blue-600" id="total-services">0</div>
                        <div class="text-blue-700 text-sm">Total Servicios</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                        <div class="text-2xl font-bold text-green-600" id="active-services">0</div>
                        <div class="text-green-700 text-sm">Servicios Activos</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
                        <div class="text-2xl font-bold text-purple-600" id="priced-services">0</div>
                        <div class="text-purple-700 text-sm">Con Precio > 0</div>
                    </div>
                </div>

                <!-- INFORMACIÓN -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p class="text-green-800 text-sm">✅ <strong>Datos en tiempo real:</strong> Estos servicios están almacenados en tu base de datos MongoDB y son los que verán tus clientes.</p>
                </div>
            </div>
        </div>`;

  content = content.replace(oldServicesSection[0], newServicesSection);
}

// =============================================
// AGREGAR JAVASCRIPT COMPLETO
// =============================================

// Buscar antes del initializeDashboard
if (content.includes('initializeDashboard();')) {
  const newJSCode = `
        // =============================================
        // GESTIÓN COMPLETA DE SERVICIOS - MONGODB
        // =============================================

        async function loadRealServices() {
            try {
                console.log('🔍 Cargando servicios reales para:', businessId);
                const response = await fetch(\`/api/business/\${businessId}/services\`);
                
                if (!response.ok) throw new Error('Error en la API');
                const services = await response.json();
                
                console.log('✅ Servicios cargados:', services.length, 'servicios');
                renderServices(services);
                updateStats(services);
                
            } catch (error) {
                console.error('❌ Error:', error);
                document.getElementById('real-services-list').innerHTML = \`
                    <div class="text-center py-8 text-red-500">
                        <div class="text-4xl mb-2">⚠️</div>
                        <p>Error cargando servicios</p>
                        <p class="text-sm">\${error.message}</p>
                    </div>
                \`;
            }
        }

        function renderServices(services) {
            const container = document.getElementById('real-services-list');
            
            if (!services || services.length === 0) {
                container.innerHTML = \`
                    <div class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-2">📝</div>
                        <p>No hay servicios configurados</p>
                        <p class="text-sm">Se cargan automáticamente al crear el negocio</p>
                    </div>
                \`;
                return;
            }

            container.innerHTML = services.map(service => \`
                <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition duration-200 bg-white">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <span class="font-bold text-gray-800">\${service.name}</span>
                            \${service.active ? 
                                '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">✅ Activo</span>' : 
                                '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">❌ Inactivo</span>'
                            }
                        </div>
                        <div class="text-sm text-gray-600 space-y-1">
                            <div class="flex space-x-4">
                                <span>⏱️ \${service.duration || 30} min</span>
                                <span>📂 \${service.category || 'General'}</span>
                            </div>
                            <div class="\${service.price > 0 ? 'text-green-600 font-bold' : 'text-orange-500'}">
                                \${service.price > 0 ? 
                                    \`💰 $\${service.price} MXN\` : 
                                    '💲 PRECIO POR DEFINIR'
                                }
                            </div>
                        </div>
                    </div>
                    <div class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        \${service.customService ? '🛠️ Personalizado' : '📚 Del catálogo'}
                    </div>
                </div>
            \`).join('');
        }

        function updateStats(services) {
            const total = services.length;
            const active = services.filter(s => s.active).length;
            const priced = services.filter(s => s.price > 0).length;
            
            document.getElementById('total-services').textContent = total;
            document.getElementById('active-services').textContent = active;
            document.getElementById('priced-services').textContent = priced;
        }

        // Cargar automáticamente al mostrar la pestaña
        document.addEventListener('DOMContentLoaded', function() {
            document.addEventListener('tabChanged', function(event) {
                if (event.detail.tab === 'services') {
                    console.log('🔄 Cargando servicios para pestaña activa');
                    loadRealServices();
                }
            });
        });

        initializeDashboard();`;

  content = content.replace('initializeDashboard();', newJSCode);
}

// Guardar
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 🚀 PASO 2 COMPLETO - Dashboard con gestión COMPLETA de servicios MongoDB');
console.log('🎯 Características implementadas:');
console.log('   📊 Carga en tiempo real desde MongoDB');
console.log('   📈 Estadísticas automáticas');
console.log('   🎨 Interfaz profesional completa');
console.log('   🔄 Actualización automática');
console.log('   ⚡ Manejo robusto de errores');
