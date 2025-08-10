const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const paymentsAPI = {
  createCheckoutSession: async ({ invoiceId, title, amountUSD, successUrl, cancelUrl, metadata }) => {
    const res = await fetch(`${API_BASE_URL}/api/payments/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, title, amountUSD, successUrl, cancelUrl, metadata }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start payment');
    }
    return res.json();
  },
};

export default paymentsAPI;
