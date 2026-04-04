const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add an event title'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Please add an event date']
    },
    description: {
        type: String
    },
    location: {
        type: String,
        default: 'Office'
    },
    time: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
