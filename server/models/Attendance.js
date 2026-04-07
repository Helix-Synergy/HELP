const mongoose = require('mongoose');

const PunchSchema = new mongoose.Schema({
    punchIn: { type: Date, required: true },
    punchOut: { type: Date },
    punchInLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    punchOutLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    punchInIP: { type: String },
    punchOutIP: { type: String },
    punchInDevice: { type: String },
    punchOutDevice: { type: String },
    breaks: [{
        startTime: { type: Date },
        endTime: { type: Date }
    }]
});

const AttendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    punches: [PunchSchema],
    totalHours: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'REGULARIZED'],
        default: 'ABSENT'
    },
    overtimeHours: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
