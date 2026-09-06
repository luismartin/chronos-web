// Backend for the /contact form on chronosintelligentalarm.com (served by
// GitHub Pages, which cannot run server code - see README.md). Deployed as a
// Netlify Function purely to hold this one endpoint; it does not front the
// live site. Sends via Resend: one notification to us, one confirmation to
// whoever filled the form. See docs/contact/index.html for the form itself.
//
// Required env vars (set in Netlify site settings, never committed):
//   RESEND_API_KEY

const { Resend } = require('resend');
const { getStore } = require('@netlify/blobs');

const ALLOWED_ORIGIN = 'https://chronosintelligentalarm.com';
const DEST_EMAIL = 'chronosintelligentalarm@gmail.com';
const FROM_ADDRESS = 'Chronos <contacto@chronosintelligentalarm.com>';

const RATE_LIMIT_MAX = 5; // submissions
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // per hour, per IP
const MIN_SUBMIT_MS = 2000; // time-trap: real humans take longer than this to fill the form
const MAX_MESSAGE_LEN = 5000;

const CATEGORY_LABELS = {
  bug: { en: 'Bug report', es: 'Reportar un error' },
  deletion: { en: 'Account deletion', es: 'Eliminación de cuenta' },
  other: { en: 'Other', es: 'Otro' },
};

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const headers = corsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, headers, { ok: false, error: 'method_not_allowed' });
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (err) {
    return json(400, headers, { ok: false, error: 'invalid_json' });
  }

  const { category, email, message, website, ts, lang } = data;

  // Honeypot: a hidden field no real visitor fills in. Pretend success so
  // the bot doesn't learn to look for a different signal.
  if (website) {
    return json(200, headers, { ok: true });
  }

  // Time-trap: `ts` is the timestamp the form was rendered, sent back by the
  // page's JS. A submit faster than a human can type is almost certainly a bot.
  const elapsed = Date.now() - Number(ts || 0);
  if (!ts || Number.isNaN(elapsed) || elapsed < MIN_SUBMIT_MS) {
    return json(200, headers, { ok: true });
  }

  if (!CATEGORY_LABELS[category]) {
    return json(400, headers, { ok: false, error: 'invalid_category' });
  }
  if (!isValidEmail(email)) {
    return json(400, headers, { ok: false, error: 'invalid_email' });
  }
  if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_LEN) {
    return json(400, headers, { ok: false, error: 'invalid_message' });
  }

  const uiLang = lang === 'es' ? 'es' : 'en';
  const ip = clientIp(event);

  const withinLimit = await checkRateLimit(ip);
  if (!withinLimit) {
    return json(429, headers, { ok: false, error: 'rate_limited' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const categoryLabel = CATEGORY_LABELS[category][uiLang];
  const trimmedMessage = message.trim();

  try {
    // 1. Notify us. Reply-To is the visitor's address so replying in Gmail
    // goes straight to them.
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: DEST_EMAIL,
      replyTo: email,
      subject: `[Chronos contact] ${categoryLabel}`,
      text: `Category: ${categoryLabel}\nFrom: ${email}\n\n${trimmedMessage}`,
      html:
        `<p><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>` +
        `<p><strong>From:</strong> ${escapeHtml(email)}</p>` +
        `<p>${escapeHtml(trimmedMessage).replace(/\n/g, '<br>')}</p>`,
    });

    // 2. Confirm receipt to the visitor. Reply-To is our own inbox, since
    // contacto@ is send-only (no mailbox behind it).
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      replyTo: DEST_EMAIL,
      subject:
        uiLang === 'es' ? 'Hemos recibido tu mensaje — Chronos' : "We've received your message — Chronos",
      text: confirmationText(uiLang, categoryLabel, trimmedMessage),
      html: confirmationHtml(uiLang, categoryLabel, trimmedMessage),
    });
  } catch (err) {
    console.error('resend_error', err);
    return json(502, headers, { ok: false, error: 'send_failed' });
  }

  return json(200, headers, { ok: true });
};

async function checkRateLimit(ip) {
  try {
    const store = getStore('contact-rate-limit');
    const now = Date.now();
    const record = (await store.get(ip, { type: 'json' })) || { windowStart: now, count: 0 };
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
      record.windowStart = now;
      record.count = 0;
    }
    record.count += 1;
    await store.setJSON(ip, record);
    return record.count <= RATE_LIMIT_MAX;
  } catch (err) {
    // Fail open: a Blobs outage shouldn't block real visitors from reaching us.
    console.error('rate_limit_error', err);
    return true;
  }
}

function clientIp(event) {
  const forwarded = event.headers['x-forwarded-for'] || '';
  return (
    event.headers['x-nf-client-connection-ip'] ||
    forwarded.split(',')[0].trim() ||
    'unknown'
  );
}

function corsHeaders(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(statusCode, headers, body) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function confirmationText(lang, categoryLabel, message) {
  return lang === 'es'
    ? `Hemos recibido tu mensaje (${categoryLabel}) y te responderemos lo antes posible.\n\nTu mensaje:\n${message}`
    : `We've received your message (${categoryLabel}) and will get back to you as soon as possible.\n\nYour message:\n${message}`;
}

function confirmationHtml(lang, categoryLabel, message) {
  const intro =
    lang === 'es'
      ? `Hemos recibido tu mensaje (<strong>${escapeHtml(categoryLabel)}</strong>) y te responderemos lo antes posible.`
      : `We've received your message (<strong>${escapeHtml(categoryLabel)}</strong>) and will get back to you as soon as possible.`;
  return `<p>${intro}</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`;
}
