const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Holiday = require('./models/Holiday');

dotenv.config();

const seedHolidays = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hems');
        
        const holidays = [
            { name: 'Good Friday', date: new Date('2026-03-30'), type: 'NATIONAL' },
            { name: 'Labor Day', date: new Date('2026-05-01'), type: 'NATIONAL' },
            { name: 'Independence Day', date: new Date('2026-08-15'), type: 'NATIONAL' },
            { name: 'Diwali', date: new Date('2026-10-21'), type: 'NATIONAL' }
        ];

        for (const h of holidays) {
            await Holiday.findOneAndUpdate({ date: h.date }, h, { upsert: true });
        }

        console.log('Holidays seeded successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedHolidays();
