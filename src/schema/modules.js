import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema({
  moduleId: {
    type: String,
    required: true,
    unique: true,
  },
  moduleName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
  },
  image: [
    {
      type: String,
      required: true,
    },
  ],
});

const Module = mongoose.model("Module", moduleSchema);

export default Module;
