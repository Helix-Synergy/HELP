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

// @desc    Update holiday (Admin)
// @route   PUT /api/v1/holidays/:id
// @access  Private/Admin
exports.updateHoliday = asyncHandler(async (req, res, next) => {
    let holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
        return res.status(404).json({ success: false, error: 'Holiday not found' });
    }
    holiday = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: holiday });
});

// @desc    Delete holiday (Admin)
// @route   DELETE /api/v1/holidays/:id
// @access  Private/Admin
exports.deleteHoliday = asyncHandler(async (req, res, next) => {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
        return res.status(404).json({ success: false, error: 'Holiday not found' });
    }
    await holiday.deleteOne();
    res.status(200).json({ success: true, data: {} });
});
