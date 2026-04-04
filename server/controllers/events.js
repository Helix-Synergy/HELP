const Event = require('../models/Event');
const asyncHandler = require('../middleware/async');

// @desc    Get upcoming events
// @route   GET /api/v1/events
// @access  Private
exports.getEvents = asyncHandler(async (req, res, next) => {
    const events = await Event.find({ date: { $gte: new Date() } }).sort('date').limit(5);
    res.status(200).json({ success: true, count: events.length, data: events });
});

// @desc    Create event (Admin)
// @route   POST /api/v1/events
// @access  Private/Admin
exports.createEvent = asyncHandler(async (req, res, next) => {
    const event = await Event.create(req.body);
    res.status(201).json({ success: true, data: event });
});
