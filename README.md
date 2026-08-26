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
