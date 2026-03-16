const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['COMPLIANCE', 'TECHNICAL', 'SOFT_SKILLS', 'LEADERSHIP', 'ONBOARDING'],
        required: true
    },
    durationMinutes: {
        type: Number,
        default: 30
    },
    videoUrl: {
        type: String,
        default: ''
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    mandatory: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);
