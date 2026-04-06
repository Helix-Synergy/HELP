const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: 'c:/Users/it001/Desktop/HEMS/server/.env' });

const purgeRecords = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in .env');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for final purge...');

        const emails = [
            'sreeshanth_s@helixsynergycorp.org',
            'vyshnavi_r@helixsynergycorp.org'
        ];

        // Access collections directly to avoid model registration issues
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log('Available collections:', collectionNames.join(', '));

        const targetCollections = ['users', 'onboardingdetails', 'onboardings'];
        
        for (const email of emails) {
            console.log(`\n--- Processing: ${email} ---`);
            
            for (const collName of targetCollections) {
                if (collectionNames.includes(collName)) {
                    const coll = mongoose.connection.db.collection(collName);
                    const result = await coll.deleteMany({ email });
                    console.log(`Deleted ${result.deletedCount} records from '${collName}'`);
                }
            }
        }

        console.log('\n--- Checking for potential Employee ID conflicts ---');
        const User = mongoose.connection.db.collection('users');
        const count = await User.countDocuments();
        const nextId = `HEMS-${(count + 1).toString().padStart(4, '0')}`;
        console.log(`Total users: ${count}`);
        console.log(`Next generated ID will be: ${nextId}`);
        
        const existingWithNextId = await User.findOne({ employeeId: nextId });
        if (existingWithNextId) {
            console.log(`ALERT: ${nextId} ALREADY EXISTS. This is likely the cause of the duplicate error.`);
            console.log('Finding all employeeIds to identify gaps...');
            const allUsers = await User.find({}, { projection: { employeeId: 1 } }).toArray();
            const ids = allUsers.map(u => u.employeeId).sort();
            console.log('Current IDs in DB:', ids.join(', '));
        }

        console.log('\nPurge complete. If an ID conflict was found, we may need to adjust the ID generation logic.');
        process.exit();
    } catch (err) {
        console.error('Purge failed:', err);
        process.exit(1);
    }
};

purgeRecords();
