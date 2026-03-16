const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Payroll = require('../models/Payroll');
const User = require('../models/User');

// @desc    Get all payslips for the logged-in user
// @route   GET /api/v1/payroll/payslips/me
// @access  Private
exports.getMyPayslips = asyncHandler(async (req, res, next) => {
    const payslips = await Payroll.find({ userId: req.user.id }).sort('-month');
    res.status(200).json({ success: true, count: payslips.length, data: payslips });
});

// @desc    Process monthly payroll (Batch generate slips)
// @route   POST /api/v1/payroll/process
// @access  Private (Finance / Admin)
exports.processPayroll = asyncHandler(async (req, res, next) => {
    const { month } = req.body;
    if (!month) return next(new ErrorResponse('Please specify a month (YYYY-MM)', 400));

    // Simple mock logic: create a default payroll record for ALL active employees
    const users = await User.find({ status: 'ACTIVE' });
    let count = 0;

    for (let u of users) {
        // Check if payslip already exists for this month
        const exists = await Payroll.findOne({ userId: u._id, month });
        if (!exists) {
            // Give a dummy base salary based on role
            let base = 5000;
            if (u.role === 'SUPER_ADMIN' || u.role === 'FINANCE') base = 12000;
            if (u.role === 'MANAGER') base = 9000;

            await Payroll.create({
                userId: u._id,
                month: month,
                basicSalary: base,
                allowances: base * 0.1, // 10% allowance
                deductions: base * 0.05, // 5% deduction
                netPay: base + (base * 0.1) - (base * 0.05),
                status: 'PROCESSED'
            });
            count++;
        }
    }

    res.status(200).json({ success: true, message: `Processed ${count} payslips for ${month}` });
});

