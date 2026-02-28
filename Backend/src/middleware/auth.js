const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Management = require('../models/Management');

const signToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

const verifyToken = (token) =>
    jwt.verify(token, process.env.JWT_SECRET);

// Generic auth middleware factory
const authenticate = (Model, role) => async (req, res, next) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = auth.split(' ')[1];
        const decoded = verifyToken(token);

        if (decoded.role !== role) {
            return res.status(403).json({ success: false, message: 'Unauthorized role' });
        }

        const user = await Model.findById(decoded.id).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Account not found or inactive' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

const studentAuth = authenticate(Student, 'student');

// Management auth - also attaches hostel scope
const managementAuth = async (req, res, next) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = auth.split(' ')[1];
        const decoded = verifyToken(token);

        if (decoded.role !== 'management') {
            return res.status(403).json({ success: false, message: 'Unauthorized role' });
        }

        const admin = await Management.findById(decoded.id).select('-password');
        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, message: 'Account not found or inactive' });
        }

        req.admin = admin;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

module.exports = { signToken, verifyToken, studentAuth, managementAuth };