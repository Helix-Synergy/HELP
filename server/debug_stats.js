const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/it001/Desktop/HELP/server/.env' });

const User = require('c:/Users/it001/Desktop/HELP/server/models/User');
const Attendance = require('c:/Users/it001/Desktop/HELP/server/models/Attendance');
const LeaveRequest = require('c:/Users/it001/Desktop/HELP/server/models/LeaveRequest');

async function testStats() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const totalEmployees = await User.countDocuments({ status: { $ne: 'INACTIVE' } });
    const presentToday = await Attendance.countDocuments({
        date: { $gte: startOfToday, $lte: endOfToday },
        status: { $in: ['PRESENT', 'LATE', 'HALF_DAY', 'REGULARIZED'] }
    });

    console.log('--- DB STATS ---');
    console.log('Total:', totalEmployees);
    console.log('Present Today:', presentToday);
    
    const recentAtt = await Attendance.find().sort({ date: -1 }).limit(10);
    console.log('Recent attendance records:', recentAtt.length);
    if (recentAtt.length > 0) {
        console.log('Latest record date:', recentAtt[0].date);
        console.log('Latest record status:', recentAtt[0].status);
    }
    
    process.exit();
}

testStats();
