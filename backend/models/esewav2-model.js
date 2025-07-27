import mongoose from "mongoose"; //Define the Transaction Schema
const esewaSchema=new mongoose.Schema({
    product_id:{
        type:String,
        required:true
    },
    amount:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Fine",
        required:true,
    },

    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        required: true,
      },
    status:{
        type:String,
        required:true,
        enum:["PENDING","COMPLETE","FAILED","REFUNDED"],// Example statuses
        default:"PENDING"
    }
},{timestamps:true} //Adds createdAt and updatedAt fields automatically

)
export const Esewa = mongoose.model("Esewa",esewaSchema)