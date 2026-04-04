const express = require('express');
const { punch, getMyAttendance, getAllAttendance, updateAttendance, toggleBreak } = require('../controllers/attendance');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/punch', punch);
router.post('/break', toggleBreak);
router.get('/me', getMyAttendance);
router.get('/all', authorize('SUPER_ADMIN', 'HR_ADMIN'), getAllAttendance);
router.put('/:id', authorize('SUPER_ADMIN', 'HR_ADMIN'), updateAttendance);

module.exports = router;
