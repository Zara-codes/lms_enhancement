// import { Router } from "express";
// import { EsewaInitiatePayment, paymentStatus } from "../controllers/esewav2Controllers.js";
// import authMiddleware from "../middlewares/auth-middleware.js";
// import adminMiddleware from "../middlewares/admin-middleware.js";

// const esewaRouter = Router();

// esewaRouter.post("/initiate-payment",authMiddleware,adminMiddleware, EsewaInitiatePayment);
// esewaRouter.post("/payment-status",authMiddleware,adminMiddleware, paymentStatus);

// export default esewaRouter;

import { Router } from "express";
import { EsewaInitiatePayment, paymentStatus } from "../controllers/esewav2Controllers.js";
import authMiddleware from "../middlewares/auth-middleware.js";
import adminMiddleware from "../middlewares/admin-middleware.js";

const esewaRouter = Router();

// Updated routes with better error handling and security
esewaRouter.post("/initiate-payment", 
  authMiddleware, 
  adminMiddleware,
  (req, res, next) => {
    // Validate request body
    if (!req.body.amount || req.body.amount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid payment amount" 
      });
    }
    next();
  },
  EsewaInitiatePayment
);

esewaRouter.post("/payment-status",
  authMiddleware,
  (req, res, next) => {
    // Add validation for required parameters
    if (!req.body.transactionId || !req.body.referenceId) {
      return res.status(400).json({
        success: false,
        message: "Missing transaction parameters"
      });
    }
    next();
  },
  paymentStatus
);

export default esewaRouter;