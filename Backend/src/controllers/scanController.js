const { verifyQRToken } = require('../utils/qrHelper');
const MealScan = require('../models/MealScan');
const FoodPreference = require('../models/FoodPreference');
const Student = require('../models/Student');
const { todayIST } = require('../utils/dateHelper');
const { cacheDel } = require('../config/redis');

/**
 * POST /api/management/scan
 * Body: { token }  (the JWT from the student's QR code)
 *
 * Flow:
 * 1. Verify QR token
 * 2. Check hostel match (admin can only scan their hostel)
 * 3. Check for duplicate scan
 * 4. Lookup student's food preference
 * 5. Record scan → return food type to serve
 */
const scanQR = async (req, res) => {
  try {
    const admin = req.admin;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'QR token required' });
    }

    // Decode QR
    let decoded;
    try {
      decoded = verifyQRToken(token);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const { studentId, registrationNo, hostelName, badNo, date, mealType } = decoded;

    // Hostel scope check
    if (admin.role !== 'super_admin' && admin.hostelName !== hostelName) {
      return res.status(403).json({
        success: false,
        message: `This student belongs to ${hostelName}, not your hostel (${admin.hostelName})`,
      });
    }

    // Verify it's still today
    if (date !== todayIST()) {
      return res.status(400).json({
        success: false,
        message: 'QR code is from a different day',
      });
    }

    // Check duplicate scan
    const existingScan = await MealScan.findOne({
      student: studentId,
      date,
      mealType,
    });

    if (existingScan) {
      return res.status(409).json({
        success: false,
        message: `Already scanned for ${mealType} today`,
        scannedAt: existingScan.scannedAt,
      });
    }

    // Get food preference for today
    const pref = await FoodPreference.findOne({
      student: studentId,
      date,
    });

    // Check if student opted in for this meal
    const mealPref = pref?.[mealType];
    if (mealPref && mealPref.selected === false) {
      return res.status(400).json({
        success: false,
        message: `Student opted out of ${mealType} today`,
      });
    }

    // Determine food type
    let foodType;
    if (mealType === 'breakfast') {
      foodType = 'breakfast';
    } else {
      foodType = mealPref?.type || pref?.lunch?.type || 'veg';
    }

    // Record the scan
    const scan = await MealScan.create({
      student: studentId,
      hostelName,
      date,
      mealType,
      foodType,
      scannedBy: admin._id,
    });

    // Invalidate dashboard cache
    await cacheDel(`dashboard:${hostelName}:${date}`);

    // Get student name for display
    const student = await Student.findById(studentId).select('name registrationNo badNo').lean();

    res.json({
      success: true,
      message: `✅ ${mealType.toUpperCase()} served`,
      student: {
        name: student?.name,
        registrationNo,
        badNo,
        hostelName,
      },
      meal: {
        type: mealType,
        foodType,
        serveLabel:
          mealType === 'breakfast'
            ? '🍳 Breakfast'
            : foodType === 'veg'
            ? '🥦 Veg'
            : '🍗 Non-Veg',
      },
      scannedAt: scan.scannedAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/management/scan/history
 * Query: ?date=YYYY-MM-DD&mealType=lunch&hostelName=RHR
 */
const getScanHistory = async (req, res) => {
  try {
    const admin = req.admin;
    const { date = todayIST(), mealType, hostelName: queryHostel } = req.query;

    const hostelName =
      admin.role === 'super_admin' ? queryHostel || admin.hostelName : admin.hostelName;

    const filter = { hostelName, date };
    if (mealType) filter.mealType = mealType;

    const scans = await MealScan.find(filter)
      .populate('student', 'name registrationNo badNo')
      .sort({ scannedAt: -1 })
      .lean();

    res.json({ success: true, count: scans.length, scans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { scanQR, getScanHistory };
