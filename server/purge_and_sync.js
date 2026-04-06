const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: 'c:/Users/it001/Desktop/HEMS/server/.env' });

const purgeAndSync = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in .env');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for final purge and ID sync...');

        const emails = [
            'sreeshanth_s@helixsynergycorp.org',
            'vyshnavi_r@helixsynergycorp.org'
        ];

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        const targetCollections = ['users', 'onboardingdetails', 'onboardings'];
        
        for (const email of emails) {
            console.log(`\n--- Purging: ${email} ---`);
            for (const collName of targetCollections) {
                if (collectionNames.includes(collName)) {
                    const coll = db.collection(collName);
                    const result = await coll.deleteMany({ email });
                    console.log(`Deleted ${result.deletedCount} from '${collName}'`);
                }
            }
        }

        console.log('\n--- Auditing Employee IDs ---');
        const User = db.collection('users');
        
        // Find ALL current employeeIds to detect the true sequence
        const allUsers = await User.find({}, { projection: { employeeId: 1 } }).toArray();
        const ids = allUsers
            .map(u => u.employeeId)
            .filter(id => id && id.startsWith('HEMS-'))
            .map(id => parseInt(id.replace('HEMS-', '')))
            .sort((a, b) => a - b);

        console.log('Current HEMS ID sequence:', ids.length > 0 ? ids.join(', ') : 'None');
        
        const currentCountInDB = await User.countDocuments();
        const nextIdCandidate = `HEMS-${(currentCountInDB + 1).toString().padStart(4, '0')}`;
        
        const conflict = await User.findOne({ employeeId: nextIdCandidate });
        if (conflict) {
            console.log(`\n[CONFLICT DETECTED] Next ID ${nextIdCandidate} already exists in DB!`);
            const maxId = ids.length > 0 ? Math.max(...ids) : 0;
            console.log(`The highest existing ID is HEMS-${maxId.toString().padStart(4, '0')}.`);
            console.log(`RECOMMENDATION: If registration still fails, we must update users.js to use Date.now() or a random string for IDs instead of pure count.`);
        } else {
            console.log(`\n[CLEAN] Next ID ${nextIdCandidate} is available.`);
        }

        console.log('\nPurge and Sync complete.');
        process.exit();
    } catch (err) {
        console.error('Task failed:', err);
        process.exit(1);
    }
};

purgeAndSync();
