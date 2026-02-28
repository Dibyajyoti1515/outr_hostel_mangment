const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const { getCurrentMeal, todayIST } = require('./dateHelper');

const QR_SECRET = process.env.QR_SECRET || 'qr_secret_change_me';

/**
 * Generate a signed JWT payload for QR code.
 * Token is valid for current meal window only.
 *
 * QR payload: { studentId, registrationNo, hostelName, date, mealType }
 * Signed with QR_SECRET, expires based on meal end time.
 */
const generateQRPayload = (student) => {
  const meal = getCurrentMeal();
  const date = todayIST();

  if (!meal) {
    return { error: 'No active meal window right now', meal: null };
  }

  // Calculate expiry based on meal end hour
  const mealEnds = {
    breakfast: parseInt(process.env.BREAKFAST_END || 10),
    lunch: parseInt(process.env.LUNCH_END || 16),
    dinner: parseInt(process.env.DINNER_END || 22),
  };

  const now = new Date();
  const todayUTC = new Date(now.toISOString().slice(0, 10) + 'T00:00:00Z');
  // IST offset: meal end is in IST, subtract 5h30m for UTC
  const mealEndUTC = new Date(
    todayUTC.getTime() + (mealEnds[meal] - 5.5) * 3600000
  );

  const expiresIn = Math.max(
    Math.floor((mealEndUTC.getTime() - now.getTime()) / 1000),
    60 // at least 1 min
  );

  const payload = {
    studentId: student._id.toString(),
    registrationNo: student.registrationNo,
    hostelName: student.hostelName,
    badNo: student.badNo,
    date,
    mealType: meal,
  };

  const token = jwt.sign(payload, QR_SECRET, { expiresIn });

  return { token, meal, date, expiresIn };
};

/**
 * Generate QR code as base64 PNG data URL
 */
const generateQRImage = async (token) => {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });
};

/**
 * Verify and decode a QR token (used by scanner)
 */
const verifyQRToken = (token) => {
  try {
    return jwt.verify(token, QR_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('QR code expired. Student must refresh their QR.');
    }
    throw new Error('Invalid QR code');
  }
};

module.exports = { generateQRPayload, generateQRImage, verifyQRToken };
