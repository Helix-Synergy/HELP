const express = require('express');
const { getEvents, createEvent } = require('../controllers/events');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getEvents);
router.post('/', authorize('SUPER_ADMIN'), createEvent);

module.exports = router;
