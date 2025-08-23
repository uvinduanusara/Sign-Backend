import express from "express";
import { createUser, LoginUser, createSubscription } from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", LoginUser);
userRouter.post("/subscription", createSubscription);

export default userRouter;
