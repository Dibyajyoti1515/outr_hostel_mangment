const Student = require('../models/Student');
const { signToken } = require('../middleware/auth');

/**
 * POST /api/student/login
 * Body: { registrationNo, password }
 */
const login = async (req, res) => {
    try {
        const { registrationNo, password } = req.body;

        if (!registrationNo || !password) {
            return res.status(400).json({
                success: false,
                message: 'Registration number and password required',
            });
        }

        const student = await Student.findOne({
            registrationNo: registrationNo.toUpperCase(),
            isActive: true,
        }).select('+password');

        if (!student || !(await student.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const token = signToken({ id: student._id, role: 'student' });

        // Return student without password
        const studentData = student.toObject();
        delete studentData.password;

        res.json({
            success: true,
            token,
            student: studentData,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/student/profile
 */
const getProfile = async (req, res) => {
    res.json({ success: true, student: req.user });
};

module.exports = { login, getProfile };