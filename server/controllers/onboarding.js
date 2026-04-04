const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const OnboardingTask = require('../models/OnboardingTask');
const OnboardingDetail = require('../models/OnboardingDetail');
const User = require('../models/User');
const Document = require('../models/Document');

// @desc    Trigger onboarding process for a user
// @route   POST /api/v1/onboarding/trigger/:userId
// @access  Private (Admin)
exports.triggerOnboarding = asyncHandler(async (req, res, next) => {
    let user = await User.findById(req.params.userId);

    if (!user) {
        return next(new ErrorResponse(`User not found with id of ${req.params.userId}`, 404));
    }

    user.onboardingStatus = 'DOCUMENTS_PENDING';
    await user.save();

    // Create OnboardingDetail record
    let detail = await OnboardingDetail.findOne({ user: user._id });
    if (!detail) {
        detail = await OnboardingDetail.create({
            user: user._id,
            documents: [
                { name: 'Passport Size Photo', required: true },
                { name: 'Aadhar Card', required: true },
                { name: 'PAN Card', required: true },
                { name: 'Education Certificates', required: true },
                { name: 'Previous Experience Letter', required: false }
            ]
        });
    }

    res.status(200).json({ success: true, data: detail });
});

// @desc    Get my onboarding status and details
// @route   GET /api/v1/onboarding/me
// @access  Private
exports.getMyOnboarding = asyncHandler(async (req, res, next) => {
    const detail = await OnboardingDetail.findOne({ user: req.user.id });
    const user = await User.findById(req.user.id).select('onboardingStatus');

    res.status(200).json({ 
        success: true, 
        onboardingStatus: user.onboardingStatus,
        data: detail 
    });
});

// @desc    Upload onboarding document
// @route   POST /api/v1/onboarding/upload/:docId
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res, next) => {

    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    const detail = await OnboardingDetail.findOne({ user: req.user.id });
    if (!detail) {
        return next(new ErrorResponse('Onboarding not triggered', 400));
    }

    const doc = detail.documents.id(req.params.docId);
    if (!doc) {
        return next(new ErrorResponse('Document requirement not found', 404));
    }

    // Restriction: Passport Size Photo must be an image
    if (doc.name === 'Passport Size Photo' && !req.file.mimetype.startsWith('image/')) {
        return next(new ErrorResponse('Please upload an image file (PNG/JPG) for the Passport Photo', 400));
    }

    doc.fileUrl = req.file.path;
    doc.status = 'SUBMITTED';
    doc.updatedAt = Date.now();

    await detail.save();


    res.status(200).json({ success: true, data: detail });
});

// @desc    Verify documents (Admin)
// @route   PUT /api/v1/onboarding/verify-docs/:userId
// @access  Private (Admin)
exports.verifyDocuments = asyncHandler(async (req, res, next) => {
    const { status, remarks } = req.body; // status: APPROVED or REJECTED
    const detail = await OnboardingDetail.findOne({ user: req.params.userId });

    if (!detail) return next(new ErrorResponse('No onboarding details found', 404));

    detail.documents.forEach(doc => {
        if (doc.status === 'SUBMITTED') {
            doc.status = status;
            doc.remarks = remarks;
        }
    });

    await detail.save();

    if (status === 'APPROVED') {
        // Create/Update entries in the Document collection for each approved file
        for (const doc of detail.documents) {
            if (doc.fileUrl) {
                await Document.findOneAndUpdate(
                    { user: req.params.userId, title: doc.name },
                    {
                        documentType: ['Aadhaar Card', 'PAN Card'].includes(doc.name) ? 'ID_PROOF' : 'CERTIFICATE',
                        fileUrl: doc.fileUrl,
                        uploadedBy: req.user.id // Admin who approved
                    },
                    { upsert: true, new: true }
                );
                if (doc.name === 'Passport Size Photo') {
                    await User.findByIdAndUpdate(req.params.userId, { profilePicture: doc.fileUrl });
                }
            }
        }
        await User.findByIdAndUpdate(req.params.userId, { onboardingStatus: 'FORM_PENDING' });
    } else {
        await User.findByIdAndUpdate(req.params.userId, { onboardingStatus: 'DOCUMENTS_PENDING' });
    }

    res.status(200).json({ success: true, data: detail });
});

// @desc    Submit detailed info form
// @route   POST /api/v1/onboarding/submit-form
// @access  Private
exports.submitForm = asyncHandler(async (req, res, next) => {
    const detail = await OnboardingDetail.findOne({ user: req.user.id });
    if (!detail) return next(new ErrorResponse('Onboarding not found', 404));

    detail.personalForm = {
        ...req.body,
        status: 'SUBMITTED',
        submittedAt: Date.now()
    };

    await detail.save();
    await User.findByIdAndUpdate(req.user.id, { onboardingStatus: 'FORM_SUBMITTED' });

    res.status(200).json({ success: true, data: detail });
});

