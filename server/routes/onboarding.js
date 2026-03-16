const express = require('express');
const {
    getUserTasks,
    getMyAssignedTasks,
    createTask,
    completeTask
} = require('../controllers/onboarding');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/assigned/me', getMyAssignedTasks);
router.get('/:userId', getUserTasks);
router.post('/', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), createTask);
router.put('/:id/complete', completeTask);

module.exports = router;
