/**
 * 🔐 SCRIPT: Crear SuperAdmin inicial
 * Uso: node scripts/createAdmin.js
 * Solo ejecutar UNA VEZ para el primer acceso.
 */

require('dotenv').config({ path: `${__dirname}/../.env.${process.env.NODE_ENV || 'development'}` });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_DATA = {
  email: 'admin@bot.com',      // ← cambia esto
  password: 'Admin2026seguro',        // ← cambia esto
  name: 'Joel Anchondo',               // ← tu nombre
  role: 'superadmin'
};

async function createAdmin() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado');

    // Verificar si ya existe
    const existing = await User.findOne({ email: ADMIN_DATA.email });
    if (existing) {
      console.log('⚠️  Ya existe un usuario con ese email:', ADMIN_DATA.email);
      console.log('   Role actual:', existing.role);

      // Si existe pero no es superadmin, actualizarlo
      if (existing.role !== 'superadmin') {
        existing.role = 'superadmin';
        await existing.save();
        console.log('✅ Role actualizado a superadmin');
      }
      process.exit(0);
    }

    // Crear superadmin
    const admin = new User({
      email: ADMIN_DATA.email,
      password: ADMIN_DATA.password,
      name: ADMIN_DATA.name,
      role: 'superadmin',
      isVerified: true,
      subscription: {
        plan: 'ultra',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
      }
    });

    await admin.save();

    console.log('\n✅ SuperAdmin creado exitosamente:');
    console.log('   Email:    ', ADMIN_DATA.email);
    console.log('   Password: ', ADMIN_DATA.password);
    console.log('   Role:      superadmin');
    console.log('\n🔐 Guarda estas credenciales en un lugar seguro.');
    console.log('   Luego entra en /admin o /dashboard-pro\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
