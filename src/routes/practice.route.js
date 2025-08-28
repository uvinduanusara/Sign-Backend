import express from "express";
import Practice from "../schema/practice.model.js";
import { auth, requireAuth } from "../middleware/auth.middleware.js";

const practiceRouter = express.Router();

// Get all practice materials for users (public access for viewing)
practiceRouter.get("/", async (req, res) => {
  try {
    const { category, difficulty, search = '' } = req.query;
    
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (search) {
      query.$or = [
        { practiceName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const practices = await Practice.find(query)
      .select('practiceName category difficulty description signs signImages instructions estimatedTime points')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: practices
    });
  } catch (error) {
    console.error("Get practice materials error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch practice materials" 
    });
  }
});

// Get single practice material by ID
practiceRouter.get("/:practiceId", async (req, res) => {
  try {
    const { practiceId } = req.params;
    
    const practice = await Practice.findById(practiceId)
      .select('practiceName category difficulty description signs signImages instructions estimatedTime points');
      
    if (!practice || !practice.isActive) {
      return res.status(404).json({
        success: false,
        message: "Practice material not found"
      });
    }

    res.json({
      success: true,
      data: practice
    });
  } catch (error) {
    console.error("Get practice material error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch practice material" 
    });
  }
});

// Submit practice results (requires authentication)
practiceRouter.post("/:practiceId/complete", auth, requireAuth, async (req, res) => {
  try {
    const { practiceId } = req.params;
    const { score, timeSpent, completedSigns } = req.body;
    
    // Here you could save user progress to a separate collection
    // For now, just return success response
    
    res.json({
      success: true,
      message: "Practice completed successfully",
      data: {
        practiceId,
        score,
        timeSpent,
        completedSigns
      }
    });
  } catch (error) {
    console.error("Complete practice error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save practice results" 
    });
  }
});

export default practiceRouter;