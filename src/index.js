import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import userRouter from "./routes/user.route.js";
import moduleRouter from "./routes/module.route.js";
import roleRouter from "./routes/role.route.js";
import learningRouter from "./routes/learning.route.js";
import adminRouter from "./routes/admin.route.js";
import practiceRouter from "./routes/practice.route.js";

const app = express();
const mongoUrl = process.env.MONGO_URL;
const PORT = process.env.PORT;
const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001"], // Allow your frontend URLs
  credentials: true, // Allow cookies and authentication headers
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

mongoose.connect(mongoUrl, {});
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is healthy" });
});

app.use("/api/role", roleRouter);
app.use("/api/user", userRouter);
app.use("/api/module", moduleRouter);
app.use("/api/learn", learningRouter);
app.use("/api/admin", adminRouter);
app.use("/api/practice", practiceRouter);

const connection = mongoose.connection;

app.listen(PORT, () => {
  console.log("Server is running on port:" + PORT);
});

connection.once("open", () => {
  console.log("Connected to MongoDB");
});
