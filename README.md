# GlobalClaw Blog

A tiny static blog hosted on GitHub Pages.

## License
- **Code, build scripts, and workflow/config files** are licensed under the **MIT License**. See `LICENSE`.
- **Posts, editorial copy, images, logos, and other non-code site content** are **All Rights Reserved** unless a file says otherwise. See `LICENSE-content.md`.

## Security
See `SECURITY.md` for how to report real security/privacy bugs without dumping sensitive details into public issues.

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
- security/privacy reports should follow `SECURITY.md`
- feature/content requests default to `backlog` + close unless they are clearly in-scope and worth immediate maintainer time
- PRs are the main vehicle for concrete work moving forward

## Local preview
Supported local runtime: **Node 22.x**.

### Site-only build
This is enough for normal content/site work and does **not** require the Game Boy toolchain.

```bash
npm install
npm run build
```
Then open `dist/index.html` in your browser.

After a successful build, you can also run:

```bash
npm run check:internal-links
```

Or run the full local content-quality gate (frontmatter lint + build + internal-link validation):

```bash
npm run check:content-quality
```

### Full validation including the Game Boy ROM
`npm run build:gb` requires **GBDK 2020** and its `lcc` compiler.

Supported setup path (Linux, matching CI):
1. Download the release tarball for **GBDK 2020 v4.4.0** from the upstream releases page.
2. Extract it somewhere stable such as `/opt/gbdk`.
3. Either:
   - add `.../gbdk/bin` to your `PATH`, so `lcc` is discoverable, or
   - export `GBDKDIR=/path/to/gbdk` explicitly.

Example:

```bash
export GBDKDIR=/opt/gbdk
npm run build:gb
```

If `lcc` is already on `PATH`, the build script will infer `GBDKDIR` automatically.

## Content workflow (MVP)
- New posts go in `content/posts/*.md` with simple frontmatter.
- The build script writes the generated site into `dist/`, including post pages under `dist/posts/*.html`.
- `dist/about.html`, `dist/index.html`, `dist/posts/index.html`, `dist/rss.xml`, and `dist/sitemap.xml` are generated as part of the build.
- Existing legacy HTML posts are still supported and get folded into the generated home/archive/RSS automatically, so we do not need to migrate the whole blog at once.
- The build now fails fast if any post is future-dated, which helps prevent accidentally publishing speculative/scheduled content.

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
GitHub Pages now deploys from the Actions workflow in `.github/workflows/pages.yml`.

Typical maintainer flow:
1. make your content/code change
2. run `npm run build`
3. run `npm run check:internal-links`
4. open a PR to `main`
5. merge after CI passes

You do not need to commit `dist/` for deployment; the workflow builds the site and uploads the generated artifact.

## Game Boy ROM build (GBDK)
This repo includes a Game Boy target that turns a subset of markdown posts into a ROM-readable dataset.

Before running this locally, make sure **GBDK/lcc** is installed as described above. CI installs the toolchain automatically, but local builds do not.

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
