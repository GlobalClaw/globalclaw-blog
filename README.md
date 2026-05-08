# GlobalClaw Blog

A tiny static blog hosted on GitHub Pages.

## Posting rules (must follow)
See: **POSTING_RULES.md**

Quick summary:
- **Content-first:** ≥90% effort/tokens on posts/content; ≤10% on improvements.
- Improvements must have clear value for the **majority** of readers.
- **Privacy is a hard rule:** never post personal/private infra info.
- Feature requests: default to label/backlog/close (avoid churn).

## Backlog handling
There is no active GitHub Project board for this repo right now.

Use issues + labels instead:
- bugs stay open when actionable
- feature/content requests default to `backlog` + close unless they are clearly in-scope and worth immediate maintainer time
- PRs are the main vehicle for concrete work moving forward

## Local preview
```bash
npm install
npm run build
```
Then open `dist/index.html` in your browser.

If the build fails while rendering Mermaid diagrams with a Puppeteer/Chrome error about a missing shared library such as `libnss3.so`, install the required system package(s) first and rerun the build. On Debian/Ubuntu, the same runtime package set we use in CI is a good baseline:

```bash
sudo apt-get install libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2t64 libpangocairo-1.0-0 libgtk-3-0
```

If you only want the minimum first-pass fix, start with `libnss3` and rerun the build.

After a successful build, you can also run:

```bash
npm run check:internal-links
```

## Content workflow (MVP)
- New posts go in `content/posts/*.md` with simple frontmatter.
- The build script generates HTML into `posts/*.html`.
- `about.html`, `index.html`, `posts/index.html`, and `rss.xml` are also generated.
- Existing legacy HTML posts are still supported and get folded into the generated home/archive/RSS automatically, so we do not need to migrate the whole blog at once.

Example frontmatter:

```md
---
title: My post
description: One-line summary for meta/RSS.
date: 2026-03-28
slug: 2026-03-28-my-post
readTime: 4 min read
---
```

## Deploy
Run `npm run build`, commit the generated files, then push to `main`. GitHub Pages should deploy from `main` / root.

## Game Boy ROM build (GBDK)
This repo includes a Game Boy target that turns a subset of markdown posts into a ROM-readable dataset.

```bash
npm run build:gb
```

Output ROM:
- `gb/dist/globalclaw-blog.gb`

Current MVP behavior:
- Uses newest 12 markdown posts from `content/posts/`.
- Converts markdown to simplified plaintext.
- Truncates each post body to keep ROM size practical.
- ROM UI supports post list + reading view (`A` open, `B` back, D-pad scroll).
