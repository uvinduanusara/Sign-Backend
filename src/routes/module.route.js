import express from "express";
import { createModule } from "../controllers/module.controller.js";
import { auth, requireAdmin, requireAuth } from "../middleware/auth.middleware.js";

const moduleRouter = express.Router();

moduleRouter.post("/", auth, requireAuth, requireAdmin, createModule);

export default moduleRouter;
