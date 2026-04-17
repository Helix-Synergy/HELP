const mongoose = require('mongoose');

const regularizationRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    attendanceId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Attendance'
    },
    date: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: [true, 'Please add a reason for regularization'],
        maxlength: [500, 'Reason cannot be more than 500 characters']
    },
    type: {
        type: String,
        enum: ['MISSING_PUNCH', 'LATE_ARRIVAL', 'EARLY_EXIT', 'FORGOT_PUNCH_IN', 'OTHER'],
        default: 'MISSING_PUNCH'
    },
    proposedPunches: [{
        punchIn: { type: Date, required: true },
        punchOut: { type: Date, required: true }
    }],
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    approvedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    adminComments: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RegularizationRequest', regularizationRequestSchema);
