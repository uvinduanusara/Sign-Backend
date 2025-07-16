import jwt from "jsonwebtoken";
import Role from "../schema/role.model.js";

const secretkey = "secretkey";

export function auth(req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(400).json({ message: "Authentication Token Required" });
  }

  const token = authHeader.replace("Bearer ", "");

  jwt.verify(token, secretkey, (err, decode) => {
    if (err) {
      return res.status(401).json({ message: "Invalid Token" });
    }

    req.user = decode;
    next();
  });
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Admin Access only" });
    }

    const role = await Role.findById(req.user.role);

    if (!role || role.roleName !== "admin") {
      return res.status(403).json({ message: "Admin Access only" });
    }

    next();
  } catch (error) {
    console.error("requireAdmin error:", error);
    res.status(500).json({ message: "Server error in admin check" });
  }
}
