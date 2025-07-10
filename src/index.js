import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import userRouter from "./routes/userRoute.js";
import moduleRouter from "./routes/moduleRoute.js";
dotenv.config();

const app = express();
const mongoUrl = process.env.MONGO_URL;
const PORT = process.env.PORT;

mongoose.connect(mongoUrl, {});
app.use(bodyParser.json());

app.use((req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (token != null) {
    jwt.verify(token, "secretkey", (error, decoded) => {
      if (!error) {
        req.user = decoded;
        console.log(user);
      }
    });
  }
  next();
});

app.use("/api/user", userRouter);
app.use("api/module", moduleRouter);

const connection = mongoose.connection;

app.listen(PORT, () => {
  console.log("Server is running on port:" + PORT);
});

connection.once("open", () => {
  console.log("Connected to MongoDB");
});
