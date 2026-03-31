const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.role,
                onboardingStatus: user.onboardingStatus,
                profilePicture: user.profilePicture
            }
        });
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
            return res.status(401).json({ success: false, message: 'Your account is no longer active. Please contact HR.' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
});

// @desc    Register super admin (Initial setup ONLY)
// @route   POST /api/v1/auth/setup
// @access  Public
router.post('/setup', async (req, res, next) => {
    try {
        const adminExists = await User.findOne({ role: 'SUPER_ADMIN' });
        if (adminExists) {
            return res.status(400).json({ success: false, message: 'Setup already completed. Super Admin exists.' });
        }

        const { firstName, lastName, email, password } = req.body;

        // Generate standard employee ID for the first user
        const user = await User.create({
            employeeId: 'HEMS-0001',
            firstName,
            lastName,
            email,
            password,
            role: 'SUPER_ADMIN'
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        next(error);
    }
});

const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'There is no user with that email' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset your password:\n\n ${resetUrl}\n\nIf you did not request this, please ignore this email. This link will expire in 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password reset token',
                message
            });

            res.status(200).json({ success: true, data: 'Email sent successfully. Please check your inbox.' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }
    } catch (error) {
        next(error);
    }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
router.put('/resetpassword/:resettoken', async (req, res, next) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
