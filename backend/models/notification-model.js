import mongoose from 'mongoose';


const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['fine', 'due_date', 'payment', 'system'],
    default: 'system'
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  metadata: {
    bookId: mongoose.Schema.Types.ObjectId,
    fineAmount: Number,
    dueDate: Date
  }
}, { timestamps: true });


notificationSchema.plugin(require('mongoose-aggregate-paginate-v2'));

module.exports = mongoose.model('Notification', notificationSchema);