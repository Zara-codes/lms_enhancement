import { Router } from "express";
import { getEsewaPaymentHash, verifyEsewaPayment } from "../services/esewa.js"
import { PayFineModel } from "../models/transaction-models.js";
import PaymentModel from "../models/payment-model.js";
import { initiateEsewaPayment } from "../controllers/esewaPaymentControllers.js";

const paymentRoutes = Router()

// outer.route("/register").post(registerUser)

paymentRoutes.route("/initialize-esewa").post(initiateEsewaPayment)

export default paymentRoutes