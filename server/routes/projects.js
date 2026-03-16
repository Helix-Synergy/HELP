const express = require('express');
const { getProjects, createProject } = require('../controllers/project');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.get('/', getProjects);
router.post('/', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), createProject);

module.exports = router;
