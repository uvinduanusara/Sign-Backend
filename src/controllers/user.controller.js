import User from "../schema/user.model.js";
import Role from "../schema/role.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createCustomer,
  createSubscriptionLink,
  createOneTimePaymentSession,
  verifyWebhookSignature,
  checkCustomerExists,
} from "../middleware/stripe.middleware.js";
import Stripe from 'stripe';

// Initialize stripe lazily to ensure env vars are loaded
let stripe;
function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// Get secret key lazily to ensure env vars are loaded
function getSecretKey() {
  return process.env.SCRECT_KEY;
}

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

    const token = jwt.sign(tokenPayload, getSecretKey(), { expiresIn: "1h" });

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

export async function createStripeCheckoutSession(req, res) {
  try {
    const userId = req.user.id;

    // Get user data to access their Stripe customer ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let stripeCustomerId = user.stripCustomerId;

    // Check if Stripe customer exists, if not create one
    if (!stripeCustomerId) {
      console.log('No Stripe customer ID found for user, creating new customer');
      
      const newCustomer = await createCustomer(user.email, `${user.firstName} ${user.lastName}`, {
        userId: userId,
        userRole: 'user'
      });

      if (!newCustomer.success) {
        return res.status(400).json({
          message: "Failed to create Stripe customer",
          error: newCustomer.error,
        });
      }

      stripeCustomerId = newCustomer.customerId;
      
      // Update user with new Stripe customer ID
      await User.findByIdAndUpdate(userId, { stripCustomerId: stripeCustomerId });
      console.log(`Created new Stripe customer ${stripeCustomerId} for user ${userId}`);
      
    } else {
      // Check if the existing customer still exists in Stripe
      const customerCheck = await checkCustomerExists(stripeCustomerId);
      
      if (!customerCheck.success) {
        return res.status(400).json({
          message: "Failed to verify Stripe customer",
          error: customerCheck.error,
        });
      }

      if (!customerCheck.exists) {
        console.log(`Stripe customer ${stripeCustomerId} does not exist, creating new one`);
        
        const newCustomer = await createCustomer(user.email, `${user.firstName} ${user.lastName}`, {
          userId: userId,
          userRole: 'user'
        });

        if (!newCustomer.success) {
          return res.status(400).json({
            message: "Failed to create Stripe customer",
            error: newCustomer.error,
          });
        }

        stripeCustomerId = newCustomer.customerId;
        
        // Update user with new Stripe customer ID
        await User.findByIdAndUpdate(userId, { stripCustomerId: stripeCustomerId });
        console.log(`Created replacement Stripe customer ${stripeCustomerId} for user ${userId}`);
      }
    }

    // Create Stripe checkout session using the subscription link method with the product from .env
    const checkoutSession = await createSubscriptionLink(stripeCustomerId);

    if (!checkoutSession.success) {
      return res.status(400).json({
        message: "Failed to create checkout session",
        error: checkoutSession.error,
      });
    }

    res.status(200).json({
      success: true,
      sessionId: checkoutSession.sessionId,
      checkoutUrl: checkoutSession.url,
      message: "Stripe checkout session created successfully"
    });

  } catch (error) {
    console.error("Create checkout session error:", error);
    res.status(500).json({ 
      message: "Server error creating checkout session",
      error: error.message 
    });
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
      profile: user.profile,
      bio: user.bio,
      location: user.location,
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

// Update user profile
export async function updateUserProfile(req, res) {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, bio, location } = req.body;

    // Validate input
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        success: false, 
        message: "First name, last name, and email are required" 
      });
    }

    // Check if email is already in use by another user
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is already in use by another user" 
      });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        bio: bio?.trim() || "",
        location: location?.trim() || ""
      },
      { new: true, runValidators: true }
    ).populate('role', 'roleName');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        profile: updatedUser.profile,
        bio: updatedUser.bio,
        location: updatedUser.location,
        isProMember: updatedUser.isProMember,
        proMembershipExpiry: updatedUser.proMembershipExpiry,
        roleName: updatedUser.role.roleName,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error updating profile" 
    });
  }
}

