const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a holiday name'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Please add a holiday date'],
        unique: true
    },
    type: {
        type: String,
        enum: ['NATIONAL', 'REGIONAL', 'COMPANY'],
        default: 'NATIONAL'
    },
    description: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', HolidaySchema);
