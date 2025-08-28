import express from "express";
import { 
  getPublicReviews, 
  createReview, 
  getUserReview, 
  updateUserReview, 
  deleteUserReview 
} from "../controllers/review.controller.js";
import { auth, requireAuth } from "../middleware/auth.middleware.js";

const reviewRouter = express.Router();

// Public route - get all approved reviews (available to everyone)
reviewRouter.get("/", getPublicReviews);

// Protected routes - require authentication only (allow all logged-in users including 'customer' role)
reviewRouter.post("/", auth, requireAuth, createReview);           // Create a new review
reviewRouter.get("/mine", auth, requireAuth, getUserReview);       // Get user's own review
reviewRouter.put("/mine", auth, requireAuth, updateUserReview);    // Update user's own review
reviewRouter.delete("/mine", auth, requireAuth, deleteUserReview); // Delete user's own review

export default reviewRouter;