export async function verifyStripeSession(req, res) {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    console.log(`Verifying Stripe session ${sessionId} for user ${userId}`);

    if (!sessionId) {
      return res.status(400).json({ 
        success: false,
        message: "Session ID is required" 
      });
    }

    // Retrieve the session from Stripe with expansion to get subscription details
    console.log('Retrieving session from Stripe...');
    let session;
    
    try {
      session = await getStripe().checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer']
      });
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      return res.status(400).json({ 
        success: false,
        message: "Failed to retrieve session from Stripe",
        error: stripeError.message
      });
    }
    
    if (!session) {
      return res.status(404).json({ 
        success: false,
        message: "Session not found" 
      });
    }
    
    console.log('Session retrieved successfully');

    // Check if session was paid
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false,
        message: "Payment not completed",
        paymentStatus: session.payment_status
      });
    }

    // Get user data to verify customer match
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Verify the session belongs to this user or update if missing
    const sessionCustomerIdForUpdate = typeof session.customer === 'object' ? session.customer.id : session.customer;
    
    if (!user.stripCustomerId) {
      // User doesn't have a Stripe customer ID yet, update it
      console.log(`User ${userId} missing stripCustomerId, updating with session customer ${sessionCustomerIdForUpdate}`);
      user.stripCustomerId = sessionCustomerIdForUpdate;
      await User.findByIdAndUpdate(userId, { stripCustomerId: sessionCustomerIdForUpdate });
    } else if (sessionCustomerIdForUpdate !== user.stripCustomerId) {
      console.warn(`Session customer ${sessionCustomerIdForUpdate} doesn't match user stripCustomerId ${user.stripCustomerId}`);
      // For now, we'll allow this but log it
      // In production, you might want to be stricter
    }

    // Check if user is already pro
    if (user.isProMember && user.proMembershipExpiry && new Date(user.proMembershipExpiry) > new Date()) {
      return res.status(200).json({
        success: true,
        message: "User is already a pro member",
        isProMember: true,
        proMembershipExpiry: user.proMembershipExpiry
      });
    }

    let expiryDate;
    let subscriptionId = null;
    
    console.log(`Session mode: ${session.mode}, Payment status: ${session.payment_status}`);
    const sessionCustomerId = typeof session.customer === 'object' ? session.customer.id : session.customer;
    console.log(`Session customer: ${sessionCustomerId}, User stripCustomerId: ${user.stripCustomerId}`);
    
    // Check if this is a subscription session
    if (session.mode === 'subscription' && session.subscription) {
      console.log('Processing subscription session...');
      // For subscription mode, get the subscription details
      const subscription = typeof session.subscription === 'object' 
        ? session.subscription 
        : await getStripe().subscriptions.retrieve(session.subscription);
      
      if (subscription && subscription.current_period_end) {
        // Use the subscription's current period end as expiry date
        const periodEnd = subscription.current_period_end;
        // Check if periodEnd is a valid timestamp
        if (periodEnd && !isNaN(periodEnd)) {
          expiryDate = new Date(periodEnd * 1000);
          console.log(`Subscription ${subscription.id} active until ${expiryDate.toISOString()}`);
        } else {
          console.log('Invalid period end, using fallback date');
          expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
        }
        subscriptionId = subscription.id;
        console.log(`Subscription status: ${subscription.status}`);
      } else {
        console.log('No subscription details available, using fallback');
        // Fallback to 30 days if subscription details not available
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
      }
    } else {
      console.log('Processing one-time payment session or subscription without details...');
      // For one-time payment mode, use metadata or default duration
      const membershipType = session.metadata?.membership_type;
      const durationDays = session.metadata?.duration_days;
      
      let duration = 30; // Default to 30 days
      if (durationDays) {
        duration = parseInt(durationDays);
      } else if (membershipType === 'yearly') {
        duration = 365;
      } else if (membershipType === 'monthly') {
        duration = 30;
      }
      
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + duration);
    }

    // Make sure we have a valid expiry date
    if (!expiryDate || isNaN(expiryDate.getTime())) {
      console.log('Invalid expiry date detected, using default 30 days');
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
    }
    
    // Update user's pro membership
    const updateData = { 
      isProMember: true,
      proMembershipExpiry: expiryDate,
      stripCustomerId: sessionCustomerIdForUpdate // Ensure customer ID is saved
    };
    
    if (subscriptionId) {
      updateData.subscriptionId = subscriptionId;
      updateData.subscriptionStatus = 'active';
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).populate('role', 'roleName');

    console.log(`Pro membership activated for user ${user.email} via session verification until ${expiryDate}`);

    res.status(200).json({
      success: true,
      message: "Pro membership activated successfully",
      isProMember: true,
      proMembershipExpiry: expiryDate,
      subscriptionId: subscriptionId,
      sessionMode: session.mode,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        isProMember: updatedUser.isProMember,
        proMembershipExpiry: updatedUser.proMembershipExpiry,
        roleName: updatedUser.role.roleName,
        subscriptionId: subscriptionId
      }
    });

  } catch (error) {
    console.error("Verify stripe session error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error verifying session",
      error: error.message 
    });
  }
}

