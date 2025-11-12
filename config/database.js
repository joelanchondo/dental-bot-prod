const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Usar la URI directamente con el carácter escapado
    const uri = 'mongodb+srv://joelanchondo_db_user:Bubu2516!@dental-bot.1xcbxyh.mongodb.net/dental-bot?retryWrites=true&w=majority&appName=dental-bot';
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Atlas conectado');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
