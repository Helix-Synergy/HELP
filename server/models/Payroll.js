const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: String, // e.g., '2026-03'
        required: true
    },
    basicSalary: {
        type: Number,
        required: true
    },
    allowances: {
        type: Number,
        default: 0
    },
    deductions: {
        type: Number,
        default: 0
    },
    netPay: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['DRAFT', 'PROCESSED', 'PAID'],
        default: 'DRAFT'
    }
}, { timestamps: true });

module.exports = mongoose.model('Payroll', PayrollSchema);
