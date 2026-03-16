const mongoose = require('mongoose');

const OnboardingTaskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    type: {
        type: String,
        enum: ['ONBOARDING', 'OFFBOARDING'],
        default: 'ONBOARDING'
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Who needs to complete the task (IT for laptop, Employee for forms)
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'],
        default: 'PENDING'
    },
    completedAt: {
        type: Date
    },
    completedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('OnboardingTask', OnboardingTaskSchema);
