const express = require('express');
const { 
    getHolidays, 
    createHoliday,
    updateHoliday,
    deleteHoliday 
} = require('../controllers/holidays');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getHolidays);
router.post('/', authorize('SUPER_ADMIN'), createHoliday);

router.route('/:id')
    .put(authorize('SUPER_ADMIN'), updateHoliday)
    .delete(authorize('SUPER_ADMIN'), deleteHoliday);

module.exports = router;
