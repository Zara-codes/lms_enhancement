// server/services/notificationService.js
import Notification from '../models/Notification.js';

export default class NotificationService {
  static async create({ userId, message, type = 'system', link = null }) {
    try {
      // 1. Save to database
      const notification = await Notification.create({
        user: userId,
        message,
        type,
        link
      });

      // 2. Send real-time notification
      if (global.io && global.userSocketMap.has(userId.toString())) {
        global.io.to(userId.toString()).emit('new_notification', {
          _id: notification._id,
          message,
          type,
          isRead: false,
          link,
          createdAt: notification.createdAt
        });
      }

      return notification;
    } catch (error) {
      console.error('Notification error:', error);
      throw error;
    }
  }

  // Fetch user notifications (paginated)
  static async getUserNotifications(userId, page = 1, limit = 10) {
    return await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }
}