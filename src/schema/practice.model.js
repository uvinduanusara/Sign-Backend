import mongoose from "mongoose";

const practiceSchema = new mongoose.Schema({
  practiceName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  description: {
    type: String,
    required: true
  },
  signs: [{
    type: String,
    required: true
  }],
  signImages: [{
    signName: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    }
  }],
  instructions: {
    type: String,
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 10
  },
  points: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const Practice = mongoose.model("Practice", practiceSchema);

export default Practice;