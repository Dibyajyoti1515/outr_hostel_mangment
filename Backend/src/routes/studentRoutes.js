const express = require('express');
const router = express.Router();
const { studentAuth } = require('../middleware/auth');
const { login, getProfile } = require('../controllers/studentAuthController');
const { getPreference, getCalendar, setPreference } = require('../controllers/foodPrefController');
const { getQRCode } = require('../controllers/qrController');

// Public
router.post('/login', login);

// Protected
router.get('/profile', studentAuth, getProfile);

// Food preference
router.get('/food/preference', studentAuth, getPreference);
router.get('/food/calendar', studentAuth, getCalendar);
router.put('/food/preference', studentAuth, setPreference);

// QR code generation
router.get('/qr', studentAuth, getQRCode);

module.exports = router;