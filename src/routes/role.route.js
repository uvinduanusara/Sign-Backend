import express from "express";
import { createRole, seedRoles } from "../controllers/role.controller.js";
import { auth, requireAdmin, requireAuth } from "../middleware/auth.middleware.js";

const roleRouter = express.Router();

roleRouter.post("/", auth, requireAuth, requireAdmin, createRole);
roleRouter.get("/seed", seedRoles); // Temporary endpoint for seeding roles

export default roleRouter;