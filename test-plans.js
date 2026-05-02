require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./models/Business');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const businesses = await Business.find({}, 'businessName plan');
    const fs = require('fs');
    fs.writeFileSync('plans.txt', JSON.stringify(businesses, null, 2));
    process.exit(0);
}).catch(err => {
    require('fs').writeFileSync('plans-error.txt', String(err));
    process.exit(1);
});
