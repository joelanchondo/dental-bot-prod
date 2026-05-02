require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Business = require('../models/Business');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const email = 'pro-test@bot.com';
        const password = await bcrypt.hash('Pro2026', 10);
        
        let business = await Business.findOne({ slug: 'pro-test' });
        if (!business) {
            business = new Business({
                businessName: 'Clínica Pro Test',
                slug: 'pro-test',
                businessType: 'medical',
                plan: 'pro',
                subscriptionStatus: 'active',
                whatsapp: {
                    number: '+14155238886',
                    isActive: true
                }
            });
            await business.save();
        } else {
            business.plan = 'pro';
            business.subscriptionStatus = 'active';
            await business.save();
        }

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                name: 'Dr. Pro Test',
                email: email,
                password: password,
                role: 'owner',
                businessId: business._id,
                subscription: { plan: 'pro', status: 'active' }
            });
            await user.save();
            console.log('✅ Usuario PRO creado exitosamente:');
            console.log('   Email: pro-test@bot.com');
            console.log('   Pass:  Pro2026');
            console.log('   Slug:  pro-test');
        } else {
            console.log('⚠️ El usuario ya existe. Credenciales: pro-test@bot.com / Pro2026');
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
});
