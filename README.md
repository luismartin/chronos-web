# Chronos — Website

Public landing page for the Chronos Android app, in the same 34 languages the
app itself supports (a single `<select>` language switcher, matching
`lib/l10n/supported_languages.dart` in the app repo — never hardcode a count
here).

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

## The landing page: `docs/index.html` is the source of truth

`docs/index.html` is edited **by hand** and is the only source of the landing
page. Every piece of text is repeated once per language as
`<span data-key="…" data-l="xx">…</span>`, and CSS shows only the spans whose
`data-l` matches `html[data-lang]`. A change to the copy is a change in all 34
languages.

`design/` is a **historical** design canvas, in English and Spanish only. It
used to be the source: `design/build-index.py` regenerated `docs/index.html`
from `design/Main.dc.html`. Since c9db544 and 99b0471 translated the page
directly, running that script would wipe 32 languages off the public site with
no warning (it nearly happened on 2026-09-24), so **it now refuses to run**. Its
code is kept for its SEO head, its `PLAY_LIVE` switch and the canvas conversion,
in case the canvas is ever rebuilt in all 34 languages; only then should the
guard at its top be removed. See `design/README.md`.

## Launch day: turning on the Google Play buttons

While the app is in closed testing its public Play listing returns 404, so the
page links nowhere: the six download buttons are inert pills saying "Coming soon
to Google Play". This used to be the `PLAY_LIVE` switch in
`design/build-index.py`; now it has to be done in `docs/index.html` itself.
Do it the day the app reaches production (planned around 2026-09-28) — **check
first that the listing loads**, logged out:
https://play.google.com/store/apps/details?id=com.chronos.smartalarm

**What to look for.** Each button is a single line of this shape (header, hero,
shared-alarm demo, Free plan, Premium plan, final CTA):

```html
<span class="btn btn-soon[ btn-sm]"[ style="margin-top: auto;"]><span class="pulse" aria-hidden="true"></span><span data-key="cta.soon" data-l="en">Coming soon to Google Play</span> … 34 languages … <span data-key="cta.soon" data-l="bn">…</span></span>
```

`grep -c 'class="btn btn-soon' docs/index.html` must print `6` (the other two
`btn-soon` hits are the CSS rules, which can stay).

**What to replace it with.** Per button:

1. `<span class="btn btn-soon` → `<a class="btn btn-primary` plus
   `href="https://play.google.com/store/apps/details?id=com.chronos.smartalarm"`,
   keeping any ` btn-sm` and `style="…"` it had;
2. drop the `<span class="pulse" aria-hidden="true"></span>`;
3. replace each of the 34 "coming soon" texts with a live label (key renamed to
   `cta.play`), and the final `</span>` that closes the button with `</a>`.

The labels below are the app's own `rating_positive_cta` ("Go to Google Play"),
already translated and reviewed in all 34 languages in
`lib/l10n/app_strings.dart` in the app repo, so the change needs no new
translation. This does all of it, refuses to write anything unless it finds
exactly six buttons, and keeps the file's line endings (tested on a copy of the
page on 2026-09-24: only the six button lines change). Run it from the repo root:

```python
import html, pathlib, re

URL = 'https://play.google.com/store/apps/details?id=com.chronos.smartalarm'
LABELS = {  # rating_positive_cta de lib/l10n/app_strings.dart (repo de la app)
    'en': 'Go to Google Play', 'es': 'Ir a Google Play', 'fr': 'Aller sur Google Play',
    'de': 'Zu Google Play', 'pt': 'Ir para a Google Play', 'it': 'Vai su Google Play',
    'zh': '前往 Google Play', 'ja': 'Google Playを開く', 'ko': 'Google Play로 이동',
    'nl': 'Ga naar Google Play', 'id': 'Buka Google Play', 'el': 'Μετάβαση στο Google Play',
    'fil': 'Pumunta sa Google Play', 'sv': 'Gå till Google Play', 'da': 'Gå til Google Play',
    'nb': 'Gå til Google Play', 'fi': 'Siirry Google Playhin', 'pl': 'Przejdź do Google Play',
    'cs': 'Přejít na Google Play', 'hu': 'Ugrás a Google Playre', 'tr': "Google Play'e git",
    'ru': 'Перейти в Google Play', 'uk': 'Перейти до Google Play', 'hi': 'Google Play पर जाओ',
    'th': 'ไปที่ Google Play', 'ar': 'انتقل إلى Google Play', 'fa': 'برو به Google Play',
    'ur': 'Google Play پر جائیں', 'ca': 'Ves a Google Play', 'ms': 'Pergi ke Google Play',
    'ro': 'Mergi la Google Play', 'vi': 'Tới Google Play', 'he': 'מעבר ל-Google Play',
    'bn': 'Google Play তে যান',
}

page = pathlib.Path('docs/index.html')
s = page.read_bytes().decode('utf-8')  # bytes: sin traducir finales de línea en Windows
BTN = re.compile(r'<span class="btn btn-soon([^"]*)"([^>]*)><span class="pulse" aria-hidden="true"></span>'
                 r'((?:<span data-key="cta\.soon" data-l="[^"]+">[^<]*</span>)+)</span>')
def live(m):
    labels = re.sub(r'data-key="cta\.soon" data-l="([^"]+)">[^<]*<',
                    lambda t: 'data-key="cta.play" data-l="%s">%s<' % (t.group(1), html.escape(LABELS[t.group(1)], quote=False)),
                    m.group(3))
    return '<a class="btn btn-primary%s" href="%s"%s>%s</a>' % (m.group(1), URL, m.group(2), labels)
s, n = BTN.subn(live, s)
assert n == 6, 'esperaba 6 botones, cambie %d: no escribo nada' % n
assert 'cta.soon' not in s and s.count('data-key="cta.play"') == 6 * 34
page.write_bytes(s.encode('utf-8'))
print('6 botones enlazados a', URL)
```

Then check before pushing: `git diff --stat` shows `docs/index.html` with
6 lines changed, `grep -c 'play.google.com/store/apps/details?id=com.chronos.smartalarm' docs/index.html`
prints `6` (all on separate lines), and the page opened locally shows six
clickable buttons in a couple of languages (include one RTL: `ar` or `he`).
After the push, the same `grep` over `curl -s https://chronosintelligentalarm.com/`
must find the six links (allow ~40 s plus the 10-min cache).

**The shared-alarm landing has its own switch, flip it the same day.**
`docs/a/index.html` (see below) says "Coming soon to Google Play" too, but it
builds its buttons in JS: change `var STORE_LIVE = false;` to `true` there. Its
"Get Chronos on Google Play" label (`get`) is already translated in all 34
languages, so that one-word change is all it needs.

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

`npm test` runs a contract test (`test/contact-contract.js`, plain node, no
framework, no install needed) over both files: it fails if the category lists
drift apart again, if an error code the function can return has no message on
the page, or if an email address reappears in the page.

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
