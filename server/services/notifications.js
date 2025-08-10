// Lightweight notifications service (SendGrid based)
// Safe no-op when SENDGRID_API_KEY is not configured

const sgMail = (() => {
  try {
    return require('@sendgrid/mail');
  } catch (e) {
    return null;
  }
})();

const ENABLED = !!process.env.SENDGRID_API_KEY && !!sgMail;
const FROM_EMAIL = process.env.SENDGRID_FROM || 'no-reply@invoice-chain.local';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

if (ENABLED) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // Optional: identify the app
  try { sgMail.setClient(null, { libraryName: 'invoice-chain', libraryVersion: '1.0.0' }); } catch (_) {}
} else {
  console.warn('📭 SendGrid not configured; email notifications are disabled');
}

function safeSend(msg) {
  if (!ENABLED) return Promise.resolve({ disabled: true });
  return sgMail
    .send(msg)
    .then(res => ({ ok: true, res }))
    .catch(err => {
      console.error('❌ Email send failed:', err?.response?.body || err.message);
      return { ok: false, error: err };
    });
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

  const msg = {
    to: toCandidates,
    from: FROM_EMAIL,
    subject: title,
    html
  };
  return safeSend(msg);
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

  const msg = {
    to: toCandidates,
    from: FROM_EMAIL,
    subject: title,
    html
  };
  return safeSend(msg);
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
