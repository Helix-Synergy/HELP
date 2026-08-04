const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { getUdemyCourses } = require('../utils/udemyService');

// @desc    Get all active courses (Catalog)
// @route   GET /api/v1/learning/courses
// @access  Private (Admin/Manager only for full catalog)
exports.getCourses = asyncHandler(async (req, res, next) => {
    // If employee, they shouldn't see the catalog based on new requirements
    if (req.user.role === 'EMPLOYEE') {
        return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const courses = await Course.find().sort('-createdAt');
    res.status(200).json({ success: true, count: courses.length, data: courses });
});

// @desc    Get my enrollments (Assigned courses for employees)
// @route   GET /api/v1/learning/enrollments/me
// @access  Private
exports.getMyEnrollments = asyncHandler(async (req, res, next) => {
    let query = { userId: req.user.id };
    
    // For employees, we might want to specifically show only ADMIN_ASSIGNED if self-enroll is disabled
    // But based on the flow, if an admin assigns it, an enrollment record is created.
    
    const enrollments = await Enrollment.find(query)
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

// @desc    Sync courses from Udemy Business
// @route   POST /api/v1/learning/sync-udemy
// @access  Private (Admin)
exports.syncUdemyCourses = asyncHandler(async (req, res, next) => {
    const udemyCourses = await getUdemyCourses();
    
    let createdCount = 0;
    let updatedCount = 0;

    for (const courseData of udemyCourses) {
        const existingCourse = await Course.findOne({ externalId: courseData.externalId });
        if (existingCourse) {
            await Course.findByIdAndUpdate(existingCourse._id, courseData);
            updatedCount++;
        } else {
            await Course.create(courseData);
            createdCount++;
        }
    }

    res.status(200).json({ 
        success: true, 
        message: `Sync complete. Created: ${createdCount}, Updated: ${updatedCount}` 
    });
});

// @desc    Assign course to employees
// @route   POST /api/v1/learning/assign
// @access  Private (Admin/Manager)
exports.assignCourse = asyncHandler(async (req, res, next) => {
    const { courseId, userIds, dueDate } = req.body;

    if (!courseId || !userIds || !Array.isArray(userIds)) {
        return next(new ErrorResponse('Please provide courseId and an array of userIds', 400));
    }

    const results = [];
    for (const userId of userIds) {
        try {
            const enrollment = await Enrollment.findOneAndUpdate(
                { courseId, userId },
                { 
                    assignmentType: 'ADMIN_ASSIGNED', 
                    assignedBy: req.user.id,
                    dueDate,
                    status: 'NOT_STARTED' // Reset status if re-assigning? Or keep current?
                },
                { upsert: true, new: true }
            );
            results.push(enrollment);
        } catch (error) {
            console.error(`Failed to assign course to user ${userId}`, error);
        }
    }

    res.status(200).json({ success: true, count: results.length, data: results });
});

// @desc    Upload course certificate
// @route   POST /api/v1/learning/enrollments/:id/certificate
// @access  Private
exports.uploadCertificate = asyncHandler(async (req, res, next) => {
    let enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) return next(new ErrorResponse('Enrollment not found', 404));

    // Ensure ownership
    if (enrollment.userId.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized', 401));
    }

    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    enrollment.certificateUrl = req.file.path;
    enrollment.certificateUploadDate = Date.now();
    enrollment.status = 'COMPLETED';
    enrollment.progressPercent = 100;

    await enrollment.save();

    res.status(200).json({ success: true, data: enrollment });
});

// @desc    Get all completed enrollments (Admin review)
// @route   GET /api/v1/learning/completions
// @access  Private (Admin)
exports.getCompletions = asyncHandler(async (req, res, next) => {
    const completions = await Enrollment.find({ status: 'COMPLETED' })
        .populate('userId', 'firstName lastName employeeId')
        .populate('courseId')
        .sort('-certificateUploadDate');

    res.status(200).json({ success: true, count: completions.length, data: completions });
});
