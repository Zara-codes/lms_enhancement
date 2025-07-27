import mongoose from "mongoose";
const paymentSchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true },
    pidx: { type: String, unique: true },
    fineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayFine",
      required: true,
    },
    amount: { type: mongoose.Schema.Types.ObjectId, ref: "Fine", required: true },
    dataFromVerificationReq: { type: Object },
    apiQueryFromUser: { type: Object },
    paymentGateway: {
      type: String,
      enum: ["khalti", "esewa", "connectIps"],
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "pending", "failed"],
      default: "pending",
    },
    paymentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


const PaymentModel = mongoose.model("Payment", paymentSchema);

export default PaymentModel;