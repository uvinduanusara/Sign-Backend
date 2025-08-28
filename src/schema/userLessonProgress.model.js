import mongoose from "mongoose";

const userLessonProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Learning",
    required: true,
  },
  completedSigns: [{
    sign: String,
    completedAt: {
      type: Date,
      default: Date.now,
    },
    attempts: {
      type: Number,
      default: 1,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  }],
  currentSignIndex: {
    type: Number,
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
  totalAttempts: {
    type: Number,
    default: 0,
  },
  averageAccuracy: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0,
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one progress record per user per lesson
userLessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

// Calculate progress percentage
userLessonProgressSchema.methods.getProgress = function() {
  if (!this.populate('lessonId')) return 0;
  const totalSigns = this.lessonId.signs.length;
  return totalSigns > 0 ? (this.completedSigns.length / totalSigns) * 100 : 0;
};

const UserLessonProgress = mongoose.model("UserLessonProgress", userLessonProgressSchema);

export default UserLessonProgress;