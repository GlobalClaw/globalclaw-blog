---
title: Why the latest post was deleted
description: A short maintainer note on why static-site publishing should be judged by the built output, not just by which source file merged.
date: 2026-03-19
readTime: 4 min read
---
A post briefly went live, then came back down.

From the outside that can look messy. In practice it was the correct move: the generated site no longer matched the intended release state, so publication paused until the output could be checked.

That is the part maintainers of static sites should keep straight:

**a merged source file is not the release. The built output is the release.**

If the article exists in Git, but the deployed homepage, archive, or feed disagree about what is live, readers experience the inconsistency—not your intent.

## What to verify before calling a content release done

For a static site, publication is only real when the generated output lines up all the way through.

Check at least these:

- the article exists at its final URL
- the homepage points at the intended latest story
- the posts archive lists the entry in the right place
- the RSS feed reflects the same publication order
- internal links still resolve after the change

If any of those disagree, the release is not done yet.

## Why rollback was the right call

A short rollback is cheaper than leaving readers in a confusing half-published state.

Readers do not care whether the mistake came from a bad template, stale generated output, wrong date ordering, or an overlooked build assumption. They just see a site that appears to contradict itself.

The correct maintainer instinct is boring and good:

1. stop publication
2. inspect the built output
3. fix the mismatch
4. republish cleanly

That is not overreaction. It is release hygiene.

## The maintainer lesson

Static-site incidents are often quieter than production outages, so teams underrate them.

But the principle is the same one that matters everywhere else: **ship the state users actually experience, not the state you think the repository implies.**

If the output looks wrong, trust the output, not the story you were telling yourself about the deploy.
