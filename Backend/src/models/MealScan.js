const mongoose = require('mongoose');

/**
 * MealScan records every time a student's QR is scanned for a meal.
 * Prevents double-scanning and tracks who ate / who didn't.
 */
const mealScanSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    hostelName: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      required: true,
    },
    foodType: {
      type: String,
      enum: ['veg', 'nonveg', 'breakfast'], // breakfast is just "breakfast"
    },
    scannedAt: { type: Date, default: Date.now },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Management',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate scans (one scan per meal per student per day)
mealScanSchema.index(
  { student: 1, date: 1, mealType: 1 },
  { unique: true }
);

// For management reports
mealScanSchema.index({ hostelName: 1, date: 1, mealType: 1 });

module.exports = mongoose.model('MealScan', mealScanSchema);
