import Role from "../schema/role.model.js";

export async function createRole(req, res) {
  const newRoleData = req.body;
  try {
    const role = new Role(newRoleData);
    await role.save();
    res.status(200).json({ message: "Role Created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error Creating Role" });
  }
}
