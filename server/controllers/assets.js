const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Asset = require('../models/Asset');

// @desc    Get all assets assigned to logged in user
// @route   GET /api/v1/assets/me
// @access  Private
exports.getMyAssets = asyncHandler(async (req, res, next) => {
    const assets = await Asset.find({ assignedTo: req.user.id }).sort('-assignmentDate');
    res.status(200).json({ success: true, count: assets.length, data: assets });
});

// @desc    Get all assets (inventory)
// @route   GET /api/v1/assets
// @access  Private (Admin/Manager/IT)
exports.getAssets = asyncHandler(async (req, res, next) => {
    const assets = await Asset.find().populate('assignedTo', 'firstName lastName email').sort('-createdAt');
    res.status(200).json({ success: true, count: assets.length, data: assets });
});

// @desc    Create a new asset
// @route   POST /api/v1/assets
// @access  Private (Admin/IT)
exports.createAsset = asyncHandler(async (req, res, next) => {
    // Check if assigned initially
    if (req.body.assignedTo) {
        req.body.status = 'ASSIGNED';
        req.body.assignmentDate = Date.now();
    } else {
        req.body.status = 'AVAILABLE';
        req.body.assignmentDate = null;
    }

    const asset = await Asset.create(req.body);
    res.status(201).json({ success: true, data: asset });
});

// @desc    Assign asset to user
// @route   PUT /api/v1/assets/:id/assign
// @access  Private (Admin/IT)
exports.assignAsset = asyncHandler(async (req, res, next) => {
    const { userId } = req.body;
    if (!userId) {
        return next(new ErrorResponse('Please provide a user ID to assign', 400));
    }

    const asset = await Asset.findByIdAndUpdate(
        req.params.id,
        {
            assignedTo: userId,
            status: 'ASSIGNED',
            assignmentDate: Date.now()
        },
        { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName');

    if (!asset) return next(new ErrorResponse('Asset not found', 404));

    res.status(200).json({ success: true, data: asset });
});

// @desc    Return / Unassign an asset
// @route   PUT /api/v1/assets/:id/return
// @access  Private (Admin/IT)
exports.returnAsset = asyncHandler(async (req, res, next) => {
    const { condition, status } = req.body; // optionally update condition

    const updateFields = {
        assignedTo: null,
        assignmentDate: null,
        status: status || 'AVAILABLE'
    };
    if (condition) updateFields.condition = condition;

    const asset = await Asset.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true }
    );

    if (!asset) return next(new ErrorResponse('Asset not found', 404));

    res.status(200).json({ success: true, data: asset });
});
