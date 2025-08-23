import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCustomer(email, name, metadata = {}) {
  try {
    const customer = await stripe.customers.create({
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

    const prices = await stripe.prices.list({
      product: productId,
      active: true
    });
    
    if (prices.data.length === 0) {
      throw new Error('No active prices found for product');
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: prices.data[0].id,
        quantity: 1
      }],
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
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
    const subscription = await stripe.subscriptions.update(subscriptionId, {
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
    const customer = await stripe.customers.update(customerId, {
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
    const subscriptions = await stripe.subscriptions.list({
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

export async function verifyWebhookSignature(payload, signature) {
  try {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      throw new Error('Webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(
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