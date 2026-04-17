const express = require('express');
const {
    applyRegularization,
    getMyRegularizations,
    getRegularizations,
    updateRegularizationStatus
} = require('../controllers/regularization');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
    .route('/')
    .get(authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), getRegularizations)
    .post(applyRegularization);

router.get('/me', getMyRegularizations);

router.put('/:id/status', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), updateRegularizationStatus);

module.exports = router;
