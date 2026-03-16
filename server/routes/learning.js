const express = require('express');
const {
    getCourses,
    getMyEnrollments,
    enrollCourse,
    updateProgress,
    createCourse
} = require('../controllers/learning');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/courses', getCourses);
router.post('/courses', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), createCourse);

router.get('/enrollments/me', getMyEnrollments);
router.post('/enrollments', enrollCourse);
router.put('/enrollments/:id', updateProgress);

module.exports = router;
