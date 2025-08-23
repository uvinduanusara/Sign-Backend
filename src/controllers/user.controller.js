import User from "../schema/user.model.js";
import Role from "../schema/role.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createCustomer,
  createSubscriptionLink,
} from "../middleware/stripe.middleware.js";

const secretkey = process.env.SCRECT_KEY;

export async function createUser(req, res) {
  try {
    const { email, password, roleName = "customer", profile } = req.body;

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
    };

    const token = jwt.sign(tokenPayload, secretkey, { expiresIn: "1h" });

    res.status(200).json({
      message: "Login Successfull",
      token,
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
