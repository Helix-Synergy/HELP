const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./server/models/User');
const Attendance = require('./server/models/Attendance');
const LeaveRequest = require('./server/models/LeaveRequest');
const Timesheet = require('./server/models/Timesheet');

dotenv.config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hems');
        console.log('Connected to MongoDB');

        // Find Surya Manager
        const manager = await User.findOne({ email: 'surya@helix.com' });
        if (!manager) {
            console.log('Manager Surya not found');
            return;
        }
        console.log('Manager Surya ID:', manager._id);

        // Find team members
        const team = await User.find({ managerId: manager._id });
        console.log('Team members count:', team.length);
        team.forEach(u => console.log(` - ${u.firstName} ${u.lastName} (${u._id}) Status: ${u.status}`));

        const teamIds = team.map(u => u._id);

        // Check attendance today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const attendance = await Attendance.find({
            user: { $in: teamIds },
            date: { $gte: startOfToday, $lte: endOfToday }
        });
        console.log('Attendance records today:', attendance.length);

        // Check leaves today
        const leaves = await LeaveRequest.find({
            user: { $in: teamIds },
            startDate: { $lte: endOfToday },
            endDate: { $gte: startOfToday },
            status: 'APPROVED'
        });
        console.log('Approved leaves today:', leaves.length);

        // Check timesheets today
        const timesheets = await Timesheet.find({
            user: { $in: teamIds },
            date: { $gte: startOfToday, $lte: endOfToday }
        });
        console.log('Timesheets submitted today:', timesheets.length);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
