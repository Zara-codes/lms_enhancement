import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from 'http';
import { Server } from 'socket.io';
import { APP_PORT, MONGO_DB_URI } from "./config/index.js";
import {
  almirahRouter,
  authRouter,
  batchRouter,
  bookRouter,
  categoryRouter,
  clearanceRouter,
  departementRouter,
  eBookRouter,
  genralRouter,
  studentRouter,
  teacherRouter,
  transactionRouter,
} from "./routes/index.js";
import { errorHandlerMiddleware } from "./middlewares/index.js";

// Integration
// import { getEsewaPaymentHash, verifyEsewaPayment } from "./services/esewa.js"
// import { PayFineModel } from "./models/transaction-models.js";
// import PaymentModel from "./models/payment-model.js";
// End

const app = express();
app.use(express.json({ limit: "5mb" }));

const corsOptions = {
  credentials: true,
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
export const ROOT_PATH = path.dirname(__filename);


app.use("/public", express.static("./public"));
app.use("/uploads", express.static("./uploads"));
app.use("/documents", express.static("./documents"));


mongoose
  .connect(MONGO_DB_URI)
  .then(() => {
    console.log("MONGO DB CONNECTED SUCCESSFULLY 😍😍");

    app.listen(APP_PORT, () => {
      console.log(`SERVER IS LISTNING ON PORT ${APP_PORT}`);
    });
  })
  .catch((err) => {
    console.log("SOMETHING WENT WRONG WHILE CONNECTING TO MONGO DB 😢😢");
    console.log("====================================");
    console.log(err);
    console.log("====================================");
  });

  
app.use("/api/auth", authRouter);
app.use("/api/batches", batchRouter);
app.use("/api/teachers", teacherRouter);
app.use("/api/departements", departementRouter);
app.use("/api/students", studentRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/almirahs", almirahRouter);
app.use("/api/books", bookRouter);
app.use("/api/ebooks", eBookRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/genral", genralRouter);
app.use("/api/clearance", clearanceRouter);


app.use(errorHandlerMiddleware);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL, 
    methods: ["GET", "POST"]
  }
});


const userSocketMap = new Map(); 
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);


  socket.on('register', (userId) => {
    socket.join(userId);
    userSocketMap.set(userId, socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    userSocketMap.forEach((value, key) => {
      if (value === socket.id) userSocketMap.delete(key);
    });
  });
});


global.io = io;
global.userSocketMap = userSocketMap;


httpServer.listen(process.env.PORT, () => {
  console.log(`Server running with Socket.io on port ${process.env.APP_PORT}`);
});

// // PI
// import paymentRoutes from "./routes/paymentRoutes.js";
// app.use("/api/payment", paymentRoutes)

import esewaRouter from "./routes/esewav2Routes.js";
app.use("/api/payment", esewaRouter);