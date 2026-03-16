const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['LAPTOP', 'MONITOR', 'MOBILE', 'ACCESSORY', 'FURNITURE', 'OTHER'],
        required: true
    },
    serialNumber: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'ASSIGNED', 'IN_REPAIR', 'RETIRED'],
        default: 'AVAILABLE'
    },
    condition: {
        type: String,
        enum: ['NEW', 'GOOD', 'FAIR', 'POOR'],
        default: 'NEW'
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null
    },
    assignmentDate: {
        type: Date,
        default: null
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    cost: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Asset', AssetSchema);
