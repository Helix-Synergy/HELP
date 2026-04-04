const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Timesheet = require('../models/Timesheet');
const asyncHandler = require('../middleware/async');

// @desc    Get workforce stats for Dashboard
// @route   GET /api/v1/dashboard/system-stats
// @access  Private/SuperAdmin
exports.getSystemStats = asyncHandler(async (req, res, next) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch counts
    const totalEmployeesCount = await User.countDocuments({ status: { $ne: 'INACTIVE' } });
    const presentTodayCount = await Attendance.countDocuments({
        date: { $gte: startOfToday, $lte: endOfToday },
        status: { $in: ['PRESENT', 'LATE', 'HALF_DAY', 'REGULARIZED'] }
    });
    const onLeaveTodayCount = await LeaveRequest.countDocuments({
        startDate: { $lte: endOfToday },
        endDate: { $gte: startOfToday },
        status: 'APPROVED'
    });
    const pendingItemsCount = await LeaveRequest.countDocuments({ status: 'PENDING' });

    // Activity trend
    const activityTrend = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const s = new Date(d.setHours(0, 0, 0, 0));
        const e = new Date(d.setHours(23, 59, 59, 999));
        const count = await Attendance.countDocuments({
            date: { $gte: s, $lte: e },
            status: { $in: ['PRESENT', 'LATE', 'HALF_DAY', 'REGULARIZED'] }
        });
        activityTrend.push({
            name: s.toLocaleDateString('en-US', { weekday: 'short' }),
            present: count
        });
    }

    // Return exact keys expected by the frontend
    res.status(200).json({
        success: true,
        data: {
            totalEmployees: totalEmployeesCount,
            presentToday: presentTodayCount,
            onLeaveToday: onLeaveTodayCount,
            pendingItems: pendingItemsCount,
            activityData: activityTrend
        }
    });
});

// @desc    Get dashboard stats for a Manager's team
// @route   GET /api/v1/dashboard/manager-stats
// @access  Private/Manager
exports.getManagerStats = asyncHandler(async (req, res, next) => {
    // Standard IST offset (UTC + 5:30) used across the system
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowUTC = new Date();
    const nowIST = new Date(nowUTC.getTime() + istOffset);
    
    // Calculate IST Today Start (00:00) and End (23:59) in UTC
    const istTodayStart = new Date(nowIST);
    istTodayStart.setUTCHours(0, 0, 0, 0);
    const todayStartUTC = new Date(istTodayStart.getTime() - istOffset);
    const todayEndUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000);

    // 1. Identify team members
    const teamEmployees = await User.find({ managerId: req.user.id, status: 'ACTIVE' });
    const teamIds = teamEmployees.map(u => u._id);
    const totalTeamCount = teamIds.length;

    console.log(`[Dashboard] Manager ${req.user.id} (${req.user.firstName}) - Team members found: ${totalTeamCount}`);
    if (totalTeamCount > 0) {
        console.log(`[Dashboard] Team IDs: ${teamIds.join(', ')}`);
    }

    if (totalTeamCount === 0) {
        return res.status(200).json({
            success: true,
            data: {
                attendancePercentage: 0,
                pendingLeaves: 0,
                leavesToday: 0,
                timesheetsDue: 0,
                activityData: []
            }
        });
    }

    // 2. Present Today
    const presentTodayCount = await Attendance.countDocuments({
        user: { $in: teamIds },
        date: { $gte: todayStartUTC, $lt: todayEndUTC },
        status: { $in: ['PRESENT', 'LATE', 'HALF_DAY', 'REGULARIZED'] }
    });

    // 3. Pending Leaves
    const pendingLeavesCount = await LeaveRequest.countDocuments({
        user: { $in: teamIds },
        status: 'PENDING'
    });

    // 4. Team Leaves Today
    const leavesTodayCount = await LeaveRequest.countDocuments({
        user: { $in: teamIds },
        startDate: { $lte: todayEndUTC },
        endDate: { $gte: todayStartUTC },
        status: 'APPROVED'
    });

    // 5. Timesheets Due (Members who haven't submitted today)
    const submittedTimesheetsCount = await Timesheet.countDocuments({
        user: { $in: teamIds },
        date: { $gte: todayStartUTC, $lt: todayEndUTC }
    });
    const timesheetsDueCount = Math.max(0, totalTeamCount - submittedTimesheetsCount);

    // 6. Attendance Trend (Last 7 days)
    const activityTrend = [];
    for (let i = 6; i >= 0; i--) {
        const start = new Date(todayStartUTC.getTime() - (i * 24 * 60 * 60 * 1000));
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        
        const count = await Attendance.countDocuments({
            user: { $in: teamIds },
            date: { $gte: start, $lt: end },
            status: { $in: ['PRESENT', 'LATE', 'HALF_DAY', 'REGULARIZED'] }
        });
        
        activityTrend.push({
            name: start.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
            present: count
        });
    }


    const attendancePercentage = totalTeamCount > 0 ? Math.round((presentTodayCount / totalTeamCount) * 100) : 0;

    res.status(200).json({
        success: true,
        data: {
            attendancePercentage,
            pendingLeaves: pendingLeavesCount,
            leavesToday: leavesTodayCount,
            timesheetsDue: timesheetsDueCount,
            activityData: activityTrend
        }
    });
});

