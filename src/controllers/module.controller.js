import Module from "../schema/module.model.js";

// Create a new module
export async function createModule(req, res) {
  try {
    const newModuleData = req.body;

    const module = new Module(newModuleData);
    await module.save();

    res.status(201).json({
      message: "Module Created Successfully",
      data: module
    });
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({
      message: "Error Creating Module",
      error: error.message
    });
  }
}

// Get all modules
export async function getAllModules(req, res) {
  try {
    const modules = await Module.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      message: "Modules Retrieved Successfully",
      data: modules,
      count: modules.length
    });
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({
      message: "Error Retrieving Modules",
      error: error.message
    });
  }
}

// Get a single module by ID
export async function getModuleById(req, res) {
  try {
    const { id } = req.params;
    
    const module = await Module.findById(id);
    
    if (!module) {
      return res.status(404).json({
        message: "Module Not Found"
      });
    }
    
    res.status(200).json({
      message: "Module Retrieved Successfully",
      data: module
    });
  } catch (error) {
    console.error("Error fetching module:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid Module ID"
      });
    }
    
    res.status(500).json({
      message: "Error Retrieving Module",
      error: error.message
    });
  }
}

// Update a module by ID
export async function updateModule(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if module exists
    const existingModule = await Module.findById(id);
    if (!existingModule) {
      return res.status(404).json({
        message: "Module Not Found"
      });
    }
    
    const updatedModule = await Module.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      message: "Module Updated Successfully",
      data: updatedModule
    });
  } catch (error) {
    console.error("Error updating module:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid Module ID"
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation Error",
        error: error.message
      });
    }
    
    res.status(500).json({
      message: "Error Updating Module",
      error: error.message
    });
  }
}

// Delete a module by ID
export async function deleteModule(req, res) {
  try {
    const { id } = req.params;
    
    const module = await Module.findByIdAndDelete(id);
    
    if (!module) {
      return res.status(404).json({
        message: "Module Not Found"
      });
    }
    
    res.status(200).json({
      message: "Module Deleted Successfully",
      data: module
    });
  } catch (error) {
    console.error("Error deleting module:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid Module ID"
      });
    }
    
    res.status(500).json({
      message: "Error Deleting Module",
      error: error.message
    });
  }
}

// Get modules by category or filter
export async function getModulesByFilter(req, res) {
  try {
    const { category, level, isActive } = req.query;
    let filter = {};
    
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const modules = await Module.find(filter).sort({ order: 1, createdAt: -1 });
    
    res.status(200).json({
      message: "Modules Retrieved Successfully",
      data: modules,
      count: modules.length
    });
  } catch (error) {
    console.error("Error fetching filtered modules:", error);
    res.status(500).json({
      message: "Error Retrieving Modules",
      error: error.message
    });
  }
}