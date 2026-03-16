const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    requesterId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['IT_SUPPORT', 'HR_QUERY', 'PAYROLL_ISSUE', 'FACILITY'],
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        default: 'OPEN'
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    comments: [{
        userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
        text: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);
