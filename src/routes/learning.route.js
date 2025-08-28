import express from "express";
import { 
  createLearn, 
  getAllLessons, 
  getLessonById,
  updateLessonProgress,
  getUserProgress 
} from "../controllers/learning.controller.js";
import { auth, requireAdmin, requireAuth, requireUser, blockRoles } from "../middleware/auth.middleware.js";

const learnRouter = express.Router();

// User-only routes (admins blocked from learning features)
learnRouter.get("/", auth, requireAuth, blockRoles(["admin"]), getAllLessons);
learnRouter.get("/:id", auth, requireAuth, blockRoles(["admin"]), getLessonById);
learnRouter.post("/:lessonId/progress", auth, requireAuth, requireUser, updateLessonProgress);
learnRouter.get("/user/progress", auth, requireAuth, requireUser, getUserProgress);

// Admin-only routes (users blocked)
learnRouter.post("/", auth, requireAuth, requireAdmin, createLearn);

export default learnRouter;