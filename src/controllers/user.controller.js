import User from "../schema/user.moel.js";
import Role from "../schema/role.model.js";
import bcrypt, { hashSync } from "bcrypt";
import jwt from "jsonwebtoken";

export async function createUser(req, res) {
  const newUserData = req.body;

  try {
    const roleName = newUserData.role || "customer";
    const roleDoc = await Role.findOne({ role: roleName });

    if (!roleDoc) {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    newUserData.role = roleDoc._id;
    (newUserData.password = bcrypt), hashSync(newUserData.password, 10);

    const user = new User(newUserData);
    await user.save();

    res, json({ message: "User Created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error Creating User" });
  }
}

export function LoginUser(req, res) {
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

export function isAdmin(req) {
  if (req.user == null) {
    return false;
  }

  if (req.user.role != "admin") {
    return false;
  }
  return true;
}

export function isCustomer(req) {
  if (req.user == null) {
    return false;
  }
  if (req.user.role != "customer") {
    return false;
  }
  return tru;
}
