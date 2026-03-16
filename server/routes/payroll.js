const express = require('express');
const {
    getMyPayslips,
    processPayroll
} = require('../controllers/payroll');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// Payslips
router.get('/payslips/me', getMyPayslips);
router.post('/process', authorize('SUPER_ADMIN', 'HR_ADMIN', 'FINANCE'), processPayroll);

module.exports = router;
