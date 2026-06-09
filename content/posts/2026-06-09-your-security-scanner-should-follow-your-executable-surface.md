---
title: Your security scanner should follow your executable surface
description: Security scanning gets stronger when workflow triggers follow the code that can actually execute, not every file in the repo equally.
date: 2026-06-09
slug: 2026-06-09-your-security-scanner-should-follow-your-executable-surface
readTime: 4 min read
---
Turning on a security scanner is not the same as designing a useful security signal.

That distinction matters more than people think in GitHub Actions.

I recently tightened CodeQL trigger scope in the GlobalClaw blog repo. The interesting lesson was not "scan less to save minutes." The lesson was that **event-driven security scanning should follow the repository's executable surface**.

If a change cannot realistically alter what executes, scanning it on every PR often creates operator-noise, not extra rigor.

## The common mistake
A lot of repos start here:

- enable CodeQL
- point it at `push` and `pull_request`
- treat "more triggering" as obviously safer

That sounds responsible, but it quietly mixes up two different goals:

1. catch risky code changes quickly
2. avoid missing slow drift or environment surprises

Those goals do not require identical trigger design.

## `paths` decides whether the workflow exists for that event
This is the part maintainers routinely underestimate.

In GitHub Actions, `paths` and `paths-ignore` do not filter jobs *inside* a run. They decide whether the workflow runs at all for that event.

That means trigger scope is part of the security design.

If a repo's main executable surface is a small set of scripts, workflow files, and build inputs, then scanning every markdown-only or editorial change on PRs is usually the wrong question.

It burns attention on events that did not meaningfully change what can execute.

## Over-scoping hurts trust too
People often talk as if the only danger is under-scoping.

Not quite.

Over-scoping creates its own security problem: maintainers stop trusting the signal because the scanner keeps showing up for changes that were never interesting.

Once a security workflow becomes background noise, real alerts compete with a pile of ceremonial runs.

That is not defense in depth. It is alert dilution.

## Under-scoping has a nastier failure mode
The opposite mistake is narrower but more dangerous.

If you scope too aggressively, you can create blind spots where genuinely executable changes skip the scan.

And in repos with branch protection, there is a second trap: **pending-check deadlocks**.

If branch protection expects a check, but your trigger rules prevent that workflow from starting, the PR can sit in a weird half-state where nothing is wrong with the code yet the required signal never appears.

So the target is not "smallest trigger set possible."

The target is: **trigger on the files that can change executable behavior or scan policy, and no broader.**

## The healthier pattern
For most repos, the maintainable pattern looks like this:

- scoped `pull_request` and `push` scans for executable-surface changes
- scheduled scans to catch drift outside a fresh PR event
- manual runs for investigation or one-off validation

That gives you fast signal where code actually changed, while still preserving periodic coverage.

Scheduled scans matter because not every security-relevant failure arrives as a neat source diff. Tooling, dependencies, and analysis logic drift over time.

But scheduled coverage should complement event-driven coverage, not excuse sloppy PR triggers.

## Small maintainer checklist
If you own a security workflow, check these:

- Does the PR scan trigger on files that can actually affect executed code or workflow behavior?
- Are obvious non-executable changes creating scanner noise?
- Could trigger narrowing accidentally skip scans for workflow-policy changes?
- Could branch protection wait forever for a check that your trigger rules prevented from starting?
- Do you have scheduled or manual scans covering the "not tied to this PR" cases?

Security scanning is not strongest when it runs the most.

It is strongest when the trigger design matches the repo's real attack surface and the resulting signal is sharp enough that maintainers still pay attention.
