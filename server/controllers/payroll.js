const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// @desc    Get all payslips for the logged-in user
// @route   GET /api/v1/payroll/payslips/me
// @access  Private
exports.getMyPayslips = asyncHandler(async (req, res, next) => {
    const payslips = await Payroll.find({ userId: req.user.id })
        .populate('userId', 'firstName lastName employeeId joiningDate designation departmentId workLocation bankDetails panNumber pfNumber uanNumber esiNumber unitName')
        .sort('-month');
    res.status(200).json({ success: true, count: payslips.length, data: payslips });
});

// @desc    Get payroll summary for all employees (Admin)
// @route   GET /api/v1/payroll/summary
// @access  Private (Admin)
exports.getPayrollSummary = asyncHandler(async (req, res, next) => {
    const { month } = req.query;
    if (!month) return next(new ErrorResponse('Please specify a month', 400));

    const payrolls = await Payroll.find({ month })
        .populate('userId', 'firstName lastName employeeId joiningDate designation departmentId workLocation bankDetails panNumber pfNumber uanNumber esiNumber unitName')
        .sort('-month'); // or handle sort separately
    res.status(200).json({ success: true, count: payrolls.length, data: payrolls });
});

// @desc    Process monthly payroll (Batch generate slips)
// @route   POST /api/v1/payroll/process
// @access  Private (Finance / Admin)
exports.processPayroll = asyncHandler(async (req, res, next) => {
    const { month, overrides, perfOverrides } = req.body;
    if (!month) return next(new ErrorResponse('Please specify a month (YYYY-MM)', 400));

    const [year, monthNum] = month.split('-').map(Number);
    // Salary Cycle: 26th of Previous Month to 25th of Current Month
    const startDate = new Date(year, monthNum - 2, 26);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, monthNum - 1, 25);
    endDate.setHours(23, 59, 59, 999);
    
    const totalDaysInMonth = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const users = await User.find({ status: 'ACTIVE' });
    let count = 0;

    for (let u of users) {
        // Skip if already processed
        const existing = await Payroll.findOne({ userId: u._id, month });
        if (existing) continue;

        const monthlyCTC = (parseFloat(u.ctc) || 0) / 12;
        if (monthlyCTC <= 0) continue;

        let presentCount = 0;
        
        // Check for manual override from the preview dashboard
        if (overrides && overrides[u._id.toString()] !== undefined) {
            presentCount = parseFloat(overrides[u._id.toString()]);
        } else {
            // Fetch Attendance
            const attendanceRecords = await Attendance.find({
                user: u._id,
                date: { $gte: startDate, $lte: endDate },
                status: { $in: ['PRESENT', 'HALF_DAY', 'REGULARIZED'] }
            });

            attendanceRecords.forEach(r => {
                if (r.status === 'HALF_DAY') presentCount += 0.5;
                else presentCount += 1;
            });
            // Add weekends (assume 8 days) as paid if needed? 
            // In the user's rule: effective_ctc = (monthly_ctc / total_working_days) * attendance_days
            // This implies attendance_days includes holidays/weekends if they are paid.
            // I'll assume 8 weekend days are paid, so presentCount += 8.
            presentCount += 8;
            if (presentCount > totalDaysInMonth) presentCount = totalDaysInMonth;
        }

        const effectiveCTC = (monthlyCTC / totalDaysInMonth) * presentCount;

        // Rules Mapping
        const isWFO = u.workMode === 'WFO';
        const config = isWFO ? {
            basic: 40, hra: 16, pa: 34, ma: 2, ca: 2, gratuity: 2, pfComp: 2, bonus: 2
        } : {
            basic: 45.34, hra: 13.34, pa: 37.34, ma: 1.33, ca: 0, gratuity: 1.33, pfComp: 1.33, bonus: 0
        };

        const calc = (pct) => (pct / 100) * effectiveCTC;

        const basic = calc(config.basic);
        const hra = calc(config.hra);
        
        // Performance Allowance (PA) - Scaled by Performance Factor
        const performanceFactor = (perfOverrides && perfOverrides[u._id.toString()] !== undefined) 
            ? parseFloat(perfOverrides[u._id.toString()]) 
            : (u.performanceFactor !== undefined && u.performanceFactor !== null ? u.performanceFactor : 100);
            
        const pa = calc(config.pa) * (performanceFactor / 100);

        const ma = calc(config.ma);
        const ca = calc(config.ca);
        const gratuity = calc(config.gratuity);
        const pfComponent = calc(config.pfComp);
        const bonus = (u.isBonusApplicable !== false) ? calc(config.bonus) : 0;

        const grossSalary = basic + hra + pa + ma + ca + gratuity + pfComponent + bonus;

        // Deductions
        const providentFund = (u.isPFApplicable !== false) ? (basic * 0.12) : 0;
        const tax = (u.taxPercent || 0) / 100 * grossSalary;
        
        // Other fixed deductions (keeping for now or remove if strictly JSON rules)
        const professionalTax = 200;
        const healthInsurance = 300;
        
        const totalEarnings = grossSalary;
        const totalDeductions = providentFund + tax + professionalTax + healthInsurance;
        const netPay = totalEarnings - totalDeductions;

        await Payroll.create({
            userId: u._id,
            month,
            basic,
            hra,
            conveyance: ca,
            medicalAllowance: ma,
            phoneInternetAllowance: 0,
            booksPeriodicalsAllowance: 0,
            gadgetsAllowance: 0,
            performanceAllowance: pa,
            gratuity,
            pfComponent,
            bonus,
            specialAllowance: 0,
            providentFund,
            professionalTax,
            healthInsurance,
            incomeTax: tax,
            lopDeductions: monthlyCTC - effectiveCTC, // For reporting
            totalEarnings,
            totalDeductions,
            netPay,
            attendance: {
                totalDays: totalDaysInMonth,
                presentDays: presentCount,
                lopDays: totalDaysInMonth - presentCount,
                performanceFactor: performanceFactor
            },
            status: 'PROCESSED'
        });
        count++;
    }

    res.status(200).json({ success: true, message: `Processed ${count} payslips for ${month}` });
});

