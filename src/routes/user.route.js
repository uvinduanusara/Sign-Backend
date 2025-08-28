import express from "express";
import {
  createUser,
  LoginUser,
  createSubscription,
  getAllUsers,
  purchaseProMembership,
  createStripeCheckoutSession,
  verifyStripeSession,
  getUserProfile,
  updateUserProfile,
  handleStripeWebhook,
} from "../controllers/user.controller.js";
import { auth, requireAuth, requireAdmin, requireUser } from "../middleware/auth.middleware.js";

const userRouter = express.Router();

// Public
userRouter.post("/", createUser);
userRouter.post("/login", LoginUser);

// Stripe webhook (needs to be before middleware that parses JSON)
userRouter.post("/stripe-webhook", express.raw({type: 'application/json'}), handleStripeWebhook);

// User-only (admins blocked from user features like subscriptions)
userRouter.post("/subscription", auth, requireAuth, requireUser, createSubscription);
userRouter.post("/purchase-pro", auth, requireAuth, requireUser, purchaseProMembership);
userRouter.post("/create-stripe-checkout", auth, requireAuth, requireUser, createStripeCheckoutSession);
userRouter.post("/verify-stripe-session", auth, requireAuth, requireUser, verifyStripeSession);
userRouter.get("/profile", auth, requireAuth, getUserProfile);
userRouter.put("/profile", auth, requireAuth, updateUserProfile);

// Admin-only (users blocked)
userRouter.get("/all", auth, requireAuth, requireAdmin, getAllUsers);

export default userRouter;
