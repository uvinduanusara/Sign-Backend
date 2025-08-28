import express from "express";
import {
  createUser,
  LoginUser,
  createSubscription,
  getAllUsers,
  purchaseProMembership,
  getUserProfile,
} from "../controllers/user.controller.js";
import { auth, requireAuth, requireAdmin, requireUser } from "../middleware/auth.middleware.js";

const userRouter = express.Router();

// Public
userRouter.post("/", createUser);
userRouter.post("/login", LoginUser);

// User-only (admins blocked from user features like subscriptions)
userRouter.post("/subscription", auth, requireAuth, requireUser, createSubscription);
userRouter.post("/purchase-pro", auth, requireAuth, requireUser, purchaseProMembership);
userRouter.get("/profile", auth, requireAuth, getUserProfile);

// Admin-only (users blocked)
userRouter.get("/all", auth, requireAuth, requireAdmin, getAllUsers);

export default userRouter;
