import Module from "../schema/module.model.js";
import { isAdmin } from "./user.controller.js";

export function createModule(req, res) {
  if (isAdmin(req)) {
    res.json({
      message: "Login as Administrator",
    });
    return;
  }
  const newModuleData = req.body;

  const module = new Module(newModuleData);
  module
    .save()
    .then(() => {
      res.json({
        message: "Module Created",
      });
    })
    .catch(() => {
      res.json({
        message: "Error Creating module",
      });
    });
}