export async function handleStripeWebhook(req, res) {
  try {
    const signature = req.headers['stripe-signature'];
    
    // Verify webhook signature
    const webhookResult = verifyWebhookSignature(req.body, signature);
    
    if (!webhookResult.success) {
      console.error('Webhook signature verification failed:', webhookResult.error);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    const event = webhookResult.event;

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Checkout session completed:', session.id);
    
    // Get the customer from the session
    const customerId = session.customer;
    
    // Find user by Stripe customer ID
    let user = await User.findOne({ stripCustomerId: customerId });
    
    if (!user) {
      console.error('User not found for Stripe customer:', customerId);
      // Try to find user by email from Stripe customer if available
      try {
        const customerResult = await checkCustomerExists(customerId);
        if (customerResult.success && customerResult.exists && customerResult.customer.email) {
          const userByEmail = await User.findOne({ email: customerResult.customer.email });
          if (userByEmail) {
            // Update user with Stripe customer ID
            await User.findByIdAndUpdate(userByEmail._id, { stripCustomerId: customerId });
            user = userByEmail;
            console.log(`Updated user ${userByEmail._id} with Stripe customer ID ${customerId}`);
          }
        }
      } catch (error) {
        console.error('Error trying to find user by email:', error);
      }
      
      if (!user) {
        return;
      }
    }

    // Check if this is a subscription or one-time payment
    if (session.mode === 'subscription') {
      // For subscription mode, the subscription webhook will handle the pro membership activation
      console.log(`Subscription checkout completed for user ${user.email}. Waiting for subscription webhook.`);
      
      // Store the subscription ID if available
      if (session.subscription) {
        await User.findByIdAndUpdate(
          user._id,
          { 
            subscriptionId: session.subscription,
            subscriptionStatus: 'pending_activation'
          },
          { new: true }
        );
      }
    } else {
      // For payment mode (one-time), activate immediately
      const membershipType = session.metadata?.membership_type;
      const durationDays = session.metadata?.duration_days;
      
      let duration = 30; // Default to 30 days
      if (durationDays) {
        duration = parseInt(durationDays);
      } else if (membershipType === 'yearly') {
        duration = 365;
      } else if (membershipType === 'monthly') {
        duration = 30;
      }

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + duration);

      // Update user's pro membership
      await User.findByIdAndUpdate(
        user._id,
        { 
          isProMember: true,
          proMembershipExpiry: expiryDate
        },
        { new: true }
      );

      console.log(`Pro membership activated for user ${user.email} for ${duration} days`);
    }
    
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    console.log('Subscription updated:', subscription.id);
    
    // Find user by Stripe customer ID
    const user = await User.findOne({ stripCustomerId: subscription.customer });
    
    if (!user) {
      console.error('User not found for Stripe customer:', subscription.customer);
      return;
    }

    // Check if subscription is active
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      // Calculate expiry based on current period end
      const expiryDate = new Date(subscription.current_period_end * 1000);
      
      // Update user's pro membership
      await User.findByIdAndUpdate(
        user._id,
        { 
          isProMember: true,
          proMembershipExpiry: expiryDate,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status
        },
        { new: true }
      );

      console.log(`Pro membership updated for user ${user.email} until ${expiryDate}`);
    } else {
      // Handle inactive subscriptions
      await User.findByIdAndUpdate(
        user._id,
        { 
          subscriptionStatus: subscription.status
        },
        { new: true }
      );
    }
    
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCancellation(subscription) {
  try {
    console.log('Subscription cancelled:', subscription.id);
    
    // Find user by Stripe customer ID
    const user = await User.findOne({ stripCustomerId: subscription.customer });
    
    if (!user) {
      console.error('User not found for Stripe customer:', subscription.customer);
      return;
    }

    // If subscription is cancelled but still active until period end
    if (subscription.cancel_at_period_end && subscription.current_period_end) {
      const expiryDate = new Date(subscription.current_period_end * 1000);
      
      await User.findByIdAndUpdate(
        user._id,
        { 
          proMembershipExpiry: expiryDate,
          subscriptionStatus: 'cancelled_pending'
        },
        { new: true }
      );

      console.log(`Pro membership for user ${user.email} will expire on ${expiryDate}`);
    } else {
      // Immediate cancellation
      await User.findByIdAndUpdate(
        user._id,
        { 
          isProMember: false,
          proMembershipExpiry: new Date(),
          subscriptionId: null,
          subscriptionStatus: 'cancelled'
        },
        { new: true }
      );

      console.log(`Pro membership cancelled immediately for user ${user.email}`);
    }
    
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('Payment intent succeeded:', paymentIntent.id);
    // Additional payment handling logic can be added here if needed
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}
