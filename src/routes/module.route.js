import express from "express";
import {
  createModule,
  getAllModules,
  getModuleById,
  updateModule,
  deleteModule,
  getModulesByFilter
} from "../controllers/module.controller.js";
import { auth, requireAdmin, requireAuth, requireUser, blockRoles } from "../middleware/auth.middleware.js";

const moduleRouter = express.Router();

// User routes (admins blocked from viewing user modules)
moduleRouter.get("/", auth, requireAuth, blockRoles(["admin"]), getAllModules);
moduleRouter.get("/filter", auth, requireAuth, blockRoles(["admin"]), getModulesByFilter);
moduleRouter.get("/:id", auth, requireAuth, blockRoles(["admin"]), getModuleById);

// Admin-only routes (users blocked from managing modules)
moduleRouter.post("/", auth, requireAuth, requireAdmin, createModule);
moduleRouter.put("/:id", auth, requireAuth, requireAdmin, updateModule);
moduleRouter.delete("/:id", auth, requireAuth, requireAdmin, deleteModule);

export default moduleRouter;