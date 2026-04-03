const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Timesheet = require('../models/Timesheet');

// @desc    Get user's daily performance logs
// @route   GET /api/v1/timesheets/me
// @access  Private
exports.getMyTimesheets = asyncHandler(async (req, res, next) => {
    const timesheets = await Timesheet.find({ user: req.user.id })
        .sort('-date');
    res.status(200).json({ success: true, count: timesheets.length, data: timesheets });
});

// @desc    Get all daily submissions (Admin Performance Feed)
// @route   GET /api/v1/timesheets
// @access  Private (Manager/Admin)
exports.getTimesheets = asyncHandler(async (req, res, next) => {
    const timesheets = await Timesheet.find()
        .populate('user', 'firstName lastName email')
        .sort('-date');
    res.status(200).json({ success: true, count: timesheets.length, data: timesheets });
});

// @desc    Submit daily performance log
// @route   POST /api/v1/timesheets
// @access  Private
exports.createTimesheet = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;

    // We use a normalized date (midnight) to ensure unique daily entries
    const logDate = new Date(req.body.date);
    logDate.setHours(0, 0, 0, 0);

    // Manually calculate total hours because findOneAndUpdate doesn't trigger pre-save hooks
    const totalHours = req.body.tasks.reduce((sum, task) => sum + (Number(task.hours) || 0), 0);

    const timesheet = await Timesheet.findOneAndUpdate(
        { user: req.user.id, date: logDate },
        { 
            tasks: req.body.tasks,
            totalHours: totalHours,
            status: 'SUBMITTED',
            submittedAt: Date.now()
        },
        { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: timesheet });
});

// @desc    Add comments to daily log
// @route   PUT /api/v1/timesheets/:id/status
// @access  Private (Manager/Admin)
exports.updateTimesheetStatus = asyncHandler(async (req, res, next) => {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
        return next(new ErrorResponse(`Log not found with id of ${req.params.id}`, 404));
    }

    if (req.body.managerComments) timesheet.managerComments = req.body.managerComments;

    await timesheet.save();
    res.status(200).json({ success: true, data: timesheet });
});
