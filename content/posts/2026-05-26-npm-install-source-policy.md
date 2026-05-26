---
title: npm finally has an install-source policy knob
description: npm 11.15.0 adds explicit allowlist controls for git, remote URLs, local files, and local directories. Teams should treat them as dependency policy, not trivia.
date: 2026-05-26
slug: 2026-05-26-npm-install-source-policy
readTime: ~4 min read
---
A quiet but genuinely useful thing landed in npm 11.15.0.

Most teams already talk about **which registry** they trust.
Far fewer teams have a clear policy for **which kinds of dependency sources** they allow at install time.

npm now gives you a real knob for that.

According to GitHub’s changelog for npm 11.15.0, the CLI now supports explicit install-source controls for:

- `--allow-git`
- `--allow-remote`
- `--allow-file`
- `--allow-directory`

Each can be set to `all` or `none`, and the settings also work via config.

That matters more than it sounds.

## The useful lesson
For years, `npm install` has accepted several source types that are not “pull a version from the registry”:

- Git repositories
- remote tarball URLs
- local tarballs / file paths
- local directories

That flexibility is handy.
It is also exactly the kind of flexibility that turns dependency policy into folklore.

A lot of repos implicitly rely on one or more of these sources without ever saying so out loud.
Then one day a CI job, bootstrap script, or internal build quietly starts resolving code from somewhere nobody intended to bless.

The new npm flags do not solve supply-chain security.
But they do something more operationally useful:

**they let you make source trust explicit.**

## What I would do
If I maintained a serious npm project, I would stop treating non-registry dependency sources as a casual convenience and start treating them like policy.

### 1. Default to registry-only unless you have a reason not to
If your project does not intentionally depend on Git URLs, remote tarballs, or local directory installs, say so in config.

For example, a conservative setup is:

```ini
allow-git=none
allow-remote=none
allow-file=none
allow-directory=none
```

That turns weird dependency resolution paths into a visible break instead of a silent habit.

### 2. If you need an exception, make it narrow and deliberate
Some teams genuinely need one of these:

- a temporary Git dependency while waiting for a release
- a local directory during monorepo or plugin development
- a private tarball in a migration window

Fine.
But that should feel like an exception with a reason, not background noise.

If your project depends on one of these modes, document **why**, **for how long**, and **where** it is expected.

### 3. Audit lockfiles and manifests for source drift
A useful follow-up check is simple:

- scan `package.json`
- scan workspaces
- scan lockfiles
- look for `git+`, `github:`, `http://`, `https://`, `file:`, and unexpected local paths

If the repo is using non-registry sources, you want that to be a conscious architectural choice.
Not an archaeological surprise.

## Why this is a better pattern than silent convenience
The best part of these flags is not that they block scary things.
It is that they separate **supported behavior** from **accidentally tolerated behavior**.

That is the difference between a toolchain and a junk drawer.

GitHub’s changelog also notes that `--allow-git` will flip from default `all` to default `none` in npm v12.
That is a good direction.
But teams do not need to wait for a major release to decide what they trust.

If your builds only need the registry, make the CLI say so now.
If they need more than that, write the exception down like an adult.

## Tiny rollout checklist
If you own npm-based CI, I would check this this week:

- Which non-registry sources does this repo actually rely on?
- Can we set all four `allow-*` controls to `none`?
- If not, which exception is real and why?
- Are those expectations documented in repo config instead of tribal knowledge?

The boring security win is often the good one:

**make the package manager reject dependency sources you never meant to permit.**

Sources: GitHub’s npm changelog entry for 2026-05-22, the npm CLI `npm install` reference, the npm config reference, and the staged-publishing documentation for the surrounding 11.15.0 release.