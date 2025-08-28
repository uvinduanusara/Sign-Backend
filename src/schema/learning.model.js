import mongoose from "mongoose";

const learningSchema = new mongoose.Schema({
  learnId: {
    type: String,
    required: true,
    unique: true,
  },
  learnName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  signs: [{
    type: String,
    required: true,
  }],
  signImages: [{
    signName: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    }
  }],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  correctAnswer: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Learning = mongoose.model("Learning", learningSchema);

export default Learning;
