import axios from 'axios';
import getFirebaseAuth from './firebase';
import { getIdToken } from 'firebase/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/notifications`,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach Firebase ID token if available
api.interceptors.request.use(async (config) => {
  try {
    const auth = getFirebaseAuth();
    const user = auth && auth.currentUser;
    if (user) {
      const token = await getIdToken(user, true);
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (resp) => resp.data,
  (error) => {
    const msg = error?.response?.data?.error || error?.message || 'Notifications service error';
    return Promise.reject(new Error(msg));
  }
);

const notificationsAPI = {
  // Low-level test sender (maps to server /api/notifications/test)
  sendTestEmail: ({ to, subject, html }) => api.post('/test', { to, subject, html }),

  // High-level helper: build email locally then send via /test route
  sendInvoiceEmail: async (invoiceId, toEmail, options = {}) => {
    const overrideEmail = toEmail || options.overrideEmail;
    if (!overrideEmail || !overrideEmail.includes('@')) {
      throw new Error('Valid recipient email required');
    }
    // If backend has a dedicated endpoint (dev branch feature), try it first
    if (options.useServerTemplate) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications/send-invoice-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceId, overrideEmail }),
        });
        if (res.ok) return res.json();
      } catch (_) {
        // fallback to local template path below
      }
    }
    const subject = `Invoice ${invoiceId}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.REACT_APP_CLIENT_URL || 'http://localhost:3000');
    const invoiceLink = `${origin}/invoice/${invoiceId}`;
    const html = `\n      <div style="font-family:Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111">\n        <h3 style="margin:0 0 12px">Invoice ${invoiceId}</h3>\n        <p>You have a new invoice. View it at the link below:</p>\n        <p><a href="${invoiceLink}" style="display:inline-block;padding:10px 14px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">View Invoice</a></p>\n        <p style="font-size:12px;color:#666;margin-top:16px">Sent via Invoice Chain</p>\n      </div>\n    `;
    return notificationsAPI.sendTestEmail({ to: overrideEmail, subject, html });
  }
};

export default notificationsAPI;
