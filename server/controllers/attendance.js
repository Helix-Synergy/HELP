const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Attendance = require('../models/Attendance');

// @desc    Punch In / Punch Out
// @route   POST /api/v1/attendance/punch
// @access  Private (Employee)
exports.punch = asyncHandler(async (req, res, next) => {
    const { location, ipAddress } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
        user: req.user.id,
        date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
    });

    const now = new Date();

    if (!attendance) {
        // Punch In
        attendance = await Attendance.create({
            user: req.user.id,
            date: today,
            punches: [{ punchIn: now, location, ipAddress }],
            status: 'PRESENT'
        });
        return res.status(200).json({ success: true, data: attendance, message: 'Punched In' });
    }

    // Find the last punch round
    const lastPunch = attendance.punches[attendance.punches.length - 1];

    if (!lastPunch.punchOut) {
        // Punch Out
        lastPunch.punchOut = now;

        // Calculate total hours
        let ms = 0;
        attendance.punches.forEach(p => {
            if (p.punchOut) {
                ms += (new Date(p.punchOut) - new Date(p.punchIn));
            }
        });
        attendance.totalHours = parseFloat((ms / (1000 * 60 * 60)).toFixed(2));

        attendance.markModified('punches');
        await attendance.save();
        return res.status(200).json({ success: true, data: attendance, message: 'Punched Out' });
    } else {
        // New Punch In
        attendance.punches.push({ punchIn: now, location, ipAddress });
        await attendance.save();
        return res.status(200).json({ success: true, data: attendance, message: 'Punched In Again' });
    }
});

// @desc    Get my attendance
// @route   GET /api/v1/attendance/me
// @access  Private
exports.getMyAttendance = asyncHandler(async (req, res, next) => {
    const attendance = await Attendance.find({ user: req.user.id }).sort('-date');
    res.status(200).json({ success: true, count: attendance.length, data: attendance });
});
