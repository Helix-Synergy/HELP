const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
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
