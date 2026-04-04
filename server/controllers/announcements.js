const Announcement = require('../models/Announcement');
const asyncHandler = require('../middleware/async');

// @desc    Get all announcements
// @route   GET /api/v1/announcements
// @access  Private
exports.getAnnouncements = asyncHandler(async (req, res, next) => {
    const announcements = await Announcement.find().sort('-createdAt').limit(5);
    res.status(200).json({ success: true, data: announcements });
});

// @desc    Create announcement (Admin)
// @route   POST /api/v1/announcements
// @access  Private/Admin
exports.createAnnouncement = asyncHandler(async (req, res, next) => {
    req.body.author = req.user.id;
    const announcement = await Announcement.create(req.body);
    res.status(201).json({ success: true, data: announcement });
});
