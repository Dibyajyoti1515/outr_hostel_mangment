const express = require('express');
const router = express.Router();
const { managementAuth } = require('../middleware/auth');
const { login, getProfile } = require('../controllers/managementAuthController');
const { getDashboard, getStudents } = require('../controllers/dashboardController');
const { scanQR, getScanHistory } = require('../controllers/scanController');
const {
    createStudent,
    bulkCreateStudents,
    updateStudent,
    resetPassword,
} = require('../controllers/studentMgmtController');

// Public
router.post('/login', login);

// Protected
router.get('/profile', managementAuth, getProfile);

// Dashboard
router.get('/dashboard', managementAuth, getDashboard);

// Students
router.get('/students', managementAuth, getStudents);
router.post('/students', managementAuth, createStudent);
router.post('/students/bulk', managementAuth, bulkCreateStudents);
router.patch('/students/:id', managementAuth, updateStudent);
router.post('/students/:id/reset-password', managementAuth, resetPassword);

// QR scanner
router.post('/scan', managementAuth, scanQR);
router.get('/scan/history', managementAuth, getScanHistory);

module.exports = router;