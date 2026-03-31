const express = require('express');
const { applyLeave, getMyLeaves, getLeaves, updateLeaveStatus, getLeaveBalance, getAllLeaveBalances } = require('../controllers/leave');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/balance', getLeaveBalance);
router.get('/all-balances', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), getAllLeaveBalances);
router.post('/apply', applyLeave);
router.get('/me', getMyLeaves);
router.get('/', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), getLeaves);
router.put('/:id/status', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), updateLeaveStatus);

module.exports = router;
