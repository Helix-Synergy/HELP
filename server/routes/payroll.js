const express = require('express');
const {
    getMyPayslips,
    processPayroll,
    getPayrollSummary,
    getAttendanceSummary
} = require('../controllers/payroll');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// Payslips
router.get('/payslips/me', getMyPayslips);
router.get('/summary', authorize('SUPER_ADMIN', 'HR_ADMIN', 'FINANCE'), getPayrollSummary);
router.get('/attendance-summary', authorize('SUPER_ADMIN', 'HR_ADMIN', 'FINANCE'), getAttendanceSummary);
router.post('/process', authorize('SUPER_ADMIN', 'HR_ADMIN', 'FINANCE'), processPayroll);

module.exports = router;
