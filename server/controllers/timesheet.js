const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Timesheet = require('../models/Timesheet');

// @desc    Get user's timesheets
// @route   GET /api/v1/timesheets/me
// @access  Private
exports.getMyTimesheets = asyncHandler(async (req, res, next) => {
    const timesheets = await Timesheet.find({ user: req.user.id })
        .populate('entries.project', 'name projectCode')
        .sort('-weekStartDate');
    res.status(200).json({ success: true, count: timesheets.length, data: timesheets });
});

// @desc    Get team timesheets
// @route   GET /api/v1/timesheets
// @access  Private (Manager/Admin)
exports.getTimesheets = asyncHandler(async (req, res, next) => {
    const timesheets = await Timesheet.find({ status: { $in: ['SUBMITTED', 'APPROVED'] } })
        .populate('user', 'firstName lastName email')
        .populate('entries.project', 'name projectCode')
        .sort('-updatedAt');
    res.status(200).json({ success: true, count: timesheets.length, data: timesheets });
});

// @desc    Save draft or submit timesheet
// @route   POST /api/v1/timesheets
// @access  Private
exports.createTimesheet = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;

    // Check if timesheet already exists for this exact weekstart
    let existingSheet = await Timesheet.findOne({
        user: req.user.id,
        weekStartDate: new Date(req.body.weekStartDate)
    });

    let timesheet;
    if (existingSheet) {
        // Prevent editing if already approved/submitted
        if (existingSheet.status === 'APPROVED' || existingSheet.status === 'SUBMITTED') {
            return next(new ErrorResponse('Timesheet already submitted or approved', 400));
        }
        // Update the existing drafts entries
        existingSheet.entries = req.body.entries;
        existingSheet.status = req.body.status || 'DRAFT';
        timesheet = await existingSheet.save();
    } else {
        // Create brand new sheet
        timesheet = await Timesheet.create(req.body);
    }

    res.status(200).json({ success: true, data: timesheet });
});

// @desc    Approve or reject a timesheet
// @route   PUT /api/v1/timesheets/:id/status
// @access  Private (Manager/Admin)
exports.updateTimesheetStatus = asyncHandler(async (req, res, next) => {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
        return next(new ErrorResponse(`Timesheet not found with id of ${req.params.id}`, 404));
    }

    timesheet.status = req.body.status;
    timesheet.approvedBy = req.user.id;
    if (req.body.managerComments) timesheet.managerComments = req.body.managerComments;

    await timesheet.save();
    res.status(200).json({ success: true, data: timesheet });
});
