const mongoose = require('mongoose');

const PerformanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    reviewCycle: {
        type: String, // e.g., 'Q1 2026', 'Annual 2026'
        required: true
    },
    goals: [{
        title: { type: String, required: true },
        description: { type: String },
        weightage: { type: Number, default: 0 },
        selfRating: { type: Number, min: 1, max: 5 },
        managerRating: { type: Number, min: 1, max: 5 }
    }],
    overallRating: {
        type: Number,
        min: 1,
        max: 5
    },
    feedback: {
        type: String
    },
    status: {
        type: String,
        enum: ['DRAFT', 'SELF_REVIEWED', 'MANAGER_REVIEWED', 'COMPLETED'],
        default: 'DRAFT'
    },
    managerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Performance', PerformanceSchema);
