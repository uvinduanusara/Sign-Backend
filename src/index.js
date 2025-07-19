import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import userRouter from "./routes/user.route.js";
import moduleRouter from "./routes/module.route.js";
import roleRouter from "./routes/role.route.js";

const app = express();
const mongoUrl = process.env.MONGO_URL;
const PORT = process.env.PORT;

mongoose.connect(mongoUrl, {});
app.use(bodyParser.json());


app.use("/api/role", roleRouter)
app.use("/api/user", userRouter);
app.use("api/module", moduleRouter);

const connection = mongoose.connection;

app.listen(PORT, () => {
  console.log("Server is running on port:" + PORT);
});

connection.once("open", () => {
  console.log("Connected to MongoDB");
});
