const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @desc    Get current logged in user
// @route   GET /api/v1/users/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// @desc    Upload user avatar
// @route   POST /api/v1/users/me/avatar
// @access  Private
router.post('/me/avatar', protect, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload an image file' });
        }

        const protocol = req.protocol;
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(req.user.id, { profilePicture: fileUrl }, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// @desc    Update user profile
// @route   PUT /api/v1/users/me
// @access  Private
router.put('/me', protect, async (req, res, next) => {
    try {
        // We allow all onboarding-related fields to be updated by the user
        const fieldsToUpdate = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            'contactDetails.phone': req.body.phone,
            'contactDetails.address': req.body.address,
            dateOfBirth: req.body.dateOfBirth === '' ? null : req.body.dateOfBirth,
            gender: req.body.gender,
            maritalStatus: req.body.maritalStatus,
            fathersName: req.body.fathersName,
            bloodGroup: req.body.bloodGroup,
            aadharNumber: req.body.aadharNumber,
            panNumber: req.body.panNumber,
            pfNumber: req.body.pfNumber,
            // ctc: req.body.ctc, // Usually CTC shouldn't be editable by the employee
            qualification: req.body.qualification,
            experienceYears: req.body.experienceYears,
            bankDetails: req.body.bankDetails,
            insuranceDetails: req.body.insuranceDetails
        };

        // Clean up undefined fields
        Object.keys(fieldsToUpdate).forEach(key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]);

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// @desc    Get all users (employees)
// @route   GET /api/v1/users
// @access  Private/HR_ADMIN/SUPER_ADMIN/MANAGER/EMPLOYEE
router.get('/', protect, authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'), async (req, res, next) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
});

// @desc    Add new user (employee)
// @route   POST /api/v1/users
// @access  Private/HR_ADMIN/SUPER_ADMIN/MANAGER
router.post('/', protect, authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide name, email and password' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'User with this email already exists' });
        }

        const count = await User.countDocuments();
        const employeeId = `HEMS-${(count + 1).toString().padStart(4, '0')}`;

        // Create user with basic info - other details will be filled during onboarding
        const user = await User.create({
            employeeId,
            firstName,
            lastName,
            email,
            password,
            role: role || 'EMPLOYEE',
            status: 'ACTIVE',
            onboardingStatus: 'NOT_JOINED',
            workMode: req.body.workMode || 'WFO',
            performanceFactor: req.body.performanceFactor !== undefined ? req.body.performanceFactor : 100,
            isPFApplicable: req.body.isPFApplicable !== undefined ? req.body.isPFApplicable : true,
            isBonusApplicable: req.body.isBonusApplicable !== undefined ? req.body.isBonusApplicable : true,
            taxPercent: req.body.taxPercent || 0
        });

        res.status(201).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// @desc    Get single user (employee)
// @route   GET /api/v1/users/:id
// @access  Private/HR_ADMIN/SUPER_ADMIN/MANAGER
router.get('/:id', protect, authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// @desc    Update any user (employee)
// @route   PUT /api/v1/users/:id
// @access  Private/HR_ADMIN/SUPER_ADMIN/MANAGER
router.put('/:id', protect, authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            role: req.body.role,
            designation: req.body.designation,
            status: req.body.status,
            'contactDetails.phone': req.body.phone,
            'contactDetails.address': req.body.address,
            dateOfBirth: req.body.dateOfBirth === '' ? null : req.body.dateOfBirth,
            gender: req.body.gender,
            maritalStatus: req.body.maritalStatus,
            ctc: req.body.ctc,
            resignationDate: req.body.resignationDate === '' ? null : req.body.resignationDate,
            resignationReason: req.body.resignationReason,
            workMode: req.body.workMode,
            performanceFactor: req.body.performanceFactor,
            isPFApplicable: req.body.isPFApplicable,
            isBonusApplicable: req.body.isBonusApplicable,
            taxPercent: req.body.taxPercent
        };

        console.log(`[UpdateUser] Updating user ${req.params.id} with:`, fieldsToUpdate);

        // Clean up undefined fields
        Object.keys(fieldsToUpdate).forEach(key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]);

        const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        console.log(`[UpdateUser] User ${req.params.id} updated result:`, user ? { 
            performanceFactor: user.performanceFactor, 
            workMode: user.workMode 
        } : 'User not found');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
