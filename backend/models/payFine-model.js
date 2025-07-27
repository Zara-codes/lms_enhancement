import mongoose from "mongoose";

const payFineSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fine: { type: mongoose.Schema.Types.ObjectId, ref: "Fine", required: true },
    fineIssueDate: {},
    paymentMethod: { type: String, enum: ["esewa", "khalti"], required: true},
    status: { type: String, enum: ["pending", "completed", "refunded"], default: "pending"},
}, { timestamps: true })

const PayFineModel = mongoose.model("PayFine", payFineSchema);

export default PayFineModel;