const express = require('express');
const { punch, getMyAttendance } = require('../controllers/attendance');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/punch', punch);
router.get('/me', getMyAttendance);

module.exports = router;
