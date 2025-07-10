import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  reviewId: {
    type: String,
    required: true,
    unique: true,
  },
  reviewBody: {
    type: String,
    required: true,
  },
  rating: {
    type: String,
    default: "0",
  },
  userEmail: {
    type: String,
    required: true,
  },
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
