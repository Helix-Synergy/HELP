const mongoose = require('mongoose');

const OnboardingDetailSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    documents: [
        {
            name: {
                type: String,
                required: true
            },
            required: {
                type: Boolean,
                default: true
            },
            fileUrl: {
                type: String
            },
            status: {
                type: String,
                enum: ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'],
                default: 'PENDING'
            },
            remarks: String,
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    personalForm: {
        fathersName: String,
        bloodGroup: String,
        dateOfBirth: Date,
        address: String,
        qualification: String,
        experienceYears: String,
        aadharNumber: String,
        panNumber: String,
        pfNumber: String,
        ctc: String,
        bankDetails: {
            accountHolderName: String,
            accountNumber: String,
            bankName: String,
            ifscCode: String,
            branchName: String
        },
        emergencyContact: {
            name: String,
            relationship: String,
            phone: String
        },
        insuranceDetails: {
            policyType: String,
            policyNumber: String
        },
        education: [
            {
                degree: String,
                institution: String,
                yearOfPassing: String,
                percentage: String
            }
        ],
        experience: [
            {
                company: String,
                designation: String,
                startDate: Date,
                endDate: Date
            }
        ],
        submittedAt: Date,
        status: {
            type: String,
            enum: ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'],
            default: 'PENDING'
        },
        remarks: String
    }
}, { timestamps: true });

module.exports = mongoose.model('OnboardingDetail', OnboardingDetailSchema);
