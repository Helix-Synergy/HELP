const mongoose = require('mongoose');

const TimesheetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    tasks: [{
        description: {
            type: String,
            required: true
        },
        hours: {
            type: Number,
            required: true
        }
    }],
    totalHours: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['SUBMITTED'],
        default: 'SUBMITTED'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure unique log per user per day
TimesheetSchema.index({ user: 1, date: 1 }, { unique: true });

// Pre-save middleware to calculate total daily hours
TimesheetSchema.pre('save', function (next) {
    let total = 0;
    if (this.tasks) {
        this.tasks.forEach(task => {
            total += (Number(task.hours) || 0);
        });
    }
    this.totalHours = total;
    next();
});

module.exports = mongoose.model('Timesheet', TimesheetSchema);
