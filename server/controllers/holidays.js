const Holiday = require('../models/Holiday');
const asyncHandler = require('../middleware/async');

// @desc    Get upcoming holidays
// @route   GET /api/v1/holidays
// @access  Public (or Private)
exports.getHolidays = asyncHandler(async (req, res, next) => {
    // Get current date start (00:00:00)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Sort by date ascending to get next upcoming
    const holidays = await Holiday.find({ date: { $gte: today } }).sort('date').limit(10);
    
    res.status(200).json({ success: true, count: holidays.length, data: holidays });
});

// @desc    Create holiday (Admin)
// @route   POST /api/v1/holidays
// @access  Private/Admin
exports.createHoliday = asyncHandler(async (req, res, next) => {
    const holiday = await Holiday.create(req.body);
    res.status(201).json({ success: true, data: holiday });
});
