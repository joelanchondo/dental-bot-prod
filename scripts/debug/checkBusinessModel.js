const mongoose = require('mongoose');
require('dotenv').config();

async function checkBusinessModel() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Business = require('./models/Business');
    console.log('📋 Campos del modelo Business:');
    console.log(Object.keys(Business.schema.paths));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBusinessModel();
