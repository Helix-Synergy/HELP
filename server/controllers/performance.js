const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Performance = require('../models/Performance');
const User = require('../models/User');

// @desc    Get performance reviews for logged in user
// @route   GET /api/v1/performance/me
// @access  Private
exports.getMyReviews = asyncHandler(async (req, res, next) => {
    const reviews = await Performance.find({ userId: req.user.id })
        .populate('managerId', 'firstName lastName')
        .sort('-createdAt');

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
});

// @desc    Get team performance reviews (For Managers)
// @route   GET /api/v1/performance/team
// @access  Private (Manager)
exports.getTeamReviews = asyncHandler(async (req, res, next) => {
    // Find all users who report to this manager
    const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
    const teamMemberIds = teamMembers.map(member => member._id);

    const reviews = await Performance.find({ userId: { $in: teamMemberIds } })
        .populate('userId', 'firstName lastName employeeId designation')
        .sort('-createdAt');

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
});

// @desc    Create new performance goal/review
// @route   POST /api/v1/performance
// @access  Private
exports.createReview = asyncHandler(async (req, res, next) => {
    req.body.userId = req.body.userId || req.user.id;

    // Auto-assign the manager if creating for self
    if (req.body.userId === req.user.id) {
        const currentUser = await User.findById(req.user.id);
        req.body.managerId = currentUser.managerId;
    }

    const review = await Performance.create(req.body);
    res.status(201).json({ success: true, data: review });
});

// @desc    Update review (Self Rating or Manager Rating)
// @route   PUT /api/v1/performance/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
    let review = await Performance.findById(req.params.id);

    if (!review) return next(new ErrorResponse(`Review not found`, 404));

    // Check permissions
    const isOwner = review.userId.toString() === req.user.id;
    const isManager = review.managerId && review.managerId.toString() === req.user.id;
    const isHR = req.user.role === 'HR_ADMIN' || req.user.role === 'SUPER_ADMIN';

    if (!isOwner && !isManager && !isHR) {
        return next(new ErrorResponse(`Not authorized to update this review`, 403));
    }

    review = await Performance.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: review });
});
