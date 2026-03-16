const mongoose = require('mongoose');

const BalanceItemSchema = new mongoose.Schema({
    leaveType: {
        type: String,
        enum: ['CASUAL_LEAVE', 'SICK_LEAVE', 'EARNED_LEAVE', 'MATERNITY_LEAVE', 'UNPAID_LEAVE'],
        required: true
    },
    totalAllocated: { type: Number, required: true },
    used: { type: Number, default: 0 },
    pendingApproval: { type: Number, default: 0 }
});

const LeaveBalanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    balances: [BalanceItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('LeaveBalance', LeaveBalanceSchema);
