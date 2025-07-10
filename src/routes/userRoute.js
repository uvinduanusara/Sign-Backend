import express from "express";
import { createUser, LoginUser } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", LoginUser);

export default userRouter;