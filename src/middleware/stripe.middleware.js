import Stripe from 'stripe';

// Initialize stripe lazily to ensure env vars are loaded
let stripe;
function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export async function createCustomer(email, name, metadata = {}) {
  try {
    const customer = await getStripe().customers.create({
      email,
      name,
      metadata
    });
    
    return {
      success: true,
      customer,
      customerId: customer.id,
      message: 'Customer created successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to create customer'
    };
  }
}

export async function createSubscriptionLink(customerId) {
  try {
    const productId = process.env.STRIPE_PRODUCT_ID;
    
    if (!productId) {
      throw new Error('Stripe Product ID not found in environment variables');
    }

    const prices = await getStripe().prices.list({
      product: productId,
      active: true
    });
    
    if (prices.data.length === 0) {
      throw new Error('No active prices found for product');
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: prices.data[0].id,
        quantity: 1
      }],
      success_url: `${process.env.CLIENT_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-membership?cancelled=true`,
      allow_promotion_codes: true
    });
    
    return {
      success: true,
      sessionId: session.id,
      url: session.url,
      message: 'Subscription link created successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to create subscription link'
    };
  }
}

export async function cancelSubscription(subscriptionId) {
  try {
    const subscription = await getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    
    return {
      success: true,
      subscription,
      message: 'Subscription will be canceled at period end'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to cancel subscription'
    };
  }
}

export async function updateCustomerEmail(customerId, newEmail) {
  try {
    const customer = await getStripe().customers.update(customerId, {
      email: newEmail
    });
    
    return {
      success: true,
      customer,
      message: 'Customer email updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to update customer email'
    };
  }
}

export async function getCustomerSubscriptions(customerId) {
  try {
    const subscriptions = await getStripe().subscriptions.list({
      customer: customerId,
      status: 'all'
    });
    
    return {
      success: true,
      subscriptions: subscriptions.data,
      message: 'Subscriptions retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve subscriptions'
    };
  }
}

export async function createMembershipCheckoutSession(customerId, membershipType) {
  try {
    let priceData;
    
    // Define pricing based on membership type
    if (membershipType === 'monthly') {
      priceData = {
        currency: 'usd',
        product_data: {
          name: 'SignLearn AI Pro - Monthly',
          description: 'Access to premium learning materials and features',
        },
        unit_amount: 999, // $9.99 in cents
        recurring: {
          interval: 'month',
        },
      };
    } else if (membershipType === 'yearly') {
      priceData = {
        currency: 'usd',
        product_data: {
          name: 'SignLearn AI Pro - Yearly',
          description: 'Access to premium learning materials and features (Save $20!)',
        },
        unit_amount: 9999, // $99.99 in cents
        recurring: {
          interval: 'year',
        },
      };
    } else {
      throw new Error('Invalid membership type. Must be "monthly" or "yearly"');
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price_data: priceData,
        quantity: 1
      }],
      success_url: `${process.env.CLIENT_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-membership?cancelled=true`,
      allow_promotion_codes: true,
      metadata: {
        membership_type: membershipType,
        user_id: customerId
      }
    });
    
    return {
      success: true,
      sessionId: session.id,
      url: session.url,
      message: 'Membership checkout session created successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to create membership checkout session'
    };
  }
}

export async function createOneTimePaymentSession(customerId, membershipType) {
  try {
    let priceData;
    let durationDays;
    
    // Define pricing for one-time payments
    if (membershipType === 'monthly') {
      priceData = {
        currency: 'usd',
        product_data: {
          name: 'SignLearn AI Pro - 30 Days',
          description: 'One-time payment for 30 days of premium access',
        },
        unit_amount: 999, // $9.99 in cents
      };
      durationDays = 30;
    } else if (membershipType === 'yearly') {
      priceData = {
        currency: 'usd',
        product_data: {
          name: 'SignLearn AI Pro - 365 Days',
          description: 'One-time payment for 365 days of premium access (Save $20!)',
        },
        unit_amount: 9999, // $99.99 in cents
      };
      durationDays = 365;
    } else {
      throw new Error('Invalid membership type. Must be "monthly" or "yearly"');
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: priceData,
        quantity: 1
      }],
      success_url: `${process.env.CLIENT_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-membership?cancelled=true`,
      metadata: {
        membership_type: membershipType,
        duration_days: durationDays.toString(),
        user_id: customerId
      }
    });
    
    return {
      success: true,
      sessionId: session.id,
      url: session.url,
      message: 'One-time payment session created successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to create one-time payment session'
    };
  }
}

export async function checkCustomerExists(customerId) {
  try {
    const customer = await getStripe().customers.retrieve(customerId);
    
    return {
      success: true,
      customer,
      exists: !customer.deleted,
      message: 'Customer retrieved successfully'
    };
  } catch (error) {
    if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      return {
        success: true,
        exists: false,
        message: 'Customer does not exist'
      };
    }
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to check customer existence'
    };
  }
}

export async function verifyWebhookSignature(payload, signature) {
  try {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      throw new Error('Webhook secret not configured');
    }

    const event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      endpointSecret
    );
    
    return {
      success: true,
      event,
      message: 'Webhook signature verified'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Webhook signature verification failed'
    };
  }
}