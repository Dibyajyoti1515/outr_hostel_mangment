const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const mongoosePaginate = require('mongoose-paginate-v2');

const HOSTELS = ['RHR', 'APJ', 'KHR', 'KCHR'];
const FOOD_PREF = ['veg', 'nonveg'];

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    registrationNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    contactNo: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/,
    },
    // badNo = full string like "3321" (room 332, bed 1)
    badNo: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v) => /^\d{3,4}$/.test(v),
        message: 'Bad number must be 3-4 digits (e.g. 3321)',
      },
    },
    hostelName: {
      type: String,
      required: true,
      enum: HOSTELS,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Default food preference (used as fallback when student doesn't select)
    defaultFoodPref: {
      type: String,
      enum: FOOD_PREF,
      default: 'veg',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before save
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Extract room number from badNo (first 3 digits)
studentSchema.virtual('roomNo').get(function () {
  return this.badNo.slice(0, -1);
});

studentSchema.plugin(mongoosePaginate);

// Compound index for hostel dashboard queries
studentSchema.index({ hostelName: 1, isActive: 1 });

module.exports = mongoose.model('Student', studentSchema);
module.exports.HOSTELS = HOSTELS;
