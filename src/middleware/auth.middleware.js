import jwt from "jsonwebtoken";
import Role from "../schema/role.model.js";

const secretkey = process.env.SCRECT_KEY;

// ✅ Verify JWT and attach user
export function auth(req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication Token Required" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, secretkey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or Expired Token" });
    }
    req.user = decoded; // { id, email, role, roleName }
    next();
  });
}

// ✅ Require login
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// ✅ Require admin role
export async function requireAdmin(req, res, next) {
  try {
    // If JWT already has roleName, we can skip DB call
    if (req.user.roleName && req.user.roleName === "admin") {
      return next();
    }

    // Fallback: check DB role
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

// ✅ Require user role (block admin access)
export async function requireUser(req, res, next) {
  try {
    // If JWT already has roleName, we can skip DB call
    if (req.user.roleName && req.user.roleName === "user") {
      return next();
    }

    // Fallback: check DB role
    const role = await Role.findById(req.user.role);
    if (!role || role.roleName !== "user") {
      return res.status(403).json({ 
        message: "User access only - Admin users cannot access this feature",
        userRole: req.user.roleName || role?.roleName || "unknown"
      });
    }

    next();
  } catch (error) {
    console.error("requireUser error:", error);
    res.status(500).json({ message: "Server error in user check" });
  }
}

// ✅ Block specific roles from accessing routes
export function blockRoles(blockedRoles = []) {
  return async (req, res, next) => {
    try {
      let userRoleName = req.user.roleName;
      
      // If no roleName in JWT, fetch from DB
      if (!userRoleName) {
        const role = await Role.findById(req.user.role);
        userRoleName = role?.roleName;
      }

      if (blockedRoles.includes(userRoleName)) {
        return res.status(403).json({ 
          message: `Access denied for ${userRoleName} users`,
          userRole: userRoleName,
          blockedRoles 
        });
      }

      next();
    } catch (error) {
      console.error("blockRoles error:", error);
      res.status(500).json({ message: "Server error in role check" });
    }
  };
}

// ✅ Require instructor role (instructors only, no admin)
export async function requireInstructor(req, res, next) {
  try {
    // If JWT already has roleName, we can skip DB call
    if (req.user.roleName && req.user.roleName === "instructor") {
      return next();
    }

    // Fallback: check DB role
    const role = await Role.findById(req.user.role);
    if (!role || role.roleName !== "instructor") {
      return res.status(403).json({ 
        message: "Instructor access only - Admins cannot access learning materials",
        userRole: req.user.roleName || role?.roleName || "unknown"
      });
    }

    next();
  } catch (error) {
    console.error("requireInstructor error:", error);
    res.status(500).json({ message: "Server error in instructor check" });
  }
}

// ✅ Require admin or instructor for learning materials
export async function requireAdminOrInstructor(req, res, next) {
  try {
    let userRoleName = req.user.roleName;
    
    // If no roleName in JWT, fetch from DB
    if (!userRoleName) {
      const role = await Role.findById(req.user.role);
      userRoleName = role?.roleName;
    }

    if (!["admin", "instructor"].includes(userRoleName)) {
      return res.status(403).json({ 
        message: "Admin or Instructor access only",
        userRole: userRoleName
      });
    }

    next();
  } catch (error) {
    console.error("requireAdminOrInstructor error:", error);
    res.status(500).json({ message: "Server error in role check" });
  }
}

// ✅ Require specific roles
export function requireRoles(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      let userRoleName = req.user.roleName;
      
      // If no roleName in JWT, fetch from DB
      if (!userRoleName) {
        const role = await Role.findById(req.user.role);
        userRoleName = role?.roleName;
      }

      if (!allowedRoles.includes(userRoleName)) {
        return res.status(403).json({ 
          message: `Access restricted to: ${allowedRoles.join(', ')}`,
          userRole: userRoleName,
          allowedRoles 
        });
      }

      next();
    } catch (error) {
      console.error("requireRoles error:", error);
      res.status(500).json({ message: "Server error in role check" });
    }
  };
}
