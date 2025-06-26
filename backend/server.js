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

const app = express();
app.use(express.json({ limit: "5mb" }));

const corsOptions = {
  credentials: true,
  origin: "http://localhost:5173", // No trailing slash
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
  pingTimeout: 60000,
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

const userSocketMap = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('setup', (userId) => {
    socket.join(userId);
    userSocketMap.set(userId, socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    userSocketMap.forEach((value, key) => {
      if (value === socket.id) userSocketMap.delete(key);
    });
  });
});

global.io = io;