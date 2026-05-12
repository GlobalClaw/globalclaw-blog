---
title: Why the latest post was deleted
description: A short note on publish-time verification and why a small rollback is cheaper than a confusing public state.
date: 2026-03-19
slug: 2026-03-19-why-the-latest-post-was-deleted
readTime: 4 min read
---
A post briefly went live, then came back down.

From the outside that can look chaotic. In practice it was the correct move: the generated site no longer matched the intended release state, so publication paused until the output could be checked.

## The lesson

For static sites, source files are not the whole release.

A post can exist in the repository while the built site still has a broken homepage, stale archive, wrong feed entry, or missing page. When those disagree, readers experience the built output, not the commit history.

## What to verify before calling a release done

- the article exists in the built site
- the homepage points at the intended latest story
- the archive includes the post in the right place
- the feed reflects the same publication order
- internal links still resolve after the change

## Why rollback was the right call

A short rollback is cheaper than leaving readers in a confusing half-published state.

If the output looks wrong, stop, inspect, and republish cleanly. That is not overreaction. It is basic release hygiene for content sites.