// @desc    Verify detailed form (Admin)
// @route   PUT /api/v1/onboarding/verify-form/:userId
// @access  Private (Admin)
exports.verifyForm = asyncHandler(async (req, res, next) => {
    const { status, remarks } = req.body;
    const detail = await OnboardingDetail.findOne({ user: req.params.userId });

    if (!detail) return next(new ErrorResponse('Onboarding details not found', 404));

    detail.personalForm.status = status;
    detail.personalForm.remarks = remarks;
    await detail.save();

    if (status === 'APPROVED') {
        // Sync to User model
        const user = await User.findById(req.params.userId);
        const form = detail.personalForm;
        
        user.onboardingStatus = 'COMPLETED';
        // Sync verified details
        const fieldsToSync = [
            'fathersName', 'bloodGroup', 'aadharNumber', 'panNumber', 
            'pfNumber', 'qualification', 'ctc', 'experienceYears', 'address'
        ];
        
        fieldsToSync.forEach(field => {
            if (form[field]) user[field] = form[field];
        });

        if (form.bankDetails) {
            user.bankDetails = form.bankDetails;
        }
        if (form.emergencyContact) {
            user.emergencyContact = form.emergencyContact;
        }
        if (form.insuranceDetails) {
            user.insuranceDetails = form.insuranceDetails;
        }
        if (form.dateOfBirth) {
            user.dateOfBirth = form.dateOfBirth;
        }
        
        await user.save();
    } else {
        await User.findByIdAndUpdate(req.params.userId, { onboardingStatus: 'FORM_PENDING' });
    }

    res.status(200).json({ success: true, data: detail });
});

// @desc    Get onboarding details for any user (Admin)
// @route   GET /api/v1/onboarding/user/:userId
// @access  Private (Admin)
exports.getOnboardingByUser = asyncHandler(async (req, res, next) => {
    const detail = await OnboardingDetail.findOne({ user: req.params.userId })
        .populate('user', 'firstName lastName email onboardingStatus profilePicture');
    
    if (!detail) {
        return next(new ErrorResponse('Onboarding not found for this user', 404));
    }

    res.status(200).json({ success: true, data: detail });
});

// LEGACY SUPPORT (Keeping existing for compatibility if needed)
exports.getUserTasks = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'EMPLOYEE' && req.user.id !== req.params.userId) {
        return next(new ErrorResponse('Not authorized to access these tasks', 403));
    }
    const tasks = await OnboardingTask.find({ userId: req.params.userId })
        .populate('assignedTo', 'firstName lastName role')
        .sort('dueDate');
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

exports.getMyAssignedTasks = asyncHandler(async (req, res, next) => {
    const tasks = await OnboardingTask.find({ assignedTo: req.user.id })
        .populate('userId', 'firstName lastName employeeId')
        .sort('dueDate');
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

exports.createTask = asyncHandler(async (req, res, next) => {
    req.body.status = 'PENDING';
    const task = await OnboardingTask.create(req.body);
    const populatedTask = await OnboardingTask.findById(task._id)
        .populate('assignedTo', 'firstName lastName role')
        .populate('userId', 'firstName lastName employeeId');
    res.status(201).json({ success: true, data: populatedTask });
});

exports.completeTask = asyncHandler(async (req, res, next) => {
    let task = await OnboardingTask.findById(req.params.id);
    if (!task) return next(new ErrorResponse(`No task found with id ${req.params.id}`, 404));
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'HR_ADMIN' && task.assignedTo.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to complete this task', 403));
    }
    task.status = 'COMPLETED';
    task.completedAt = Date.now();
    task.completedBy = req.user.id;
    await task.save();
    res.status(200).json({ success: true, data: task });
});

// @desc    Submit documents for verification
// @route   POST /api/v1/onboarding/submit-docs
// @access  Private
exports.submitDocuments = asyncHandler(async (req, res, next) => {
    const detail = await OnboardingDetail.findOne({ user: req.user.id });
    if (!detail) return next(new ErrorResponse('Onboarding details not found', 404));

    // Check if ALL REQUIRED docs are submitted or approved
    const missingRequired = detail.documents.filter(d => d.required && (d.status === 'PENDING' || d.status === 'REJECTED'));
    
    if (missingRequired.length > 0) {
        return next(new ErrorResponse(`Please upload all mandatory documents: ${missingRequired.map(d => d.name).join(', ')}`, 400));
    }

    await User.findByIdAndUpdate(req.user.id, { onboardingStatus: 'DOCUMENTS_SUBMITTED' });
    
    res.status(200).json({ success: true, message: 'Documents submitted for verification' });
});
