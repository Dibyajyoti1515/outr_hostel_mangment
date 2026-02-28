const FoodPreference = require('../models/FoodPreference');
const { yesterdayIST } = require('../utils/dateHelper');

/**
 * Get food preference for a student on a given date.
 * If not found, auto-fills from previous day (or student's default).
 * 
 * @param {Object} student - Student document
 * @param {string} date - YYYY-MM-DD
 * @returns {Object} preference document
 */
const getOrAutoFillPreference = async (student, date) => {
    // Try to find existing preference
    let pref = await FoodPreference.findOne({
        student: student._id,
        date,
    });

    if (pref) return pref;

    // Auto-fill: look for previous day
    const prevDate = yesterdayIST(); // fallback: yesterday
    let prevPref = await FoodPreference.findOne({
        student: student._id,
        date: prevDate,
    });

    // Build new preference from previous or student default
    const defaultType = student.defaultFoodPref || 'veg';

    pref = await FoodPreference.create({
        student: student._id,
        hostelName: student.hostelName,
        date,
        breakfast: {
            selected: prevPref ? prevPref.breakfast.selected : true,
        },
        lunch: {
            selected: prevPref ? prevPref.lunch.selected : true,
            type: prevPref?.lunch?.type || defaultType,
        },
        dinner: {
            selected: prevPref ? prevPref.dinner.selected : true,
            type: prevPref?.dinner?.type || defaultType,
        },
        isAutoFilled: true,
    });

    return pref;
};

/**
 * Bulk ensure preferences exist for all students in a hostel for a date.
 * Used as a background job / on-demand to pre-populate.
 * 
 * @param {Array} students - Array of student docs
 * @param {string} date - YYYY-MM-DD
 */
const bulkEnsurePreferences = async (students, date) => {
    const existingPrefs = await FoodPreference.find({
        date,
        student: { $in: students.map((s) => s._id) },
    }).select('student');

    const existingIds = new Set(existingPrefs.map((p) => p.student.toString()));
    const missing = students.filter((s) => !existingIds.has(s._id.toString()));

    if (!missing.length) return;

    // Get previous day prefs for missing students
    const prevDate = yesterdayIST();
    const prevPrefs = await FoodPreference.find({
        date: prevDate,
        student: { $in: missing.map((s) => s._id) },
    });
    const prevMap = new Map(prevPrefs.map((p) => [p.student.toString(), p]));

    const toInsert = missing.map((s) => {
        const prev = prevMap.get(s._id.toString());
        const defaultType = s.defaultFoodPref || 'veg';
        return {
            student: s._id,
            hostelName: s.hostelName,
            date,
            breakfast: { selected: prev ? prev.breakfast.selected : true },
            lunch: {
                selected: prev ? prev.lunch.selected : true,
                type: prev?.lunch?.type || defaultType,
            },
            dinner: {
                selected: prev ? prev.dinner.selected : true,
                type: prev?.dinner?.type || defaultType,
            },
            isAutoFilled: true,
        };
    });

    // Use ordered:false for performance (skip duplicates on race condition)
    if (toInsert.length > 0) {
        await FoodPreference.insertMany(toInsert, {
            ordered: false,
            lean: true,
        }).catch(() => { }); // ignore duplicate key errors
    }
};

module.exports = { getOrAutoFillPreference, bulkEnsurePreferences };