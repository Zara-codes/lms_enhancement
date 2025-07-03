
import NotificationService from '../services/notificationService.js';

export const issueFine = async (req, res) => {
  const { userId, amount, bookTitle } = req.body;
  
  const fine = await Fine.create({ userId, amount });

  await NotificationService.create({
    userId,
    message: `You have a new fine of ₹${amount} for "${bookTitle}"`,
    type: 'fine',
    link: `/fines/${fine._id}` 
  });

  res.status(201).json(fine);
};