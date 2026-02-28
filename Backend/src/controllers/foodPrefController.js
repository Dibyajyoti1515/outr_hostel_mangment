const FoodPreference = require('../models/FoodPreference');
const { getOrAutoFillPreference } = require('../utils/prefService');
const { tomorrowIST, todayIST, getCalendarDates } = require('../utils/dateHelper');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');

/**
 * GET /api/student/food/preference
 * Query: ?date=YYYY-MM-DD (defaults to tomorrow — next day selection)
 */
const getPreference = async (req, res) => {
  try {
    const student = req.user;
    const date = req.query.date || tomorrowIST();

    const pref = await getOrAutoFillPreference(student, date);

    res.json({ success: true, preference: pref, date });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/student/food/calendar
 * Returns preferences for next 7 days (auto-filled where missing)
 */
const getCalendar = async (req, res) => {
  try {
    const student = req.user;
    const dates = getCalendarDates(7);

    // Fetch all at once
    const prefs = await FoodPreference.find({
      student: student._id,
      date: { $in: dates },
    }).lean();

    const prefMap = new Map(prefs.map((p) => [p.date, p]));

    // Fill in missing dates with auto-fill info
    const calendar = await Promise.all(
      dates.map(async (date) => {
        if (prefMap.has(date)) return { date, ...prefMap.get(date) };
        const p = await getOrAutoFillPreference(student, date);
        return { date, ...p.toObject() };
      })
    );

    res.json({ success: true, calendar });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/student/food/preference
 * Body: { date, breakfast: {selected}, lunch: {selected, type}, dinner: {selected, type} }
 * Students can only set preference for TOMORROW (the next day).
 */
const setPreference = async (req, res) => {
  try {
    const student = req.user;
    const { date, breakfast, lunch, dinner } = req.body;

    const tomorrow = tomorrowIST();
    const today = todayIST();

    // Allow selecting for tomorrow or any future date (up to 7 days)
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    if (date <= today) {
      return res.status(400).json({
        success: false,
        message: 'You can only set preferences for tomorrow or future dates',
      });
    }

    // Validate food types for lunch/dinner
    const validTypes = ['veg', 'nonveg'];
    if (lunch?.type && !validTypes.includes(lunch.type)) {
      return res.status(400).json({ success: false, message: 'Invalid lunch type' });
    }
    if (dinner?.type && !validTypes.includes(dinner.type)) {
      return res.status(400).json({ success: false, message: 'Invalid dinner type' });
    }

    const update = {
      hostelName: student.hostelName,
      isAutoFilled: false,
    };
    if (breakfast !== undefined) update.breakfast = { selected: !!breakfast.selected };
    if (lunch !== undefined) {
      update.lunch = {
        selected: lunch.selected !== undefined ? !!lunch.selected : true,
        type: lunch.type || 'veg',
      };
    }
    if (dinner !== undefined) {
      update.dinner = {
        selected: dinner.selected !== undefined ? !!dinner.selected : true,
        type: dinner.type || 'veg',
      };
    }

    const pref = await FoodPreference.findOneAndUpdate(
      { student: student._id, date },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    );

    // Invalidate dashboard cache for this hostel+date
    await cacheDel(`dashboard:${student.hostelName}:${date}`);

    res.json({ success: true, preference: pref });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPreference, getCalendar, setPreference };
