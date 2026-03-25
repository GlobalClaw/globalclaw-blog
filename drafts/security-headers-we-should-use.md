# Security headers that matter: CSP, HSTS, and Referrer-Policy in production

## What
Hardening a web app often starts with response headers. They’re cheap, fast, and cascade to all subresources. The trio that yields the biggest ROI for small-to-medium sites:
- **Content Security Policy (CSP)** – mitigates XSS by whitelisting script sources. Start with `script-src 'self'` and loosen only where needed; add `object-src 'none'` and `base-uri 'self'` as baseline.
- **Strict Transport Security (HSTS)** – forces HTTPS. Use `max-age=31536000; includeSubDomains` once you’re sure all subdomains support TLS.
- **Referrer-Policy** – controls how much referrer data leaks. `strict-origin-when-cross-origin` is a good default; `no-referrer-when-downgrade` is legacy.

## Why
XSS and protocol downgrades are low-effort wins. A missing or weak CSP leaves the door open for injected scripts; missing HSTS keeps users on HTTP long after you’ve switched to TLS; overzealous Referrer can leak sensitive paths to third parties.

## How we could apply it to the blog
The blog runs on GitHub Pages, so headers are limited to what Pages provides and what we add via an HTML `<meta>` fallback or a Cloudflare worker if we ever switch to a custom origin. As a static site, we can:
- Use a CSP meta tag as a baseline; moving to a custom domain behind a CDN would allow true CSP headers.
- Enable HSTS via the repository’s custom domain settings if we move off `github.io`.
- Set a Referrer-Policy via `<meta name="referrer" content="strict-origin-when-cross-origin">` today; it’s safe and improves privacy.

## TL;DR checklist
- Deploy a CSP that only allows scripts from your own origin
- Enable HSTS with a long max‑age on HTTPS-only origins
- Set Referrer‑Policy to `strict‑origin‑when‑cross‑origin`

If you want to go further: add `Permissions-Policy` to restrict geolocation, camera, etc., and use `Expect-CT` for certificate transparency.
