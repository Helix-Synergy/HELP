const mongoose = require('mongoose');

const TimesheetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    weekStartDate: {
        type: Date,
        required: true
    },
    weekEndDate: {
        type: Date,
        required: true
    },
    entries: [{
        project: {
            type: mongoose.Schema.ObjectId,
            ref: 'Project',
            required: true
        },
        taskDescription: {
            type: String,
            required: true
        },
        isBillable: {
            type: Boolean,
            default: true
        },
        hours: {
            monday: { type: Number, default: 0 },
            tuesday: { type: Number, default: 0 },
            wednesday: { type: Number, default: 0 },
            thursday: { type: Number, default: 0 },
            friday: { type: Number, default: 0 },
            saturday: { type: Number, default: 0 },
            sunday: { type: Number, default: 0 }
        }
    }],
    totalHours: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
        default: 'DRAFT'
    },
    approvedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    managerComments: {
        type: String
    }
}, { timestamps: true });

// Pre-save middleware to calculate total weekly hours across all projects
TimesheetSchema.pre('save', function () {
    let total = 0;
    if (this.entries) {
        this.entries.forEach(entry => {
            if (entry.hours) {
                total += (entry.hours.monday || 0) +
                        (entry.hours.tuesday || 0) +
                        (entry.hours.wednesday || 0) +
                        (entry.hours.thursday || 0) +
                        (entry.hours.friday || 0) +
                        (entry.hours.saturday || 0) +
                        (entry.hours.sunday || 0);
            }
        });
    }
    this.totalHours = total;
});

module.exports = mongoose.model('Timesheet', TimesheetSchema);
