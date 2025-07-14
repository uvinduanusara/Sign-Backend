import Role from "../schema/role.model.js";
import { isAdmin } from "./user.controller.js";

export async function createRole(req, res) {
  const newRoleData = req.body;
  try {
    // if (isAdmin(req)) {
    //   return res.status(400).json({ message: "Login as Administrator" });
    // }
    const role = new Role(newRoleData);
    await role.save();
    res.status(200).json({ message: "Role Created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error Creating Role" });
  }
}
