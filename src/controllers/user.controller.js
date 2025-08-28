import User from "../schema/user.model.js";
import Role from "../schema/role.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createCustomer,
  createSubscriptionLink,
} from "../middleware/stripe.middleware.js";

const secretkey = process.env.SCRECT_KEY;

export async function getAllUsers(req, res) {
  try {
    // fetch all users and populate role name
    const users = await User.find().populate("role", "roleName");

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
}

export async function createUser(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      roleName = "user",
      profile,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const role = await Role.findOne({ roleName: roleName.toLowerCase() });
    if (!role) {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    const stripeCustomer = await createCustomer(email, email, {
      userRole: roleName,
    });

    if (!stripeCustomer.success) {
      return res.status(400).json({
        message: "Failed to create Stripe customer",
        error: stripeCustomer.error,
      });
    }

    const hasedPassword = bcrypt.hashSync(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hasedPassword,
      role: role._id,
      profile,
      stripCustomerId: stripeCustomer.customerId,
    });
    await user.save();

    res.status(201).json({ message: "User Created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error Creating User" });
  }
}

export async function LoginUser(req, res) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).populate("role");
    if (!user) {
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role._id,
      roleName: user.role.roleName,
      isProMember: user.isProMember,
      proMembershipExpiry: user.proMembershipExpiry,
    };

    const token = jwt.sign(tokenPayload, secretkey, { expiresIn: "1h" });

    res.status(200).json({
      message: "Login Successfull",
      token,
      id: user._id,
      email: user.email,
      role: user.role._id,
      roleName: user.role.roleName,
      isProMember: user.isProMember,
      proMembershipExpiry: user.proMembershipExpiry,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
}

export async function createSubscription(req, res) {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const subscriptionLink = await createSubscriptionLink(customerId);

    if (!subscriptionLink.success) {
      return res.status(400).json({
        message: "Failed to create subscription link",
        error: subscriptionLink.error,
      });
    }

    res.status(200).json({
      message: "Subscription link created successfully",
      url: subscriptionLink.url,
      sessionId: subscriptionLink.sessionId,
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    res
      .status(500)
      .json({ message: "Server error during subscription creation" });
  }
}

export async function purchaseProMembership(req, res) {
  try {
    const { duration = 30 } = req.body; // Default 30 days
    const userId = req.user.id;

    // For now, we'll simulate a successful payment
    // In production, this would integrate with Stripe payment processing
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + duration);

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isProMember: true,
        proMembershipExpiry: expiryDate
      },
      { new: true, runValidators: true }
    ).populate('role', 'roleName');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Pro membership purchased successfully",
      user: {
        id: user._id,
        email: user.email,
        isProMember: user.isProMember,
        proMembershipExpiry: user.proMembershipExpiry,
        roleName: user.role.roleName
      }
    });
  } catch (error) {
    console.error("Purchase pro membership error:", error);
    res.status(500).json({ message: "Server error purchasing pro membership" });
  }
}

export async function getUserProfile(req, res) {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('role', 'roleName')
      .select('-password'); // Exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isProMember: user.isProMember,
      proMembershipExpiry: user.proMembershipExpiry,
      roleName: user.role.roleName,
      status: user.status,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Server error getting user profile" });
  }
}
