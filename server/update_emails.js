const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hems')
    .then(async () => {
        const users = await User.find({ email: /@helix\.com$/ });
        let count = 0;
        for (let user of users) {
            const newEmail = user.email.replace('@helix.com', '@octacrest.com');
            await User.updateOne({ _id: user._id }, { $set: { email: newEmail } });
            count++;
        }
        console.log(`Updated ${count} users to use @octacrest.com`);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
