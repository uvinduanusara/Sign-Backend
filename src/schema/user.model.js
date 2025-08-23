import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  profile: {
    type: String,
    default:
      "https://img.freepik.com/free-vector/user-blue-gradient_78370-4692.jpg?t=st=1751957041~exp=1751960641~hmac=73c0de2cb3aca459acc4f38a8eb36d2079068ebe1eb6e34621054f7f81675e3c&w=1380",
  },
  stripCustomerId: {
    type: String,
    required: true,
  }
});

const User = mongoose.model("User", userSchema);

export default User;
