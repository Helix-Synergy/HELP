const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Get all active courses available in the LMS
// @route   GET /api/v1/learning/courses
// @access  Private
exports.getCourses = asyncHandler(async (req, res, next) => {
    const courses = await Course.find().sort('-createdAt');
    res.status(200).json({ success: true, count: courses.length, data: courses });
});

// @desc    Get my enrollments (to track my progress)
// @route   GET /api/v1/learning/enrollments/me
// @access  Private
exports.getMyEnrollments = asyncHandler(async (req, res, next) => {
    const enrollments = await Enrollment.find({ userId: req.user.id })
        .populate('courseId')
        .sort('-updatedAt');
    res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
});

// @desc    Enroll in a course
// @route   POST /api/v1/learning/enrollments
// @access  Private
exports.enrollCourse = asyncHandler(async (req, res, next) => {
    const { courseId } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) return next(new ErrorResponse('Course not found', 404));

    // Try to create enrollment (compound index protects against dupes)
    try {
        const enrollment = await Enrollment.create({
            courseId,
            userId: req.user.id,
            status: 'IN_PROGRESS',
            progressPercent: 0
        });

        // Populate and return
        const populated = await Enrollment.findById(enrollment._id).populate('courseId');
        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        if (error.code === 11000) {
            return next(new ErrorResponse('You are already enrolled in this course', 400));
        }
        return next(error);
    }
});

// @desc    Update progress in a course
// @route   PUT /api/v1/learning/enrollments/:id
// @access  Private
exports.updateProgress = asyncHandler(async (req, res, next) => {
    const { progressPercent } = req.body;
    let enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) return next(new ErrorResponse('Enrollment not found', 404));

    // Ensure ownership
    if (enrollment.userId.toString() !== req.user.id && req.user.role === 'EMPLOYEE') {
        return next(new ErrorResponse('Not authorized', 401));
    }

    enrollment.progressPercent = progressPercent;

    if (progressPercent >= 100) {
        enrollment.status = 'COMPLETED';
        enrollment.completionDate = Date.now();
        enrollment.progressPercent = 100;
    } else if (progressPercent > 0) {
        enrollment.status = 'IN_PROGRESS';
    }

    await enrollment.save();
    enrollment = await Enrollment.findById(enrollment._id).populate('courseId');

    res.status(200).json({ success: true, data: enrollment });
});

// @desc    Create a new course module
// @route   POST /api/v1/learning/courses
// @access  Private (Admin/HR)
exports.createCourse = asyncHandler(async (req, res, next) => {
    req.body.createdBy = req.user.id;
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
});
