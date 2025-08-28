import Learning from "../schema/learning.model.js";
import UserLessonProgress from "../schema/userLessonProgress.model.js";

export async function createLearn(req, res) {
  try {
    const newLearningData = req.body;

    const learning = new Learning(newLearningData);
    await learning.save();

    res.status(201).json({ message: "Learn Created", lesson: learning });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error Creating Learn" });
  }
}

export async function getAllLessons(req, res) {
  try {
    const userId = req.user?._id;
    const lessons = await Learning.find({ isActive: true }).sort({ order: 1 });
    
    if (userId) {
      // Get user progress for each lesson
      const lessonsWithProgress = await Promise.all(
        lessons.map(async (lesson) => {
          const progress = await UserLessonProgress.findOne({
            userId,
            lessonId: lesson._id,
          });
          
          return {
            ...lesson.toObject(),
            progress: progress ? progress.getProgress() : 0,
            completed: progress?.isCompleted || false,
            currentSignIndex: progress?.currentSignIndex || 0,
            completedSigns: progress?.completedSigns || [],
          };
        })
      );
      
      res.json({ success: true, lessons: lessonsWithProgress });
    } else {
      res.json({ success: true, lessons });
    }
  } catch (error) {
    console.error("Error fetching lessons:", error);
    res.status(500).json({ message: "Error fetching lessons" });
  }
}

export async function getLessonById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    
    const lesson = await Learning.findById(id);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    
    if (userId) {
      const progress = await UserLessonProgress.findOne({
        userId,
        lessonId: lesson._id,
      });
      
      res.json({
        success: true,
        lesson: {
          ...lesson.toObject(),
          progress: progress ? progress.getProgress() : 0,
          completed: progress?.isCompleted || false,
          currentSignIndex: progress?.currentSignIndex || 0,
          completedSigns: progress?.completedSigns || [],
        },
      });
    } else {
      res.json({ success: true, lesson });
    }
  } catch (error) {
    console.error("Error fetching lesson:", error);
    res.status(500).json({ message: "Error fetching lesson" });
  }
}

export async function updateLessonProgress(req, res) {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;
    const { sign, accuracy = 70, timeSpent = 0 } = req.body;
    
    const lesson = await Learning.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    
    // Mock validation: Check if the sign is in the lesson's signs array
    const isValidSign = lesson.signs.includes(sign);
    if (!isValidSign) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid sign "${sign}" for this lesson`,
        validationPassed: false 
      });
    }
    
    let progress = await UserLessonProgress.findOne({ userId, lessonId });
    
    if (!progress) {
      progress = new UserLessonProgress({ 
        userId, 
        lessonId,
        completedSigns: [],
        currentSignIndex: 0,
      });
    }
    
    // Check if sign already completed
    const existingSignIndex = progress.completedSigns.findIndex(cs => cs.sign === sign);
    
    if (existingSignIndex === -1) {
      // Add new completed sign
      progress.completedSigns.push({
        sign,
        accuracy,
        attempts: 1,
        completedAt: new Date(),
      });
    } else {
      // Update existing sign
      progress.completedSigns[existingSignIndex].attempts += 1;
      progress.completedSigns[existingSignIndex].accuracy = Math.max(
        progress.completedSigns[existingSignIndex].accuracy,
        accuracy
      );
    }
    
    // Update overall progress
    progress.totalAttempts += 1;
    progress.timeSpent += timeSpent;
    progress.lastAccessedAt = new Date();
    
    // Calculate average accuracy
    const totalAccuracy = progress.completedSigns.reduce((sum, cs) => sum + cs.accuracy, 0);
    progress.averageAccuracy = progress.completedSigns.length > 0 
      ? totalAccuracy / progress.completedSigns.length 
      : 0;
    
    // Auto-advance current sign index if not already advanced
    const currentSignInLesson = lesson.signs[progress.currentSignIndex];
    if (currentSignInLesson === sign && progress.currentSignIndex < lesson.signs.length - 1) {
      progress.currentSignIndex += 1;
    }
    
    // Check if lesson is completed
    const uniqueCompletedSigns = [...new Set(progress.completedSigns.map(cs => cs.sign))];
    if (uniqueCompletedSigns.length === lesson.signs.length) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }
    
    await progress.save();
    
    res.json({ 
      success: true, 
      message: "Progress updated successfully",
      validationPassed: true,
      progress: {
        completedSigns: progress.completedSigns,
        currentSignIndex: progress.currentSignIndex,
        isCompleted: progress.isCompleted,
        progressPercentage: progress.getProgress(),
        averageAccuracy: progress.averageAccuracy,
      }
    });
    
  } catch (error) {
    console.error("Error updating lesson progress:", error);
    res.status(500).json({ message: "Error updating lesson progress" });
  }
}

export async function getUserProgress(req, res) {
  try {
    const userId = req.user._id;
    
    const progressRecords = await UserLessonProgress.find({ userId })
      .populate('lessonId')
      .sort({ 'lessonId.order': 1 });
    
    const progressSummary = progressRecords.map(progress => ({
      lessonId: progress.lessonId._id,
      lessonName: progress.lessonId.learnName,
      difficulty: progress.lessonId.difficulty,
      progressPercentage: progress.getProgress(),
      isCompleted: progress.isCompleted,
      completedSigns: progress.completedSigns.length,
      totalSigns: progress.lessonId.signs.length,
      averageAccuracy: progress.averageAccuracy,
      timeSpent: progress.timeSpent,
      lastAccessedAt: progress.lastAccessedAt,
    }));
    
    res.json({ success: true, progress: progressSummary });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({ message: "Error fetching user progress" });
  }
}
