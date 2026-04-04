const express = require('express');
const { getSystemStats, getManagerStats } = require('../controllers/dashboard');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/system-stats', authorize('SUPER_ADMIN'), getSystemStats);
router.get('/manager-stats', authorize('MANAGER', 'SUPER_ADMIN'), getManagerStats);

module.exports = router;
