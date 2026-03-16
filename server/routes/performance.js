const express = require('express');
const { getMyReviews, getTeamReviews, createReview, updateReview } = require('../controllers/performance');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/me', getMyReviews);
router.get('/team', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), getTeamReviews);
router.post('/', createReview);
router.put('/:id', updateReview);

module.exports = router;
