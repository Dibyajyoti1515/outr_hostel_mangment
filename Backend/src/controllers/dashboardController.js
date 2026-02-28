const Student = require('../models/Student');
const FoodPreference = require('../models/FoodPreference');
const MealScan = require('../models/MealScan');
const { bulkEnsurePreferences } = require('../utils/prefService');
const { todayIST, tomorrowIST } = require('../utils/dateHelper');
const { cacheGet, cacheSet } = require('../config/redis');

/**
 * GET /api/management/dashboard
 * Query: ?date=YYYY-MM-DD (defaults to today)
 *
 * Returns:
 *  - Total students per hostel
 *  - Veg/NonVeg counts per meal
 *  - Students who haven't eaten (scanned) yet
 */
const getDashboard = async (req, res) => {
  try {
    const admin = req.admin;
    const date = req.query.date || todayIST();

    // Scope: hostel_admin sees only their hostel, super_admin can query any
    const hostelName =
      admin.role === 'super_admin'
        ? req.query.hostelName || admin.hostelName
        : admin.hostelName;

    if (!hostelName) {
      return res
        .status(400)
        .json({ success: false, message: 'hostelName required for super_admin' });
    }

    // Cache for 2 minutes (dashboard refreshes frequently)
    const cacheKey = `dashboard:${hostelName}:${date}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ success: true, ...JSON.parse(cached), cached: true });
    }

    // Fetch all active students in hostel
    const students = await Student.find({ hostelName, isActive: true }).lean();
    const studentIds = students.map((s) => s._id);
    const total = students.length;

    // Ensure preferences exist (auto-fill missing ones)
    await bulkEnsurePreferences(students, date);

    // Fetch preferences for the date
    const prefs = await FoodPreference.find({
      hostelName,
      date,
      student: { $in: studentIds },
    }).lean();

    // Aggregate counts
    const counts = {
      breakfast: { selected: 0, notSelected: 0 },
      lunch: { veg: 0, nonveg: 0, notSelected: 0 },
      dinner: { veg: 0, nonveg: 0, notSelected: 0 },
    };

    for (const p of prefs) {
      // Breakfast
      if (p.breakfast?.selected) counts.breakfast.selected++;
      else counts.breakfast.notSelected++;

      // Lunch
      if (p.lunch?.selected) {
        if (p.lunch.type === 'veg') counts.lunch.veg++;
        else counts.lunch.nonveg++;
      } else {
        counts.lunch.notSelected++;
      }

      // Dinner
      if (p.dinner?.selected) {
        if (p.dinner.type === 'veg') counts.dinner.veg++;
        else counts.dinner.nonveg++;
      } else {
        counts.dinner.notSelected++;
      }
    }

    // Fetch scan logs for the day
    const scans = await MealScan.find({ hostelName, date }).lean();
    const scannedMap = {};
    for (const scan of scans) {
      const id = scan.student.toString();
      if (!scannedMap[id]) scannedMap[id] = [];
      scannedMap[id].push(scan.mealType);
    }

    // Build not-eaten list
    const notEaten = {
      breakfast: [],
      lunch: [],
      dinner: [],
    };

    // Build student name map
    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

    for (const p of prefs) {
      const sid = p.student.toString();
      const student = studentMap.get(sid);
      const scanned = scannedMap[sid] || [];
      const info = {
        _id: sid,
        name: student?.name,
        registrationNo: student?.registrationNo,
        badNo: student?.badNo,
      };

      if (p.breakfast?.selected && !scanned.includes('breakfast')) {
        notEaten.breakfast.push(info);
      }
      if (p.lunch?.selected && !scanned.includes('lunch')) {
        notEaten.lunch.push(info);
      }
      if (p.dinner?.selected && !scanned.includes('dinner')) {
        notEaten.dinner.push(info);
      }
    }

    const result = {
      hostelName,
      date,
      totalStudents: total,
      counts,
      notEaten: {
        breakfast: { count: notEaten.breakfast.length, students: notEaten.breakfast },
        lunch: { count: notEaten.lunch.length, students: notEaten.lunch },
        dinner: { count: notEaten.dinner.length, students: notEaten.dinner },
      },
    };

    await cacheSet(cacheKey, JSON.stringify(result), 120);

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/management/students
 * Query: ?hostelName=RHR&page=1&limit=50&search=name_or_regNo
 */
const getStudents = async (req, res) => {
  try {
    const admin = req.admin;
    const hostelName =
      admin.role === 'super_admin'
        ? req.query.hostelName || admin.hostelName
        : admin.hostelName;

    const { page = 1, limit = 50, search } = req.query;

    const query = { hostelName, isActive: true };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { registrationNo: searchRegex },
        { badNo: searchRegex },
      ];
    }

    const result = await Student.paginate(query, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sort: { name: 1 },
      lean: true,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard, getStudents };
