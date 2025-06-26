// services/notificationService.js
const Notification = require('../models/Notification');

class NotificationService {
  static async createNotification({
    userId,
    message,
    type = 'system',
    metadata = {}
  }) {
    try {
      // 1. Save to database
      const notification = await Notification.create({
        user: userId,
        message,
        type,
        metadata
      });

      // 2. Send real-time notification
      if (global.io && userSocketMap.has(userId.toString())) {
        global.io.to(userId.toString()).emit('new_notification', {
          _id: notification._id,
          message,
          type,
          createdAt: notification.createdAt,
          isRead: false
        });
      }

      return notification;
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  static async getUserNotifications(userId, page = 1, limit = 10) {
    const options = {
      page,
      limit,
      sort: { createdAt: -1 }
    };

    return await Notification.aggregatePaginate(
      { user: userId },
      options
    );
  }
}

module.exports = NotificationService;