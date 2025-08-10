const express = require('express');
const router = express.Router();

// Lazy Stripe init to avoid crashing when no key in dev
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    return require('stripe')(key);
  } catch {
    return null;
  }
}

// Create a Checkout Session for fiat payment
router.post('/create-checkout-session', async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const { invoiceId, title, amountUSD, successUrl, cancelUrl, metadata } = req.body || {};
    if (!invoiceId || !amountUSD) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: title || `Invoice ${invoiceId}` },
            unit_amount: Math.round(Number(amountUSD) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/invoice/${invoiceId}?paid=1`,
      cancel_url: cancelUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/invoice/${invoiceId}?cancelled=1`,
      metadata: {
        invoiceId,
        ...metadata,
      },
    });

    res.json({ success: true, id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session', message: error.message });
  }
});

// Webhook placeholder (you can wire to update Mongo invoice status on payment success)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // Implement signature verification with STRIPE_WEBHOOK_SECRET for production
  res.json({ received: true });
});

module.exports = router;
