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
  correctAnswer: {
    type: String,
    required: true,
  },
});

const Learning = mongoose.model("Learning", learningSchema);

export default Learning;
