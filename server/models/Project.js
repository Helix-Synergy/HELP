const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a project name'],
        trim: true,
        maxlength: [100, 'Name can not be more than 100 characters']
    },
    projectCode: {
        type: String,
        required: [true, 'Please add a project code'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    client: {
        type: String,
        required: [true, 'Please add a client name']
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
        default: 'ACTIVE'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    managerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
