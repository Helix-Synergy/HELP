const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');

// @desc    Apply for leave
// @route   POST /api/v1/leaves/apply
// @access  Private
exports.applyLeave = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;
    const leave = await LeaveRequest.create(req.body);
    res.status(201).json({ success: true, data: leave });
});

// @desc    Get my leaves
// @route   GET /api/v1/leaves/me
// @access  Private
exports.getMyLeaves = asyncHandler(async (req, res, next) => {
    const leaves = await LeaveRequest.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, count: leaves.length, data: leaves });
});

// @desc    Get all leave requests (for Manager/HR)
// @route   GET /api/v1/leaves
// @access  Private (Manager/Admin)
exports.getLeaves = asyncHandler(async (req, res, next) => {
    const leaves = await LeaveRequest.find().populate('user', 'firstName lastName').sort('-createdAt');
    res.status(200).json({ success: true, count: leaves.length, data: leaves });
});

// @desc    Get my leave balance
// @route   GET /api/v1/leaves/balance
// @access  Private
exports.getLeaveBalance = asyncHandler(async (req, res, next) => {
    let balance = await LeaveBalance.findOne({ user: req.user.id, year: new Date().getFullYear() });
    
    // Initialize if not exists
    if (!balance) {
        balance = await LeaveBalance.create({
            user: req.user.id,
            year: new Date().getFullYear(),
            balances: [
                { leaveType: 'CASUAL_LEAVE', totalAllocated: 10, used: 0 },
                { leaveType: 'SICK_LEAVE', totalAllocated: 12, used: 0 },
                { leaveType: 'EARNED_LEAVE', totalAllocated: 15, used: 0 }
            ]
        });
    }

    res.status(200).json({ success: true, data: balance });
});

// @desc    Update leave status
// @route   PUT /api/v1/leaves/:id/status
// @access  Private (Manager/Admin)
exports.updateLeaveStatus = asyncHandler(async (req, res, next) => {
    let leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return next(new ErrorResponse(`Leave not found`, 404));

    const oldStatus = leave.status;
    const newStatus = req.body.status;

    leave.status = newStatus;
    leave.approvedBy = req.user.id;
    await leave.save();

    // If approved, reduce balance
    if (newStatus === 'APPROVED' && oldStatus !== 'APPROVED') {
        const diff = new Date(leave.endDate) - new Date(leave.startDate);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

        const balance = await LeaveBalance.findOne({ user: leave.user, year: new Date(leave.startDate).getFullYear() });
        if (balance) {
            const balanceItem = balance.balances.find(b => b.leaveType === leave.leaveType);
            if (balanceItem) {
                balanceItem.used += days;
                await balance.save();
            }
        }
    }

    res.status(200).json({ success: true, data: leave });
});

// @desc    Get all leave balances (Admin only)
// @route   GET /api/v1/leaves/all-balances
// @access  Private (Admin/Manager)
exports.getAllLeaveBalances = asyncHandler(async (req, res, next) => {
    const User = require('../models/User');
    
    // Get all active users
    const users = await User.find({ status: 'ACTIVE' }).select('firstName lastName employeeId');
    
    // Get all leave balances for the current year
    const currentYear = new Date().getFullYear();
    const balances = await LeaveBalance.find({ year: currentYear });
    
    // Map them together
    const userBalancesMap = {};
    for (const b of balances) {
        userBalancesMap[b.user.toString()] = b.balances;
    }
    
    const formattedData = users.map(u => {
        const userBal = userBalancesMap[u._id.toString()] || [
            { leaveType: 'CASUAL_LEAVE', totalAllocated: 10, used: 0 },
            { leaveType: 'SICK_LEAVE', totalAllocated: 12, used: 0 },
            { leaveType: 'EARNED_LEAVE', totalAllocated: 15, used: 0 }
        ];
        return {
            user: { _id: u._id, firstName: u.firstName, lastName: u.lastName, employeeId: u.employeeId },
            balances: userBal
        };
    });

    res.status(200).json({ success: true, count: formattedData.length, data: formattedData });
});
