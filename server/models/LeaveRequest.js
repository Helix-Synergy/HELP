const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    leaveType: {
        type: String,
        enum: ['CASUAL_LEAVE', 'SICK_LEAVE', 'EARNED_LEAVE', 'MATERNITY_LEAVE', 'UNPAID_LEAVE'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['FULL_DAY', 'HALF_DAY', 'HOURLY'],
        default: 'FULL_DAY'
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
        default: 'PENDING'
    },
    approvedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
