// jobs/dueReminders.js
const cron = require('node-cron');
const BookLoan = require('../models/BookLoan');
const NotificationService = require('../services/notificationService');

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueLoans = await BookLoan.find({
    dueDate: {
      $lte: tomorrow,
      $gte: new Date()
    },
    status: 'active'
  }).populate('user book');

  dueLoans.forEach(async loan => {
    await NotificationService.createNotification({
      userId: loan.user._id,
      message: `"${loan.book.title}" is due tomorrow!`,
      type: 'due_date',
      metadata: {
        bookId: loan.book._id,
        dueDate: loan.dueDate
      }
    });
  });
});