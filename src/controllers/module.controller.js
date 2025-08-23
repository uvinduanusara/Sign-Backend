import Module from "../schema/module.model.js";

export async function createModule(req, res) {
  try {
    const newModuleData = req.body;
    
    const module = new Module(newModuleData);
    await module.save();
    
    res.json({
      message: "Module Created",
    });
  } catch (error) {
    res.json({
      message: "Error Creating module",
    });
  }
}
