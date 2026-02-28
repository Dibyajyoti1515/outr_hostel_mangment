const Management = require('../models/Management');
const { signToken } = require('../middleware/auth');

/**
 * POST /api/management/login
 * Body: { email, password }
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        const admin = await Management.findOne({
            email: email.toLowerCase(),
            isActive: true,
        }).select('+password');

        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = signToken({ id: admin._id, role: 'management' });

        const adminData = admin.toObject();
        delete adminData.password;

        res.json({ success: true, token, admin: adminData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/management/profile
 */
const getProfile = async (req, res) => {
    res.json({ success: true, admin: req.admin });
};

module.exports = { login, getProfile };