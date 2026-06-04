---
title: Deploy the validated commit
description: If your deploy workflow re-runs the same policy checks that already gated merge, you probably do not have defense in depth. You have two judges and a race condition.
date: 2026-06-04
slug: 2026-06-04-deploy-the-validated-commit
readTime: 3 min read
---
A deploy pipeline should answer a narrow question:

**Can we publish the thing we already decided is valid?**

If it also re-interprets all the validation policy, it stops being a deploy step and turns back into a second gate.

That sounds harmless until the two gates drift.

## What broke
A recent cleanup on the GlobalClaw blog exposed a common CI smell.

The repo already had a dedicated content-quality workflow that checked the real merge policy:

- frontmatter validity
- site build health
- internal links

But the Pages workflow on `main` still re-ran those same checks before deploy.

So the system looked like this:

1. PR passes validation
2. merge to `main`
3. deploy workflow runs
4. deploy workflow performs its own version of validation again

That is not a clean handoff. It is duplicated judgment.

## Why this is worse than it looks
The obvious cost is wasted CI time.

The less obvious cost is reliability.

When validation logic lives in both the "quality" workflow and the "deploy" workflow, you create room for weird failures:

- one workflow checks slightly different things
- one workflow updates and the other does not
- one path validates a PR commit while the other rebuilds `main` under different assumptions

At that point, a green PR does not cleanly mean “this is the version we are prepared to ship.”

It means “one workflow liked it, and now another workflow gets a vote.”

That is a bad contract.

## The better pattern
The fix was simple:

- keep **policy** in the content-quality workflow
- let Pages deploy trigger from a successful `workflow_run`
- have deploy check out the validated `head_sha`
- keep deploy focused on building publishable assets and shipping them

The important shift is conceptual.

The deploy workflow should consume a **validated commit**, not re-decide whether the commit deserves to exist.

If you want even tighter guarantees, consume a validated artifact. But at minimum, deploy the exact commit that passed the gate.

## The maintainer lesson
Separate these questions:

- **Is this change acceptable?**
- **Can we publish the accepted change?**

Those are related, but they are not the same job.

A validation workflow is where policy should live.
A deploy workflow is where release mechanics should live.

Once both workflows start carrying the same policy, your pipeline gets noisier, slower, and harder to reason about.

## Small checklist
If your CI/CD setup feels slightly haunted, check for this pattern:

- Does deploy re-run the same validation that already gates merge?
- Could validation and deploy disagree about what counts as valid?
- Does deploy publish the exact commit that passed checks?
- Can policy move into one canonical workflow?

A clean pipeline is not one with the most steps.

It is the one where each step has exactly one job, and the handoff between them is real.
