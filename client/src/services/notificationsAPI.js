const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const notificationsAPI = {
  sendInvoiceEmail: async (invoiceId, overrideEmail) => {
    const res = await fetch(`${API_BASE_URL}/api/notifications/send-invoice-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, overrideEmail }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send invoice email');
    }
    return res.json();
  },
};

export default notificationsAPI;
