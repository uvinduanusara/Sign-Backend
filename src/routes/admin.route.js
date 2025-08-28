import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getAllPracticeMaterials,
  createPracticeMaterial,
  updatePracticeMaterial,
  deletePracticeMaterial,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
  getAllRoles,
  updateProMemberStatus,
  getProMembers
} from "../controllers/admin.controller.js";
import { auth, requireAuth, requireAdmin, requireInstructor } from "../middleware/auth.middleware.js";
import { uploadLearningMaterialImages, handleUploadError } from "../middleware/upload.middleware.js";

const adminRouter = express.Router();

// Apply basic authentication to all routes
adminRouter.use(auth);
adminRouter.use(requireAuth);

// Dashboard routes (admin only)
adminRouter.get("/dashboard/stats", requireAdmin, getDashboardStats);

// User management routes (admin only)
adminRouter.get("/users", requireAdmin, getAllUsers);
adminRouter.post("/users", requireAdmin, createUser);
adminRouter.put("/users/:userId", requireAdmin, updateUser);
adminRouter.delete("/users/:userId", requireAdmin, deleteUser);

// Learning materials management routes (instructor only)
adminRouter.get("/materials", requireInstructor, getAllMaterials);
adminRouter.post("/materials", requireInstructor, uploadLearningMaterialImages, handleUploadError, createMaterial);
adminRouter.put("/materials/:materialId", requireInstructor, uploadLearningMaterialImages, handleUploadError, updateMaterial);
adminRouter.delete("/materials/:materialId", requireInstructor, deleteMaterial);

// Practice materials management routes (instructor only)
adminRouter.get("/practice-materials", requireInstructor, getAllPracticeMaterials);
adminRouter.post("/practice-materials", requireInstructor, uploadLearningMaterialImages, handleUploadError, createPracticeMaterial);
adminRouter.put("/practice-materials/:materialId", requireInstructor, uploadLearningMaterialImages, handleUploadError, updatePracticeMaterial);
adminRouter.delete("/practice-materials/:materialId", requireInstructor, deletePracticeMaterial);

// Reviews management routes (admin only)
adminRouter.get("/reviews", requireAdmin, getAllReviews);
adminRouter.patch("/reviews/:reviewId", requireAdmin, updateReviewStatus);
adminRouter.delete("/reviews/:reviewId", requireAdmin, deleteReview);

// Role management routes (admin only)
adminRouter.get("/roles", requireAdmin, getAllRoles);

// Pro member management routes (admin only)
adminRouter.get("/pro-members", requireAdmin, getProMembers);
adminRouter.patch("/users/:userId/pro-status", requireAdmin, updateProMemberStatus);

export default adminRouter;