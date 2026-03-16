const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

// @desc    Upload document
// @route   POST /api/v1/documents
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    // Build the URL (assumes server is accessible via HTTP on the host)
    // For local dev, we use the relative path, or full protocol if provided
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    const docData = {
        user: req.user.id,
        uploadedBy: req.user.id,
        documentType: req.body.documentType || 'POLICY',
        title: req.body.title || req.file.originalname,
        fileUrl: fileUrl,
    };

    const doc = await Document.create(docData);
    res.status(201).json({ success: true, data: doc });
});

// @desc    Get documents by user
// @route   GET /api/v1/documents/:userId
// @access  Private
exports.getUserDocuments = asyncHandler(async (req, res, next) => {
    // Basic protection: Users can only see their own docs, OR admins can see all
    if (req.params.userId.toString() !== req.user.id.toString() && req.user.role === 'EMPLOYEE') {
        return next(new ErrorResponse(`Not authorized to access these documents`, 403));
    }

    const docs = await Document.find({ user: req.params.userId }).sort('-createdAt');
    res.status(200).json({ success: true, count: docs.length, data: docs });
});

// @desc    Get all documents (Admin only)
// @route   GET /api/v1/documents/all
// @access  Private/Admin
exports.getAllDocuments = asyncHandler(async (req, res, next) => {
    const docs = await Document.find().populate('user', 'firstName lastName').populate('uploadedBy', 'firstName lastName').sort('-createdAt');
    res.status(200).json({ success: true, count: docs.length, data: docs });
});

// @desc    Delete document
// @route   DELETE /api/v1/documents/:id
// @access  Private
exports.deleteDocument = asyncHandler(async (req, res, next) => {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
        return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
    }

    // Ensure user owns the doc OR is admin
    if (doc.user.toString() !== req.user.id && req.user.role === 'EMPLOYEE') {
        return next(new ErrorResponse(`Not authorized to delete this document`, 403));
    }

    // Attempt to delete physical file from /uploads folder
    try {
        const urlObj = new URL(doc.fileUrl); // will parse http://localhost:5000/uploads/file.pdf
        const filename = path.basename(urlObj.pathname);
        const physicalPath = path.join(__dirname, '../../uploads', filename);

        if (fs.existsSync(physicalPath)) {
            fs.unlinkSync(physicalPath);
        }
    } catch (err) {
        console.error("Failed to delete physical file:", err);
    }

    await doc.deleteOne();

    res.status(200).json({ success: true, data: {} });
});
