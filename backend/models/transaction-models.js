import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    ISBN: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    rollNumber: {
      type: String,
    },

    isBorrowed: {
      type: Boolean,
      default: true,
    },
    borrowDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    returnedDate: {
      type: Date,
    },

    fine: {
      type: Number,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },

    /* FOR RENEW BOOOK */
    renewStatus: {
      type: String,
      enum: ["None", "Pending", "Accepted", "Rejected"],
      default: "None",
    },
    renewalDays: {
      type: Number,
    },
  },
  { timestamps: true }
);

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});


const fineSchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
    required: true,
  },
  fine: {
    type: Number,
    required: true,
  },
  paidDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    required: true,
    enum: ["PENDING", "COMPLETE", "REUNDED"],
    default: "PENDING"
  }
}, {timestamps: true});

// Payment Integration
const esewaTransactionSchema = new mongoose.Schema({
    product_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        required: true,
        enum: ["PENDING", "COMPLETE", "REUNDED"],
        default: "PENDING"
    }
}, {timestamps: true})
const esewaTransactionModel = mongoose.model("Esewa Transaction", esewaTransactionSchema);



const payFineSchema = mongoose.Schema(
  {
    product_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        required: true,
        enum: ["PENDING", "COMPLETE", "REUNDED"],
        default: "PENDING"
    }
  },
  {
    timestamps: true,
  }
);

const PayFineModel = mongoose.model("PayFine", payFineSchema);

// Next Attempt


// End
const ReservationModel = mongoose.model("Reservation", reservationSchema);
const TransactionModel = mongoose.model("Transaction", transactionSchema);
const FineModel = mongoose.model("Fine", fineSchema);

export { ReservationModel, TransactionModel, FineModel, esewaTransactionModel, PayFineModel };
