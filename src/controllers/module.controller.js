import Module from "../schema/module.model.js";

export function createModule(req, res) {
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
