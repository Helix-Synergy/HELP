const express = require('express');
const {
    getCourses,
    getMyEnrollments,
    enrollCourse,
    updateProgress,
    createCourse,
    syncUdemyCourses,
    assignCourse,
    uploadCertificate,
    getCompletions
} = require('../controllers/learning');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.use(protect);

router.get('/courses', getCourses);
router.post('/courses', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), createCourse);

router.get('/enrollments/me', getMyEnrollments);
router.post('/enrollments', enrollCourse);
router.put('/enrollments/:id', updateProgress);
router.post('/enrollments/:id/certificate', upload.single('file'), uploadCertificate);

// Admin / Manager Routes
router.post('/sync-udemy', authorize('SUPER_ADMIN', 'HR_ADMIN'), syncUdemyCourses);
router.post('/assign', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), assignCourse);
router.get('/completions', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), getCompletions);

module.exports = router;
