const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const RegularizationRequest = require('../models/RegularizationRequest');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Timesheet = require('../models/Timesheet');

// @desc    Apply for regularization
// @route   POST /api/v1/regularization
// @access  Private
exports.applyRegularization = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;

    const filterDateStart = new Date(new Date(req.body.date).setHours(0,0,0,0));
    const filterDateEnd = new Date(new Date(req.body.date).setHours(23,59,59,999));

    // Check if Timesheet is submitted for this particular date (Only for Punch Out or Full Day)
    if (['MISSING_PUNCH', 'REGULARIZATION'].includes(req.body.type)) {
        const timesheet = await Timesheet.findOne({
            user: req.user.id,
            date: {
                $gte: filterDateStart,
                $lt: filterDateEnd
            },
            status: 'SUBMITTED'
        });

        if (!timesheet) {
            return next(new ErrorResponse('Please submit your timesheet for this date before requesting regularization for this type', 400));
        }
    }

    // Check if a request already exists for this date and user
    const existingRequest = await RegularizationRequest.findOne({
        user: req.user.id,
        date: {
            $gte: filterDateStart,
            $lt: filterDateEnd
        },
        status: 'PENDING'
    });

    if (existingRequest) {
        return next(new ErrorResponse('A pending regularization request already exists for this date', 400));
    }

    const request = await RegularizationRequest.create(req.body);

    res.status(201).json({
        success: true,
        data: request
    });
});

// @desc    Get my regularization requests
// @route   GET /api/v1/regularization/me
// @access  Private
exports.getMyRegularizations = asyncHandler(async (req, res, next) => {
    const requests = await RegularizationRequest.find({ user: req.user.id }).sort('-createdAt');

    res.status(200).json({
        success: true,
        count: requests.length,
        data: requests
    });
});

// @desc    Get all regularization requests (Manager/Admin)
// @route   GET /api/v1/regularization
// @access  Private (Manager/Admin)
exports.getRegularizations = asyncHandler(async (req, res, next) => {
    let query;

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'HR_ADMIN') {
        query = RegularizationRequest.find().populate('user', 'firstName lastName employeeId');
    } else if (req.user.role === 'MANAGER') {
        // Get requests for users reporting to this manager
        const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
        const teamIds = teamMembers.map(m => m._id);
        query = RegularizationRequest.find({ user: { $in: teamIds } }).populate('user', 'firstName lastName employeeId');
    }

    const requests = await query.sort('-createdAt');

    res.status(200).json({
        success: true,
        count: requests.length,
        data: requests
    });
});

// @desc    Approve/Reject regularization request
// @route   PUT /api/v1/regularization/:id/status
// @access  Private (Manager/Admin)
exports.updateRegularizationStatus = asyncHandler(async (req, res, next) => {
    const { status, adminComments } = req.body;
    let request = await RegularizationRequest.findById(req.params.id);

    if (!request) {
        return next(new ErrorResponse('Regularization request not found', 404));
    }

    if (request.status !== 'PENDING') {
        return next(new ErrorResponse('This request has already been processed', 400));
    }

    request.status = status;
    request.adminComments = adminComments;
    request.approvedBy = req.user.id;

    if (status === 'APPROVED') {
        // Find existing attendance or create new one
        let attendance = await Attendance.findOne({
            user: request.user,
            date: {
                $gte: new Date(new Date(request.date).setHours(0,0,0,0)),
                $lt: new Date(new Date(request.date).setHours(23,59,59,999))
            }
        });

        let updatedPunches;
        if (request.type === 'FORGOT_PUNCH_IN') {
            // For Forgot Punch In, we only set a punchIn at 10:00 AM
            const punchInTime = new Date(request.date);
            punchInTime.setHours(10, 0, 0, 0);
            
            updatedPunches = [{
                punchIn: punchInTime,
                location: { name: 'Regularized' },
                punchInDevice: 'Desktop',
                punchInIP: 'N/A'
            }];
        } else {
            updatedPunches = request.proposedPunches.map(p => ({
                punchIn: p.punchIn,
                punchOut: p.punchOut,
                location: { name: 'Regularized' },
                ipAddress: 'N/A'
            }));
        }

        if (!attendance) {
            attendance = await Attendance.create({
                user: request.user,
                date: request.date,
                punches: updatedPunches,
                status: request.type === 'FORGOT_PUNCH_IN' ? 'PRESENT' : 'REGULARIZED'
            });
        } else {
            if (request.type === 'FORGOT_PUNCH_IN') {
                // Prepend or replace? Usually this is the first punch.
                attendance.punches = [...updatedPunches, ...attendance.punches];
            } else {
                attendance.punches = updatedPunches;
            }
            attendance.status = 'REGULARIZED';
        }

        // Calculate total hours
        let totalMs = 0;
        attendance.punches.forEach(p => {
            if (p.punchOut && p.punchIn) {
                totalMs += (new Date(p.punchOut) - new Date(p.punchIn));
            }
        });
        attendance.totalHours = parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));
        
        await attendance.save();
    }

    await request.save();

    res.status(200).json({
        success: true,
        data: request
    });
});
