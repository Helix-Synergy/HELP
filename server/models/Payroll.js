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
    // Earnings Breakdown
    basic: { type: Number, required: true },
    hra: { type: Number, default: 0 },
    conveyance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    phoneInternetAllowance: { type: Number, default: 0 },
    booksPeriodicalsAllowance: { type: Number, default: 0 },
    gadgetsAllowance: { type: Number, default: 0 },
    performanceAllowance: { type: Number, default: 0 },
    gratuity: { type: Number, default: 0 },
    pfComponent: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    
    // Deductions
    providentFund: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    healthInsurance: { type: Number, default: 0 },
    incomeTax: { type: Number, default: 0 },
    lopDeductions: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },

    // Employer Contributions
    employerPF: { type: Number, default: 0 },
    employerESI: { type: Number, default: 0 },

    // Summary
    totalEarnings: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netPay: { type: Number, required: true },

    // Attendance Info
    attendance: {
        totalDays: { type: Number, default: 0 },
        presentDays: { type: Number, default: 0 },
        lopDays: { type: Number, default: 0 },
        performanceFactor: { type: Number, default: 100 }
    },

    status: {
        type: String,
        enum: ['DRAFT', 'PROCESSED', 'PAID', 'VOID'],
        default: 'DRAFT'
    }
}, { timestamps: true });

module.exports = mongoose.model('Payroll', PayrollSchema);
