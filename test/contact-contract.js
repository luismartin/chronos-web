// Contract test for the /contact form: `npm test`, plain node, no framework.
//
// The form and its backend are deployed by two different hosts on two
// different clocks (GitHub Pages / Netlify, see README.md), so nothing at
// build time forces them to agree. In September 2026 they stopped agreeing:
// the "App feedback" option was added to the form alone, and every submission
// from it came back `invalid_category` while the page reported only a generic
// "Something went wrong". This file asserts the couplings that break silently.
//
// It reads both files as text and runs the page's own error-mapping code, so
// it fails on drift rather than on a copy of the logic kept here.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');
const page = read('docs/contact/index.html');
const fn = read('netlify/functions/contact.js');

const failures = [];
const check = (ok, what) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${what}`);
  if (!ok) failures.push(what);
};

// --- 1. The category list, in its three copies here -------------------------
// (A fourth lives in the app repo: StoreReviewService.buildFeedbackFormUrl
// sends `category=feedback`. Nothing here can see it, hence case 2 below.)

const options = [...page.matchAll(/<option value="([a-z_]+)"/g)].map((m) => m[1]);
const labels = fn.match(/const CATEGORY_LABELS = \{[\s\S]*?\n\};/);
const allowlist = page.match(/\[((?:\s*'[a-z_]+',?)+)\]\.indexOf\(wanted\)/);

check(options.length > 0, 'the form declares category options');
check(!!labels, 'the function declares CATEGORY_LABELS');
check(!!allowlist, 'the page declares a ?category= allowlist');

if (labels && allowlist) {
  const keys = [...labels[0].matchAll(/^ {2}([a-z_]+):/gm)].map((m) => m[1]);
  const allowed = [...allowlist[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
  const missing = options.filter((o) => !keys.includes(o));
  const orphan = keys.filter((k) => !options.includes(k));
  const unlinkable = options.filter((o) => !allowed.includes(o));

  check(missing.length === 0,
    `every form option is accepted by the function${missing.length ? ` (missing: ${missing})` : ''}`);
  check(orphan.length === 0,
    `the function knows no category the form cannot send${orphan.length ? ` (orphan: ${orphan})` : ''}`);
  check(unlinkable.length === 0,
    `every form option can be preselected via ?category=${unlinkable.length ? ` (missing: ${unlinkable})` : ''}`);

  // 2. The app deep-links straight to this one; it must never be dropped.
  check(keys.includes('feedback') && options.includes('feedback'),
    '`feedback` survives on both sides (the app links to it)');
}

// --- 3. Error codes reach a message the visitor can act on ------------------

const table = page.match(/  var GENERIC_ERROR = \[[\s\S]*?method_not_allowed: CONFIG_ERROR\n  \};/);
const dispatch = page.match(
  /          var code = \(result\.data[\s\S]*?var msg = ERROR_MESSAGES\[code\] \|\| GENERIC_ERROR;/
);
check(!!table && !!dispatch, 'the page still maps error codes to messages');

if (table && dispatch) {
  const logged = [];
  const win = { console: { error: (...a) => logged.push(a.join(' ')) } };
  const resolve = new Function('result', 'window', 'console',
    `${table[0]}\n${dispatch[0]}\nreturn msg;`);

  // Every code the function can return, plus the two shapes the page must
  // survive unaided: a body with no `error`, and a code from a future backend.
  const codes = [...new Set([...fn.matchAll(/error: '([a-z_]+)'/g)].map((m) => m[1]))];
  const cases = [...codes, null, 'a_code_from_the_future'];

  let allUsable = true;
  let allBilingual = true;
  for (const code of cases) {
    const msg = resolve({ ok: false, data: code ? { error: code } : {} }, win, win.console);
    if (!Array.isArray(msg) || msg.length !== 2 || !msg[0] || !msg[1]) allUsable = false;
    else if (msg[0] === msg[1]) allBilingual = false;
  }
  check(allUsable, `all ${cases.length} error cases resolve to a message`);
  check(allBilingual, 'no error message is the same text in both languages');
  check(logged.length === cases.length,
    'every failed submission logs its code for debugging');

  // The distinctions that exist only to give different advice.
  const es = (code) => resolve({ ok: false, data: { error: code } }, win, win.console)[1];
  check(es('rate_limited') !== es('send_failed'),
    'rate limiting does not read as a transient failure');
  check(es('invalid_category') !== es('send_failed'),
    'our own misconfiguration does not read as a transient failure');
}

// --- 4. The inbox stays off the page ---------------------------------------
// Replacing exposed mailto links with this form is why it exists (542e906);
// an address pasted back in as a "fallback" would undo that silently.
check(!/mailto:|chronosintelligentalarm@/i.test(page),
  'the contact page exposes no email address');

console.log(failures.length === 0
  ? '\nAll contract checks passed.'
  : `\n${failures.length} check(s) failed.`);
process.exit(failures.length === 0 ? 0 : 1);
