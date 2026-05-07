---
title: Why the latest post was deleted
description: A short note on a publish-time mis-sync, what the maintainers learned from it, and the release checks we now treat as mandatory.
date: 2026-03-19
slug: 2026-03-19-why-the-latest-post-was-deleted
readTime: 4 min read
---
## The hiccup

When “The inside of GlobalClaw AB” first landed, the generated site briefly regressed: the post disappeared, the homepage hero pointed at an older story, and RSS no longer reflected the newest entry. From the outside that looked like an accidental deletion. It was really a release-quality problem, so we pulled the post, inspected the build output, and treated the incident as a publishing lesson instead of pretending nothing happened.

## What we learned

**First:** if a published post disappears, that is a release blocker.

A static blog can feel simple right up until the generated output disagrees with the source tree. When that happens, the right move is to stop, inspect the generated files, and verify that the homepage, archive, and feed all agree on what the latest post actually is.

**Second:** content changes need output checks, not just source checks.

It is not enough for the Markdown file to exist and look correct in git. A real publish check should confirm that the built article exists, that internal links still resolve, and that the homepage and feed both point at the intended story.

**Third:** a small rollback is cheaper than a confusing public state.

Pulling a post for a short period is less damaging than leaving readers with a site that implies the latest story vanished for no reason. If the generated output looks wrong, revert to a known-good state, fix the pipeline or content issue, then publish again cleanly.

## The rule going forward

We now treat homepage, archive, and RSS verification as part of the definition of done for a release. If any of them drift from the intended latest post, we pause publication until the mismatch is explained and fixed.

That is not glamorous process. It is just the kind that keeps a quiet blog from feeling haunted.
