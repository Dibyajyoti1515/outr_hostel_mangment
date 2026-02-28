const Student = require('../models/Student');
const { HOSTELS } = require('../models/Student');

/**
 * POST /api/management/students
 * Register a new student (management only)
 */
const createStudent = async (req, res) => {
    try {
        const { name, registrationNo, contactNo, badNo, hostelName, password, defaultFoodPref } =
            req.body;

        const admin = req.admin;

        // hostel_admin can only create students for their hostel
        const targetHostel =
            admin.role === 'super_admin' ? hostelName : admin.hostelName;

        if (!HOSTELS.includes(targetHostel)) {
            return res
                .status(400)
                .json({ success: false, message: `Invalid hostel. Valid: ${HOSTELS.join(', ')}` });
        }

        const existing = await Student.findOne({ registrationNo: registrationNo?.toUpperCase() });
        if (existing) {
            return res
                .status(409)
                .json({ success: false, message: 'Registration number already exists' });
        }

        const student = await Student.create({
            name,
            registrationNo,
            contactNo,
            badNo,
            hostelName: targetHostel,
            password: password || registrationNo, // default password = reg no
            defaultFoodPref: defaultFoodPref || 'veg',
        });

        const studentData = student.toObject();
        delete studentData.password;

        res.status(201).json({ success: true, student: studentData });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'Duplicate entry' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/management/students/bulk
 * Bulk import students from array
 */
const bulkCreateStudents = async (req, res) => {
    try {
        const { students } = req.body;
        const admin = req.admin;

        if (!Array.isArray(students) || !students.length) {
            return res.status(400).json({ success: false, message: 'students array required' });
        }

        const docs = students.map((s) => ({
            ...s,
            hostelName: admin.role === 'super_admin' ? s.hostelName : admin.hostelName,
            password: s.password || s.registrationNo,
        }));

        // Bulk insert with individual password hashing
        const bcrypt = require('bcryptjs');
        const hashed = await Promise.all(
            docs.map(async (s) => ({
                ...s,
                password: await bcrypt.hash(s.password, 12),
                registrationNo: s.registrationNo?.toUpperCase(),
            }))
        );

        const result = await Student.insertMany(hashed, { ordered: false });

        res.status(201).json({
            success: true,
            inserted: result.length,
            message: `${result.length} students imported`,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PATCH /api/management/students/:id
 * Update student details
 */
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = req.admin;

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Scope check
        if (admin.role !== 'super_admin' && student.hostelName !== admin.hostelName) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const allowed = ['name', 'contactNo', 'badNo', 'defaultFoodPref', 'isActive'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        const updated = await Student.findByIdAndUpdate(id, updates, { new: true });
        res.json({ success: true, student: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/management/students/:id/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ success: false, message: 'Not found' });

        student.password = newPassword || student.registrationNo;
        await student.save();

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { createStudent, bulkCreateStudents, updateStudent, resetPassword };