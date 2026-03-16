const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const OnboardingTask = require('../models/OnboardingTask');
const User = require('../models/User');

// @desc    Get all onboarding tasks for a specific user (their checklist)
// @route   GET /api/v1/onboarding/:userId
// @access  Private
exports.getUserTasks = asyncHandler(async (req, res, next) => {
    // Only HR/Manager or the User themselves can see the list
    if (req.user.role === 'EMPLOYEE' && req.user.id !== req.params.userId) {
        return next(new ErrorResponse('Not authorized to access these tasks', 403));
    }

    const tasks = await OnboardingTask.find({ userId: req.params.userId })
        .populate('assignedTo', 'firstName lastName role')
        .sort('dueDate');

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

// @desc    Get tasks assigned TO me (e.g. IT Admin seeing laptop setup tickets)
// @route   GET /api/v1/onboarding/assigned/me
// @access  Private
exports.getMyAssignedTasks = asyncHandler(async (req, res, next) => {
    const tasks = await OnboardingTask.find({ assignedTo: req.user.id })
        .populate('userId', 'firstName lastName employeeId')
        .sort('dueDate');

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

// @desc    Create new onboarding task
// @route   POST /api/v1/onboarding
// @access  Private (HR/Manager)
exports.createTask = asyncHandler(async (req, res, next) => {
    req.body.status = 'PENDING';
    const task = await OnboardingTask.create(req.body);

    const populatedTask = await OnboardingTask.findById(task._id)
        .populate('assignedTo', 'firstName lastName role')
        .populate('userId', 'firstName lastName employeeId');

    res.status(201).json({ success: true, data: populatedTask });
});

// @desc    Mark task as completed
// @route   PUT /api/v1/onboarding/:id/complete
// @access  Private
exports.completeTask = asyncHandler(async (req, res, next) => {
    let task = await OnboardingTask.findById(req.params.id);

    if (!task) return next(new ErrorResponse(`No task found with id ${req.params.id}`, 404));

    // Must be HR, Super Admin, or the assigned user to complete it
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'HR_ADMIN' && task.assignedTo.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to complete this task', 403));
    }

    task.status = 'COMPLETED';
    task.completedAt = Date.now();
    task.completedBy = req.user.id;

    await task.save();

    res.status(200).json({ success: true, data: task });
});
