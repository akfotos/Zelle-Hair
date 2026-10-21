require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');

const app = express();
const port = process.env.PORT || 4173;
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

const products = {
  'Silk Straight 22"': 18900,
  'Voluminous Body Wave 24"': 21900,
  'Deep Wave Luxe 20"': 19900,
  'HD Lace Front — Body Wave': 34900,
  'Glass Bob — Glueless': 28900,
  'Kinky Curly Crown 18"': 31900,
  'Triple Weft Bundle Set': 25900,
  'Loose Wave Duo + Closure': 23500,
  'Radiance Straight Single': 9500,
  'HD Lace Frontal — 13×4': 14900,
  'Invisible Lace Closure — 5×5': 11900,
  'Pre-Plucked Frontal — 13×6': 17900
};

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe checkout is not configured yet.' });

  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: 'Your bag is empty.' });

    const line_items = items.map(({ name, option, quantity }) => {
      const basePrice = products[name];
      if (!basePrice) throw new Error('One or more products are unavailable.');
      const allowedOptions = ['As shown', '20 inch', '22 inch', '24 inch', '26 inch'];
      const selectedOption = allowedOptions.includes(option) ? option : 'As shown';
      const optionIndex = allowedOptions.indexOf(selectedOption);
      const unitAmount = basePrice + Math.max(0, optionIndex) * 1500;
      return {
        price_data: {
          currency: 'gbp',
          product_data: { name, description: `Selected length: ${selectedOption}` },
          unit_amount: unitAmount
        },
        quantity: Math.min(Math.max(Number(quantity) || 1, 1), 10)
      };
    });

    const origin = `${req.protocol}://${req.get('host')}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_address_collection: { allowed_countries: ['GB'] },
      phone_number_collection: { enabled: true },
      success_url: `${origin}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store.html?checkout=cancelled`
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Checkout could not be started.' });
  }
});

app.listen(port, () => console.log(`ZELLE HAIR running at http://localhost:${port}`));
