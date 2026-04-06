const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars - using absolute path to be safe
dotenv.config({ path: 'c:/Users/it001/Desktop/HEMS/server/.env' });

const purgeRecords = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in .env');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for purging...');

        const emails = [
            'sreeshanth_s@helixsynergycorp.org',
            'vyshnavi_r@helixsynergycorp.org'
        ];

        // Define schemas briefly for deletion
        const User = mongoose.connection.collection('users');
        const Onboarding = mongoose.connection.collection('onboardings');
        
        for (const email of emails) {
            console.log(`\nProcessing: ${email}`);
            
            const userDeleteResult = await User.deleteMany({ email });
            console.log(`Deleted ${userDeleteResult.deletedCount} records from users collection`);

            const onboardingDeleteResult = await Onboarding.deleteMany({ email });
            console.log(`Deleted ${onboardingDeleteResult.deletedCount} records from onboardings collection`);
        }

        console.log('\nPurge complete. You should now be able to add these employees again.');
        process.exit();
    } catch (err) {
        console.error('Purge failed:', err);
        process.exit(1);
    }
};

purgeRecords();
