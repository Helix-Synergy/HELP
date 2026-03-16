const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    documentType: {
        type: String,
        enum: ['OFFER_LETTER', 'ID_PROOF', 'CERTIFICATE', 'POLICY', 'OTHER'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
