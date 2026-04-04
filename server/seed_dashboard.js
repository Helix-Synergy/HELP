const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Holiday = require('./models/Holiday');
const Announcement = require('./models/Announcement');
const Event = require('./models/Event');
const User = require('./models/User');

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // 1. Seed Holiday
        const holidayCount = await Holiday.countDocuments();
        if (holidayCount === 0) {
            await Holiday.create({
                name: 'Good Friday',
                date: new Date('2026-04-18'),
                type: 'NATIONAL',
                description: 'Public holiday'
            });
            console.log('Seed: Holiday created.');
        }

        // 2. Seed Announcement
        const announcementCount = await Announcement.countDocuments();
        if (announcementCount === 0) {
            const admin = await User.findOne({ role: 'SUPER_ADMIN' });
            if (admin) {
                await Announcement.create({
                    title: 'New Office Policy',
                    content: 'Please note the updated guidelines for hybrid working starting next week.',
                    priority: 'HIGH',
                    author: admin._id
                });
                console.log('Seed: Announcement created.');
            }
        }

        // 3. Seed Event
        const eventCount = await Event.countDocuments();
        if (eventCount === 0) {
            await Event.create({
                title: 'Monthly Townhall',
                date: new Date('2026-04-25T10:00:00Z'),
                description: 'Company-wide meeting at 10 AM',
                location: 'Main Conference Room'
            });
            console.log('Seed: Event created.');
        }

        console.log('Seeding complete!');
        process.exit();
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seed();
