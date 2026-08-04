const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Password123', salt);
    await mongoose.connection.collection('users').updateOne({ email: 'admin@octacrest.com' }, { $set: { password: hash } });
    console.log('Password reset to Password123');
    process.exit(0);
});