// @desc    Get attendance summary for payroll preview
// @route   GET /api/v1/payroll/attendance-summary
// @access  Private (Admin/Finance)
exports.getAttendanceSummary = asyncHandler(async (req, res, next) => {
    const { month } = req.query; // Expects YYYY-MM
    if (!month) {
        return next(new ErrorResponse('Please provide month (YYYY-MM)', 400));
    }

    const [year, monthNum] = month.split('-').map(Number);
    // Salary Cycle: 26th of Previous Month to 25th of Current Month
    const startDate = new Date(year, monthNum - 2, 26);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, monthNum - 1, 25);
    endDate.setHours(23, 59, 59, 999);
    
    const totalDaysInMonth = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const users = await User.find({ status: 'ACTIVE' }).select('firstName lastName employeeId ctc performanceFactor');


    const summaries = await Promise.all(users.map(async (u) => {
        const attendanceRecords = await Attendance.find({
            user: u._id,
            date: { $gte: startDate, $lte: endDate },
            status: { $in: ['PRESENT', 'HALF_DAY', 'REGULARIZED'] }
        });

        let presentCount = 0;
        attendanceRecords.forEach(r => {
            if (r.status === 'HALF_DAY') presentCount += 0.5;
            else presentCount += 1;
        });

        // Assume 8 weekend days
        const lopDays = Math.max(0, totalDaysInMonth - presentCount - 8);

        return {
            userId: u._id,
            name: `${u.firstName} ${u.lastName}`,
            employeeId: u.employeeId,
            totalDays: totalDaysInMonth,
            presentDays: presentCount,
            lopDays: Math.max(0, lopDays),
            performanceFactor: (u.performanceFactor !== undefined && u.performanceFactor !== null) ? u.performanceFactor : 100,
            hasProcessed: !!(await Payroll.exists({ userId: u._id, month }))
        };
    }));


    res.status(200).json({ success: true, data: summaries });
});

