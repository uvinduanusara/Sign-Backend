import express from "express";
import { createModule } from "../controllers/moduleController.js";

const moduleRouter = express.Router();

moduleRouter.post("/", createModule);

export default moduleRouter;
