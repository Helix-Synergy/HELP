const express = require('express');
const {
    triggerOnboarding,
    getMyOnboarding,
    uploadDocument,
    verifyDocuments,
    submitForm,
    verifyForm,
    getOnboardingByUser,
    getUserTasks,
    getMyAssignedTasks,
    createTask,
    completeTask
} = require('../controllers/onboarding');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.use(protect);

// New Workflow Routes
router.get('/me', getMyOnboarding);
router.post('/trigger/:userId', authorize('SUPER_ADMIN', 'HR_ADMIN'), triggerOnboarding);
router.post('/upload/:docId', upload.single('file'), uploadDocument);
router.put('/verify-docs/:userId', authorize('SUPER_ADMIN', 'HR_ADMIN'), verifyDocuments);
router.post('/submit-form', submitForm);
router.put('/verify-form/:userId', authorize('SUPER_ADMIN', 'HR_ADMIN'), verifyForm);
router.get('/user/:userId', authorize('SUPER_ADMIN', 'HR_ADMIN'), getOnboardingByUser);

// Legacy/Task-based Routes
router.get('/assigned/me', getMyAssignedTasks);
router.get('/:userId', getUserTasks);
router.post('/', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), createTask);
router.put('/:id/complete', completeTask);

module.exports = router;
