import express from "express";
import { createModule } from "../controllers/module.controller.js";

const moduleRouter = express.Router();

moduleRouter.post("/", createModule);

export default moduleRouter;
