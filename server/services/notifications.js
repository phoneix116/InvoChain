// Lightweight notifications service (Mailgun/SendGrid)
// Safe no-op when provider is not configured

// Provider selection via env:
// EMAIL_PROVIDER=mailgun|sendgrid (auto-detects if not set)

// SendGrid setup (optional)
let sgMail = null;
try { sgMail = require('@sendgrid/mail'); } catch (_) {}

// Mailgun setup (optional)
let mgClient = null;
try {
  const Mailgun = require('mailgun.js');
  const FormData = require('form-data');
  const mg = new Mailgun(FormData);
  if (process.env.MAILGUN_API_KEY) {
    mgClient = mg.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
      url: process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net'
    });
  }
} catch (_) {}

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Determine provider in priority order
let provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();
if (!provider) {
  if (mgClient) provider = 'mailgun';
  else if (process.env.SENDGRID_API_KEY && sgMail) provider = 'sendgrid';
}

// Initialize provider
if (provider === 'sendgrid' && process.env.SENDGRID_API_KEY && sgMail) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  try { sgMail.setClient(null, { libraryName: 'invoice-chain', libraryVersion: '1.0.0' }); } catch (_) {}
  console.log('📬 Notifications: SendGrid enabled');
} else if (provider === 'mailgun' && mgClient) {
  console.log('📬 Notifications: Mailgun enabled');
} else {
  console.warn('📭 Email notifications disabled (no provider configured)');
  provider = 'none';
}

const FROM_EMAIL = (() => {
  if (provider === 'mailgun') return process.env.MAILGUN_FROM || `no-reply@${process.env.MAILGUN_DOMAIN || 'invoice-chain.local'}`;
  if (provider === 'sendgrid') return process.env.SENDGRID_FROM || 'no-reply@invoice-chain.local';
  return 'no-reply@invoice-chain.local';
})();

async function safeSend({ to, subject, html }) {
  if (provider === 'none') return { disabled: true };

  const recipients = Array.isArray(to) ? to : [to].filter(Boolean);
  if (!recipients.length) return { skipped: true, reason: 'no-recipients' };

  try {
    if (provider === 'sendgrid') {
      const msg = { to: recipients, from: FROM_EMAIL, subject, html };
      const res = await sgMail.send(msg);
      return { ok: true, res };
    }
    if (provider === 'mailgun') {
      const domain = process.env.MAILGUN_DOMAIN;
      if (!domain) return { ok: false, error: new Error('MAILGUN_DOMAIN not set') };
      const res = await mgClient.messages.create(domain, {
        from: FROM_EMAIL,
        to: recipients,
        subject,
        html
      });
      return { ok: true, res };
    }
  } catch (err) {
    const detail = err?.response?.body || err?.response || err?.message;
    console.error('❌ Email send failed:', detail);
    return { ok: false, error: err };
  }
  return { ok: false, error: new Error('Unknown provider') };
}

function formatMoney(amount, currency) {
  try {
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'USD' }).format(num);
  } catch (_) {
    return `${amount} ${currency || ''}`.trim();
  }
}

function buildInvoiceLink(invoice) {
  const id = invoice?.invoiceId || invoice?._id;
  return id ? `${CLIENT_URL}/invoice/${id}` : CLIENT_URL;
}

function baseTemplate({ title, bodyHtml, footerHtml }) {
  return `
  <div style="font-family:Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111">
    <h2 style="margin:0 0 12px">${title}</h2>
    <div>${bodyHtml}</div>
    <hr style="margin:16px 0;border:none;border-top:1px solid #eee"/>
    <div style="font-size:12px;color:#666">${footerHtml || 'This is an automated message from Invoice Chain.'}</div>
  </div>`;
}

async function sendInvoiceCreatedEmail(invoiceDoc) {
  const invoice = invoiceDoc?.toObject ? invoiceDoc.toObject() : invoiceDoc;
  const toCandidates = [invoice?.recipient?.email, invoice?.issuer?.email].filter(Boolean);
  if (!toCandidates.length) return { skipped: true, reason: 'no-recipients' };

  const title = `New Invoice: ${invoice?.title || invoice?.invoiceId}`;
  const amountNum = parseFloat((invoice?.amount || 0).toString());
  const currency = invoice?.currency || 'ETH';
  const link = buildInvoiceLink(invoice);

  const html = baseTemplate({
    title,
    bodyHtml: `
      <p>You have a new invoice${invoice?.recipient?.name ? ` for ${invoice.recipient.name}` : ''}.</p>
      <ul>
        <li><strong>Invoice ID:</strong> ${invoice?.invoiceId}</li>
        <li><strong>Title:</strong> ${invoice?.title || '-'}</li>
        <li><strong>Amount:</strong> ${formatMoney(amountNum, currency)}</li>
        <li><strong>Due Date:</strong> ${invoice?.dueDate ? new Date(invoice.dueDate).toDateString() : '-'}</li>
        <li><strong>Status:</strong> ${invoice?.status || '-'}</li>
      </ul>
      <p><a href="${link}" style="display:inline-block;padding:10px 14px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">View Invoice</a></p>
    `
  });

  return safeSend({ to: toCandidates, subject: title, html });
}

async function sendInvoicePaidEmail(invoiceDoc) {
  const invoice = invoiceDoc?.toObject ? invoiceDoc.toObject() : invoiceDoc;
  const toCandidates = [invoice?.issuer?.email, invoice?.recipient?.email].filter(Boolean);
  if (!toCandidates.length) return { skipped: true, reason: 'no-recipients' };

  const title = `Payment Received: ${invoice?.title || invoice?.invoiceId}`;
  const amountNum = parseFloat((invoice?.amount || 0).toString());
  const currency = invoice?.currency || 'ETH';
  const link = buildInvoiceLink(invoice);
  const tx = invoice?.blockchain?.transactionHash;

  const html = baseTemplate({
    title,
    bodyHtml: `
      <p>Your invoice has been marked as <strong>PAID</strong>.</p>
      <ul>
        <li><strong>Invoice ID:</strong> ${invoice?.invoiceId}</li>
        <li><strong>Amount:</strong> ${formatMoney(amountNum, currency)}</li>
        ${tx ? `<li><strong>Tx Hash:</strong> <code>${tx}</code></li>` : ''}
        <li><strong>Paid On:</strong> ${invoice?.paidDate ? new Date(invoice.paidDate).toLocaleString() : new Date().toLocaleString()}</li>
      </ul>
      <p><a href="${link}" style="display:inline-block;padding:10px 14px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">View Receipt</a></p>
    `
  });

  return safeSend({ to: toCandidates, subject: title, html });
}

async function onInvoiceStatusChange(invoiceDoc, previousStatus) {
  try {
    if (invoiceDoc?.status === 'paid' && previousStatus !== 'paid') {
      return sendInvoicePaidEmail(invoiceDoc);
    }
    return { skipped: true };
  } catch (e) {
    console.error('Notification hook failed:', e.message);
    return { ok: false, error: e };
  }
}

module.exports = {
  ENABLED,
  sendInvoiceCreatedEmail,
  sendInvoicePaidEmail,
  onInvoiceStatusChange,
};
