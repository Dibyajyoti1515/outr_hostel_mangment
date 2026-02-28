const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { HOSTELS } = require('./Student');

const managementSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        // Which hostel this admin manages (null = super admin for all)
        hostelName: {
            type: String,
            enum: [...HOSTELS, null],
            default: null,
        },
        role: {
            type: String,
            enum: ['hostel_admin', 'super_admin'],
            default: 'hostel_admin',
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

managementSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

managementSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Management', managementSchema);