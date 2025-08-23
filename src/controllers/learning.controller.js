import Learning from "../models/learning.model.js";
export async function createModule(req, res) {
  try {
    const newLearningData = req.body;

    const learning = new Learning(newLearningData);
    await learning.save();

    res.status(201).json({ message: "Learn Created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error Creating Learn" });
  }
}
