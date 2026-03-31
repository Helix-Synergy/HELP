const express = require('express');
const { getSystemStats } = require('../controllers/dashboard');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/system-stats', getSystemStats);

module.exports = router;
