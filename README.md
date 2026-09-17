# Chronos — Website

Public landing page for the Chronos Android app (EN/ES toggle).

- **Live**: https://chronosintelligentalarm.com/
  (the old https://luismartin.github.io/chronos-web/ still resolves)

## Hosting

Served by **GitHub Pages**, not Cloudflare: branch `main`, folder `/docs`,
custom domain pinned by `docs/CNAME`. Every push to `main` triggers GitHub's
own `pages build and deployment` workflow (~40 s), then a CDN cache of
`max-age=600` — so a change can take up to ~10 min to appear on an already
visited URL.

`docs/.nojekyll` disables Jekyll processing. Without it, Pages silently drops
any file or folder whose name starts with `_` or `.`.

The DNS was moved off Cloudflare in August 2026: LaLiga's anti-piracy IP blocks
were taking Cloudflare-fronted sites offline for Spanish ISPs. The old Cloudflare
Worker (`wrangler.toml`, `index.js`) was removed along with it — if it is still
deployed in the Cloudflare dashboard, it is unreachable and can be deleted there.

## Shared alarm links (`/a`)

Chronos shares an alarm as `https://chronosintelligentalarm.com/a#<payload>`
(the app's `AlarmShareCodec`; spec in the app repo,
`docs/specs/alarm-sharing-deeplink.md`). Two files here make that link work:

- **`docs/.well-known/assetlinks.json`** — Android App Links verification. Without
  it, the `android:autoVerify` intent-filter never verifies and tapping the link
  opens this site in a browser instead of the app.
- **`docs/a/index.html`** — the landing for whoever taps the link without the app
  (or with an unverified install). It decodes the payload **in the browser** and
  shows a preview of the alarm.

**The payload lives in the fragment on purpose.** A `#` fragment is never sent
to the server, so alarm names and configurations never reach GitHub Pages' logs.
That is what lets the privacy policy stay unchanged — never move the payload to
a query string, and never add anything that resolves the link server-side (a
link shortener included).

### `assetlinks.json` — the two fingerprints

The file must list **both** SHA-256 certificate fingerprints:

| Fingerprint | Where to get it | Covers |
| --- | --- | --- |
| Upload key | `android/app/upload-keystore.jks` in the app repo (`keytool -list -v`) | local release builds, sideloaded APKs |
| Play App Signing | Play Console → *App signing* → **App signing key certificate** (the top block, not "Upload key certificate") | every install that came from Play |

Only the upload one is in the file today. **Until the Play App Signing
fingerprint is added, links tapped on an install that came from Play will not
open the app directly** — Android falls back to the app chooser or the browser,
which is degraded but never a dead link.

Verify after deploying, before trusting it:

```
curl -s https://chronosintelligentalarm.com/.well-known/assetlinks.json
adb shell pm verify-app-links --re-verify com.chronos.smartalarm
adb shell pm get-app-links com.chronos.smartalarm      # want: verified
```

`docs/.nojekyll` is what keeps Pages from dropping the `.well-known` directory —
folders starting with a dot are silently skipped without it.

## Contact form (`/contact`)

The page is static like the rest of the site, but its submit handler POSTs to a
**Netlify Function** (`netlify/functions/contact.js`, deployed at
`https://chronos-contact.netlify.app`) because GitHub Pages cannot run server
code. Netlify hosts nothing else: it builds `netlify/functions` from this same
repo on every push to `main`, and `RESEND_API_KEY` lives in its site settings.
So the site has two deploy targets, on two different clocks - a change to the
form's HTML and a change to the function do not go live together.

**The category list exists in three places and MUST stay in sync**: the
`<option value>`s in `docs/contact/index.html`, the query-param allowlist in
that same file's JS, and `CATEGORY_LABELS` in the function. A value the form can
send but the function does not know is rejected as `invalid_category`, and the
page reports only its generic "Something went wrong" - the failure looks like an
outage, not a mismatch. The app links here too (`StoreReviewService`'s
`buildFeedbackFormUrl` sends `category=feedback`), so a fourth copy lives in the
app repo.

Probe the endpoint without sending mail by using a deliberately invalid address:
category is validated before email, so `invalid_email` back means the category
was accepted and `invalid_category` means it was not.

```
curl -s -X POST https://chronos-contact.netlify.app/.netlify/functions/contact   -H 'Content-Type: application/json'   -d '{"category":"feedback","email":"x","message":"probe","ts":1,"lang":"es"}'
```

(`ts` must be at least 2 s in the past - the form's bot time-trap silently
answers `{"ok":true}` to anything faster.)

## Related

The privacy policy lives in the separate
[chronos-legal](https://github.com/luismartin/chronos-legal) repo, served at
https://legal.chronosintelligentalarm.com/. The old
https://luismartin.github.io/chronos-legal/ is the URL declared in Play Console
and now 301-redirects to it, so it must keep resolving — never repurpose that
repo's `index.html` for anything other than the policy.

## Social preview

`og:`/`twitter:` tags in `docs/index.html` MUST use absolute URLs. Relative
paths are not resolved by WhatsApp, X or LinkedIn scrapers and links then get
shared with no thumbnail.
