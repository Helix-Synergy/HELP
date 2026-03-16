const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE'],
        default: 'EMPLOYEE',
    },
    departmentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Department',
    },
    designation: {
        type: String,
    },
    managerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    joiningDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'PROBATION', 'NOTICE_PERIOD'],
        default: 'ACTIVE',
    },
    contactDetails: {
        phone: String,
        address: String,
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    maritalStatus: {
        type: String,
        enum: ['Married', 'Unmarried'],
    },
    workLocation: {
        type: String,
        default: 'Office',
    },
    profilePicture: {
        type: String,
        default: 'https://ui-avatars.com/api/?name=User&background=random',
    },
    resignationDate: {
        type: Date,
    },
    resignationReason: {
        type: String,
    }
}, {
    timestamps: true,
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Math user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
