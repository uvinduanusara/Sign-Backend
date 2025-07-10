import User from "../schema/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function createUser(req, res) {
  const newUserData = req.body;

  if (newUserData.role == "admin") {
    if (req.user == null) {
      res.json({
        message: "You are not logged in",
      });
      return;
    }
    if (req.user.role != "admin") {
      res.json({
        message: "You are not authorized",
      });
      return;
    }
  }
  newUserData.password = bcrypt.hashSync(newUserData.password, 10);

  const user = new User(newUserData);
  user
    .save()
    .then(() => {
      res.json({
        message: "User Created",
      });
    })
    .catch(() => {
      res.json({
        message: "Error creating user",
      });
    });
}

function LoginUser(req, res) {
  const { email, password } = req.body;

  User.find({ email }).then((users) => {
    if (users.length == 0) {
      res.json({
        message: "User not found",
      });
    } else {
      const user = users[0];
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (isPasswordValid) {
        const token = jwt.sign(
          { email: user.email, role: user.role },
          "secretkey"
        );
        res.json({
          message: "Login successful",
          token: token,
        });
      } else {
        res.json({
          message: "Invalid Credentials",
        });
      }
    }
  });
}

export { createUser, LoginUser };
