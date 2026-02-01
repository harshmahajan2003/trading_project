const Notification = require("../models/Notification");

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
        res.json({ message: "Notifications marked as read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getMyNotifications, markAsRead };
