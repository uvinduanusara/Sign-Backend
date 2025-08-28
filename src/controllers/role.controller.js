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

// Seed roles for initial setup
export async function seedRoles(req, res) {
  try {
    const roles = ['user', 'admin', 'instructor'];
    
    for (const roleName of roles) {
      const existingRole = await Role.findOne({ roleName });
      if (!existingRole) {
        const role = new Role({ roleName });
        await role.save();
        console.log(`Created role: ${roleName}`);
      }
    }
    
    res.status(200).json({ message: "Roles seeded successfully" });
  } catch (error) {
    console.error("Error seeding roles:", error);
    res.status(500).json({ message: "Error seeding roles" });
  }
}
