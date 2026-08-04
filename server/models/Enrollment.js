const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Course',
        required: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
        default: 'NOT_STARTED'
    },
    assignmentType: {
        type: String,
        enum: ['SELF', 'ADMIN_ASSIGNED'],
        default: 'SELF'
    },
    assignedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    dueDate: {
        type: Date
    },
    certificateUrl: {
        type: String
    },
    certificateUploadDate: {
        type: Date
    },
    progressPercent: {
        type: Number,
        default: 0
    },
    completionDate: {
        type: Date
    }
}, { timestamps: true });

// Prevent duplicate enrollments
EnrollmentSchema.index({ courseId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
