const mongoose = require('mongoose');
require('dotenv').config();

async function checkBusinessStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Business = require('./models/Business');
    
    // Buscar por diferentes estados
    const active = await Business.countDocuments({ status: 'active' });
    const inactive = await Business.countDocuments({ status: 'inactive' });
    const suspended = await Business.countDocuments({ status: 'suspended' });
    const all = await Business.countDocuments({});
    
    console.log('📊 Negocios por estado:');
    console.log(`✅ Activos: ${active}`);
    console.log(`⏸️ Inactivos: ${inactive}`);
    console.log(`🚫 Suspendidos: ${suspended}`);
    console.log(`📈 Total: ${all}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBusinessStatus();
