const express = require('express');
const { getMyTimesheets, getTimesheets, createTimesheet, updateTimesheetStatus } = require('../controllers/timesheet');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.get('/me', getMyTimesheets);
router.post('/', createTimesheet);

// Manager / Admin routes
router.get('/', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), getTimesheets);
router.put('/:id/status', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), updateTimesheetStatus);

module.exports = router;
