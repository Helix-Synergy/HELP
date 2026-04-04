const express = require('express');
const { getHolidays, createHoliday } = require('../controllers/holidays');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getHolidays);
router.post('/', authorize('SUPER_ADMIN'), createHoliday);

module.exports = router;
