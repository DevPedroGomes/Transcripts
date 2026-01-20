import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export const getStripeClient = () => {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return stripeClient;
};

// For backwards compatibility
export const stripe = {
  get client() {
    return getStripeClient();
  },
};
