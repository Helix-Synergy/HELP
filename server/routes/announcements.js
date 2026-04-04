const express = require('express');
const { getAnnouncements, createAnnouncement } = require('../controllers/announcements');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('SUPER_ADMIN'), createAnnouncement);

module.exports = router;
