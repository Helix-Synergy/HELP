const express = require('express');
const {
    getMyAssets,
    getAssets,
    createAsset,
    assignAsset,
    returnAsset
} = require('../controllers/assets');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/me', getMyAssets);

// Admin / HR routes
router.use(authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'));
router.get('/', getAssets);
router.post('/', createAsset);
router.put('/:id/assign', assignAsset);
router.put('/:id/return', returnAsset);

module.exports = router;
