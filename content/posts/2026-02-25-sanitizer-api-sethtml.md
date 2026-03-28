---
title: Goodbye innerHTML: Firefox ships the Sanitizer API (setHTML)
description: Firefox 148 ships the standardized Sanitizer API. Here’s how setHTML() changes the default safety story for user-generated HTML, and how to adopt it without breaking your app.
date: 2026-02-25
slug: 2026-02-25-sanitizer-api-sethtml
readTime: ~10 min read
---
Cross-site scripting (XSS) is still one of the most common ways web apps get owned: take a user-controlled string,
  let it become executable HTML/JS, and suddenly the attacker is running code *as your site*.

Firefox **148** is the first browser to ship a standardized fix that’s surprisingly approachable:
  the [Sanitizer API](https://wicg.github.io/sanitizer-api/).
  The headline is a new DOM method, [`Element.setHTML()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML),
  that **sanitizes by default**.

Primary sources:
  [Mozilla’s announcement](https://hacks.mozilla.org/2026/02/goodbye-innerhtml-hello-sethtml-stronger-xss-protection-in-firefox-148/)
  and the [spec draft](https://wicg.github.io/sanitizer-api/).

## The problem: innerHTML is a foot-gun with a friendly face

`innerHTML` is convenient: you take a string and render it. The problem is that parsing HTML is
  **also parsing executable things** (event handlers, URLs with weird schemes, SVG edge cases, etc.).
  One missed escape and you’ve created an exploit.

In practice, teams try to solve this with a combination of:

- “We’ll just escape user input” (until you forget once).
- Sanitization libraries (good, but easy to misconfigure or bypass if used inconsistently).
- Content Security Policy (CSP) (great, but often a bigger architectural project than people expect).

## What setHTML() gives you: safe defaults at the call site

With `setHTML()`, the sanitization is part of the API surface: you’re no longer writing
  “parse this dangerous string as HTML”, you’re writing “parse this string as HTML *safely*.”

The Mozilla post uses an example like this:

`document.body.setHTML(`
  <h1>Hello my name is <img src="x" onclick="alert('XSS')">
`);`

The point isn’t the exact output (sanitization policy matters); it’s the default posture:
  **remove or neutralize risky parts** rather than hoping every caller remembered every rule.

## But I actually want to allow some HTML…

Most “user-generated content” isn’t raw HTML. It’s a subset: paragraphs, links, maybe `<code>`,
  maybe lists. The Sanitizer API is built for that reality.

If the default policy is too strict (or not strict enough), `setHTML()` can take options that control
  which elements/attributes are allowed.
  (See [MDN: setHTML options](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML#options).)

There’s also a good playground to get intuition without shipping anything:
  [sanitizer-api.dev](https://sanitizer-api.dev/).

## A realistic adoption plan (that won’t explode your app)

Right now, only Firefox ships this. That’s fine: you can still adopt it progressively.
  The key is to treat it like a **capability** you detect, not a new baseline you assume.

1) Wrap HTML injection behind one function

If you take one thing from this post: stop sprinkling HTML insertion across your codebase.
  Create a tiny module and funnel it all through one place.

`export function safeSetHtml(el, html) {
  if (typeof el.setHTML === 'function') {
    el.setHTML(html);
    return;
  }

  // Fallback for other browsers for now:
  // - Prefer a well-reviewed sanitizer (e.g. DOMPurify)
  // - Or avoid HTML injection entirely
  el.innerHTML = html; // replace with sanitizer in real code
}`

Yes: that fallback line is dangerous as-written. That’s intentional: it forces you to decide
  what your actual fallback policy is (sanitizer library, markdown renderer, “no HTML allowed”, etc.).

2) Start with the highest-risk surfaces

- Comments, user profiles, “bio” fields
- Admin UIs that render user-controlled strings (yes, admins get phished too)
- Error messages / logs that accidentally include user input

3) Add tests that try to break your sanitizer

Sanitization is security logic. Security logic needs tests.
  Have fixtures that include:

- Inline event handlers (`onclick`, etc.)
- `javascript:` URLs
- SVG and MathML payloads (if your app ever allows them)

## Even better with Trusted Types (defense in depth)

The Mozilla post also calls out a strong pairing: Sanitizer API +
  [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API).

Trusted Types let you say: “Only these blessed code paths are allowed to inject HTML.”
  In a mature codebase, this is a huge win: you stop arguing with every PR reviewer about whether
  a new `innerHTML` is safe — it just fails.

The Sanitizer API helps because it can become the sanctioned mechanism for HTML insertion,
  which makes Trusted Types enforcement much less painful.

## How I’d use this at work (checklist)

  
    **Inventory** your `innerHTML`/`insertAdjacentHTML` usage (grep is fine).
  
  
    **Centralize** HTML injection behind a single helper.
  
  
    In that helper: **use `setHTML()` when available**, otherwise use a sanitizer library or disallow HTML.
  
  
    **Add payload tests** that try to sneak through common XSS vectors.
  
  
    When you’re ready: consider **Trusted Types** + a CSP that blocks inline scripts.
  

## Links

- [Mozilla: Goodbye innerHTML, Hello setHTML](https://hacks.mozilla.org/2026/02/goodbye-innerhtml-hello-sethtml-stronger-xss-protection-in-firefox-148/)
- [Sanitizer API spec draft](https://wicg.github.io/sanitizer-api/)
- [MDN: Element.setHTML()](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML)
- [MDN: Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)
- [Sanitizer API playground](https://sanitizer-api.dev/)
