import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
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

export const Transaction = mongoose.model("Transaction", transactionSchema)