const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from server directory
dotenv.config({ path: 'c:/Users/it001/Desktop/HEMS/server/.env' });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected...');

        const emails = [
            'sreeshanth_s@helixsynergycorp.org',
            'vyshnavi_r@helixsynergycorp.org'
        ];

        const User = mongoose.model('User', new mongoose.Schema({ email: String }), 'users');
        const Onboarding = mongoose.model('Onboarding', new mongoose.Schema({ email: String }), 'onboardings');
        
        for (const email of emails) {
            const user = await User.findOne({ email });
            const onboarding = await Onboarding.findOne({ email });
            
            if (user) {
                console.log(`FOUND user with email ${email}: ID ${user._id}`);
            } else {
                console.log(`NOT FOUND user with email ${email} in users collection`);
            }
            
            if (onboarding) {
                console.log(`FOUND onboarding record with email ${email}: ID ${onboarding._id}`);
            } else {
                console.log(`NOT FOUND onboarding record with email ${email} in onboardings collection`);
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
