import express from "express";
import { createRole } from "../controllers/role.controller.js";
import { auth, requireAdmin, requireAuth } from "../middleware/auth.middleare.js";

const roleRouter = express.Router();

roleRouter.post("/", auth, requireAuth, requireAdmin, createRole);

export default roleRouter;