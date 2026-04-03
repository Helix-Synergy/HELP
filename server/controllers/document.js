const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Document = require('../models/Document');
const cloudinary = require('cloudinary').v2;

// @desc    Upload document
// @route   POST /api/v1/documents
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    // Capture the Cloudinary URL from req.file.path (Cloudinary Storage provides this)
    const fileUrl = req.file.path;

    const docData = {
        user: req.user.id,
        uploadedBy: req.user.id,
        documentType: req.body.documentType || 'POLICY',
        title: req.body.title || req.file.originalname,
        fileUrl: fileUrl,
        // (Optional) Store public_id if needed for future deletion from cloudinary
        publicId: req.file.filename 
    };

    const doc = await Document.create(docData);
    res.status(201).json({ success: true, data: doc });
});

// @desc    Get documents by user
// @route   GET /api/v1/documents/:userId
// @access  Private
exports.getUserDocuments = asyncHandler(async (req, res, next) => {
    if (req.params.userId.toString() !== req.user.id.toString() && req.user.role === 'EMPLOYEE') {
        return next(new ErrorResponse(`Not authorized to access these documents`, 403));
    }

    const docs = await Document.find({ user: req.params.userId }).sort('-createdAt');
    res.status(200).json({ success: true, count: docs.length, data: docs });
});

// @desc    Get all documents (Admin/Managers Only)
// @route   GET /api/v1/documents/all
// @access  Private/Shared
exports.getAllDocuments = asyncHandler(async (req, res, next) => {
    const docs = await Document.find()
        .populate('user', 'firstName lastName')
        .populate('uploadedBy', 'firstName lastName')
        .sort('-createdAt');
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

    if (doc.user.toString() !== req.user.id && req.user.role === 'EMPLOYEE') {
        return next(new ErrorResponse(`Not authorized to delete this document`, 403));
    }

    // (Optional) Attempt to delete from Cloudinary if publicId exists
    if (doc.publicId) {
        try {
            await cloudinary.uploader.destroy(doc.publicId);
        } catch (err) {
            console.error("Failed to delete from Cloudinary:", err);
        }
    }

    await doc.deleteOne();
    res.status(200).json({ success: true, data: {} });
});
