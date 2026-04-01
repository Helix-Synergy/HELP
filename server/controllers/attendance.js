const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Attendance = require('../models/Attendance');

// @desc    Punch In / Punch Out
// @route   POST /api/v1/attendance/punch
// @access  Private (Employee)
exports.punch = asyncHandler(async (req, res, next) => {
    const { location, ipAddress } = req.body;
    
    // Get current time in IST (UTC + 5:30)
    const nowUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(nowUTC.getTime() + istOffset);
    
    // Calculate IST Today Start (00:00) in UTC for database consistency
    const istTodayStart = new Date(nowIST);
    istTodayStart.setUTCHours(0, 0, 0, 0);
    const todayStartUTC = new Date(istTodayStart.getTime() - istOffset);
    const todayEndUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000);

    let attendance = await Attendance.findOne({
        user: req.user.id,
        date: {
            $gte: todayStartUTC,
            $lt: todayEndUTC
        }
    });

    if (!attendance) {
        // Enforce 10:05 AM IST Deadline (except for Super Admin)
        const istHour = nowIST.getUTCHours();
        const istMinute = nowIST.getUTCMinutes();
        
        if (req.user.role !== 'SUPER_ADMIN') {
            if (istHour > 10 || (istHour === 10 && istMinute > 5)) {
                return next(new ErrorResponse('out of time', 400));
            }
        }

        // Punch In
        attendance = await Attendance.create({
            user: req.user.id,
            date: todayStartUTC,
            punches: [{ punchIn: nowUTC, location, ipAddress }],
            status: 'PRESENT'
        });
        return res.status(200).json({ success: true, data: attendance, message: 'Punched In' });
    }

    // Find the last punch round
    const lastPunch = attendance.punches[attendance.punches.length - 1];

    if (!lastPunch.punchOut) {
        // Punch Out
        lastPunch.punchOut = nowUTC;

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
        attendance.punches.push({ punchIn: nowUTC, location, ipAddress });
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

// @desc    Get all attendance records (Admin only)
// @route   GET /api/v1/attendance/all
// @access  Private (Admin)
exports.getAllAttendance = asyncHandler(async (req, res, next) => {
    const User = require('../models/User');
    let query = {};
    let filterDate = null;
    
    // If a specific date is provided, use it
    if (req.query.date) {
        // Normalize input string to IST Midnight represented in UTC
        const istOffset = 5.5 * 60 * 60 * 1000;
        const inputDate = new Date(req.query.date);
        inputDate.setUTCHours(0, 0, 0, 0); 
        
        const queryStartUTC = new Date(inputDate.getTime() - istOffset);
        const queryEndUTC = new Date(queryStartUTC.getTime() + 24 * 60 * 60 * 1000);
        
        query.date = {
            $gte: queryStartUTC,
            $lt: queryEndUTC
        };
        filterDate = queryStartUTC;
    } else if (req.query.year && req.query.month) {
        const year = parseInt(req.query.year);
        const month = parseInt(req.query.month) - 1;
        
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 1);
        
        query.date = {
            $gte: startDate,
            $lt: endDate
        };
    } else if (req.query.year) {
        const year = parseInt(req.query.year);
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);
        
        query.date = {
            $gte: startDate,
            $lt: endDate
        };
    }

    // Get attendance records
    const attendance = await Attendance.find(query)
        .populate({
            path: 'user',
            select: 'firstName lastName employeeId'
        })
        .sort('-date');

    // If filtering by a specific date, also include employees who haven't punched in
    if (filterDate) {
        const allUsers = await User.find({ status: 'ACTIVE' })
            .select('firstName lastName employeeId');
        
        // Find users who have attendance records for this date
        const usersWithAttendance = new Set(
            attendance.map(a => a.user?._id?.toString()).filter(Boolean)
        );
        
        // Create "absent" records for employees without attendance
        const absentRecords = allUsers
            .filter(u => !usersWithAttendance.has(u._id.toString()))
            .map(u => ({
                _id: `absent-${u._id}`,
                user: {
                    _id: u._id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    employeeId: u.employeeId
                },
                date: filterDate,
                punches: [],
                totalHours: 0,
                status: 'ABSENT',
                overtimeHours: 0
            }));
        
        const combined = [...attendance, ...absentRecords];
        return res.status(200).json({ success: true, count: combined.length, data: combined });
    }

    res.status(200).json({ success: true, count: attendance.length, data: attendance });
});

// @desc    Update attendance (Regularization by Admin)
// @route   PUT /api/v1/attendance/:id
// @access  Private (Admin)
exports.updateAttendance = asyncHandler(async (req, res, next) => {
    const { punches, status, date, userId } = req.body;

    // Handle "Absent" records which have a mock ID like "absent-user-date"
    if (req.params.id.startsWith('absent-')) {
        // Create new record
        const attendance = await Attendance.create({
            user: userId,
            date: date,
            punches: punches,
            status: status || 'REGULARIZED'
        });

        // Calculate hours if punches provided
        let ms = 0;
        attendance.punches.forEach(p => {
            if (p.punchIn && p.punchOut) {
                ms += (new Date(p.punchOut) - new Date(p.punchIn));
            }
        });
        attendance.totalHours = parseFloat((ms / (1000 * 60 * 60)).toFixed(2));
        await attendance.save();

        return res.status(201).json({ success: true, data: attendance });
    }

    let attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
        return next(new ErrorResponse('Attendance record not found', 404));
    }

    // Update fields
    if (punches) attendance.punches = punches;
    if (status) attendance.status = status;

    // Recalculate total hours
    let ms = 0;
    attendance.punches.forEach(p => {
        if (p.punchIn && p.punchOut) {
            ms += (new Date(p.punchOut) - new Date(p.punchIn));
        }
    });
    attendance.totalHours = parseFloat((ms / (1000 * 60 * 60)).toFixed(2));

    attendance.markModified('punches');
    await attendance.save();

    res.status(200).json({ success: true, data: attendance });
});
