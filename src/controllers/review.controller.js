import Review from "../schema/review.model.js";
import { v4 as uuidv4 } from "uuid";

// Get all approved reviews for public viewing
export const getPublicReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .populate('userId', 'firstName lastName profile')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error("Get public reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews"
    });
  }
};

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { reviewBody, rating } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Check if user already has a review
    const existingReview = await Review.findOne({ userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review. You can only submit one review."
      });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Validate review body
    if (!reviewBody || reviewBody.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Review must be at least 10 characters long"
      });
    }

    // Get user's full name
    const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();

    const newReview = new Review({
      reviewId: uuidv4(),
      reviewBody: reviewBody.trim(),
      rating: parseInt(rating),
      userEmail,
      userId,
      userName: userName || userEmail.split('@')[0], // Fallback to email username
      status: 'pending' // Reviews need admin approval
    });

    await newReview.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully! It will be visible after admin approval.",
      review: {
        reviewId: newReview.reviewId,
        reviewBody: newReview.reviewBody,
        rating: newReview.rating,
        userName: newReview.userName,
        status: newReview.status,
        createdAt: newReview.createdAt
      }
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review"
    });
  }
};

// Get user's own review
export const getUserReview = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const review = await Review.findOne({ userId });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "No review found"
      });
    }

    res.status(200).json({
      success: true,
      review: {
        reviewId: review.reviewId,
        reviewBody: review.reviewBody,
        rating: review.rating,
        userName: review.userName,
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    console.error("Get user review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your review"
    });
  }
};

// Update user's own review
export const updateUserReview = async (req, res) => {
  try {
    const { reviewBody, rating } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Validate review body
    if (reviewBody && reviewBody.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Review must be at least 10 characters long"
      });
    }

    const review = await Review.findOne({ userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "No review found to update"
      });
    }

    // Update fields
    if (reviewBody) review.reviewBody = reviewBody.trim();
    if (rating) review.rating = parseInt(rating);
    
    // Reset status to pending if content changed
    if (reviewBody || rating) {
      review.status = 'pending';
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: "Review updated successfully! It will be visible after admin approval.",
      review: {
        reviewId: review.reviewId,
        reviewBody: review.reviewBody,
        rating: review.rating,
        userName: review.userName,
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    console.error("Update user review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review"
    });
  }
};

// Delete user's own review
export const deleteUserReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const review = await Review.findOneAndDelete({ userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "No review found to delete"
      });
    }

    res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Delete user review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review"
    });
  }
};