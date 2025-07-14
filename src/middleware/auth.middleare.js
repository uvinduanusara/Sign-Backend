import jwt, { decode } from "jsonwebtoken";

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

export function requireAuth(req, res, next){
    if(!req.user){
        return res.status(401).json({ message: "Authentication required"});
    }
    next();
}

export function requireAdmin(req, res, next){
    if(!req.user || req.user.role != "admin"){
        return res.status(401).json({ message: "Admin Access Only"});
    }
    next();
}
