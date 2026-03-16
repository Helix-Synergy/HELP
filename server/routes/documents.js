const express = require('express');
const { uploadDocument, getUserDocuments, getAllDocuments, deleteDocument } = require('../controllers/document');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.use(protect);
router.post('/', upload.single('file'), uploadDocument);
router.get('/all', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), getAllDocuments);
router.get('/:userId', getUserDocuments);
router.delete('/:id', deleteDocument);

module.exports = router;
