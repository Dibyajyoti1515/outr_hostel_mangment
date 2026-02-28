const { generateQRPayload, generateQRImage } = require('../utils/qrHelper');
const { getCurrentMeal } = require('../utils/dateHelper');

/**
 * GET /api/student/qr
 * Returns current meal QR code as base64 image + metadata
 */
const getQRCode = async (req, res) => {
    try {
        const student = req.user;
        const meal = getCurrentMeal();

        if (!meal) {
            return res.status(400).json({
                success: false,
                message: 'No active meal window right now',
                mealWindows: {
                    breakfast: `${process.env.BREAKFAST_START || 7}:00 - ${process.env.BREAKFAST_END || 10}:00`,
                    lunch: `${process.env.LUNCH_START || 12}:00 - ${process.env.LUNCH_END || 16}:00`,
                    dinner: `${process.env.DINNER_START || 19}:00 - ${process.env.DINNER_END || 22}:00`,
                },
            });
        }

        const { token, date, expiresIn, error } = generateQRPayload(student);

        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        const qrImage = await generateQRImage(token);

        res.json({
            success: true,
            qr: {
                image: qrImage, // base64 PNG data URL
                token,          // raw JWT (for apps that want to display custom QR)
                mealType: meal,
                date,
                expiresIn,      // seconds until expiry
                student: {
                    name: student.name,
                    registrationNo: student.registrationNo,
                    hostelName: student.hostelName,
                    badNo: student.badNo,
                },
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getQRCode };