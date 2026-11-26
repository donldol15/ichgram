const Notification = require('../models/notificationModel');

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id
        })
            .populate('sender', 'username avatar')
            .populate('post', 'image caption')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Notifications retrieved successfully',
            count: notifications.length,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            message: 'Notifications error',
            error: error.message
        });
    }
};

const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user._id
            },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        res.status(500).json({
            message: 'Notification error',
            error: error.message
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead
};