const mongoose = require('mongoose');

/**
 * FoodPreference stores per-student, per-date food choices.
 * One document per student per date.
 *
 * Selection must be made before midnight for the NEXT day.
 * If not selected, we fall back to the previous day's preference.
 */

const mealPrefSchema = new mongoose.Schema(
  {
    // breakfast has no veg/nonveg — it's just included/skipped
    selected: { type: Boolean, default: true },
    // veg/nonveg only for lunch & dinner
    type: {
      type: String,
      enum: ['veg', 'nonveg'],
      default: null,
    },
  },
  { _id: false }
);

const foodPreferenceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    hostelName: {
      type: String,
      required: true,
      index: true,
    },
    // Date string in YYYY-MM-DD (IST) — the date this preference is FOR
    date: {
      type: String,
      required: true,
      index: true,
    },
    breakfast: {
      selected: { type: Boolean, default: true },
    },
    lunch: mealPrefSchema,
    dinner: mealPrefSchema,
    // Track whether student manually selected (or it was auto-copied)
    isAutoFilled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Each student can only have one preference doc per date
foodPreferenceSchema.index({ student: 1, date: 1 }, { unique: true });
// For management dashboard queries by hostel + date
foodPreferenceSchema.index({ hostelName: 1, date: 1 });

module.exports = mongoose.model('FoodPreference', foodPreferenceSchema);
