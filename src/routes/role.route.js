import express from "express";
import { createRole } from "../controllers/role.controller.js";

const roleRouter = express.Router();

roleRouter.post("/", createRole);

export default roleRouter;