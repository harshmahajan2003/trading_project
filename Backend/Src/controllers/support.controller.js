const emailService = require("../services/emailService");

exports.submitSupport = async (req, res) => {
    try {
        const { subject, message } = req.body;
        const user = req.user;

        if (!subject || !message) {
            return res.status(400).json({ message: "Bhai, subject aur message dono chahiye!" });
        }

        // Send email to admin
        await emailService.sendSupportEmail(user, subject, message);

        res.status(200).json({
            message: "Aapka message mil gaya hai! Hum jald hi aapse contact karenge."
        });
    } catch (err) {
        console.error("🔥 Support Error:", err);
        res.status(500).json({ message: "Message bhejne mein error aaya. Please try again." });
    }
};
