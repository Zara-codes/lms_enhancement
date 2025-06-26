// controllers/fineController.js
const NotificationService = require('../services/notificationService');

exports.createFine = async (req, res) => {
  try {
    const fine = await Fine.create(req.body);

    await NotificationService.createNotification({
      userId: fine.user,
      message: `New fine: Rs. ${fine.amount} for overdue book`,
      type: 'fine',
      metadata: {
        fineAmount: fine.amount,
        bookId: fine.book
      }
    });

    res.status(201).json(fine);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};