---
title: Trusted publishing is downstream of workflow trust
description: The Nx and TanStack incident chain is a maintainer reminder that pull_request_target, shared caches, stale branches, and broad workflow permissions are part of the publishing perimeter. OIDC only helps after that boundary is sound.
date: 2026-05-22
slug: 2026-05-22-workflow-trust-boundaries-after-nx
readTime: ~5 min read
---
The useful maintainer lesson from the recent Nx / Shai-Hulud fallout is not “GitHub Actions is scary.”
It is narrower and more actionable than that:

**your workflow trust boundary is part of your release boundary.**

That sounds obvious right up until a repo treats `pull_request_target`, shared caches, stale release branches, and broad job permissions as separate little conveniences instead of one connected attack surface.

Primary sources:
- [TanStack: Postmortem — npm supply-chain compromise](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)
- [GitHub changelog: Actions `pull_request_target` and environment branch protections changes](https://github.blog/changelog/2025-11-07-actions-pull_request_target-and-environment-branch-protections-changes/)
- [GitHub Security Lab: Preventing pwn requests](https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/)

## What matters here
TanStack’s postmortem is useful because it says the quiet part out loud.
The malicious publish did not require an old-school stolen npm token.
Their writeup describes a chain involving `pull_request_target`, cache poisoning across the fork-to-base trust boundary, and runtime extraction of an OIDC token from the runner process.

That is the part maintainers should tattoo onto the workflow review brain:

**trusted publishing does not rescue a workflow that already lets untrusted execution bleed into the release path.**

OIDC is good.
Provenance is good.
But once the workflow identity boundary is already poisoned, those controls can end up signing the wrong thing very professionally.

## Why stale branches matter more than people want to admit
GitHub changed `pull_request_target` behavior in late 2025 partly because older branch-specific workflow behavior created real security footguns.
The important line from the changelog is that outdated workflows on non-default branches had been part of the exploitation story often enough that GitHub changed the model to always source these workflows from the default branch.

That should make maintainers uncomfortable in a productive way.
If old branches and forgotten workflow files can still influence privileged execution, then those branches are not historical clutter.
They are part of the attack surface.

The same goes for:
- old release branches nobody audits anymore
- workflow files that were fixed on `main` but linger elsewhere
- caches shared across trust boundaries
- broad `id-token`, `contents`, or package-publish permissions granted to jobs that do not truly need them

This is why “we use trusted publishing now” is not the end of the conversation.
It is the middle.

## The operational mistake
The common mistake is to draw the boundary too late.
Teams think the sensitive zone begins at the final publish step.
In reality, the sensitive zone begins much earlier:
- where fork PRs can influence execution
- where untrusted inputs can reach shell, build tools, or generated config
- where cache state can cross from low-trust jobs into high-trust jobs
- where branch topology keeps outdated workflow code alive
- where a job can mint identity or touch secrets even if it is “not the release job”

If any of those layers are sloppy, your release path is already softer than the badge says.

## What I would audit this week
If I maintained a public repo with Actions-based release automation, this is the checklist I would actually run:

### 1. Re-audit every `pull_request_target`
Use it only when you truly need elevated context.
If a workflow can be `pull_request`, it should be `pull_request`.
If it must stay `pull_request_target`, treat every use of PR-controlled code, metadata, branch names, titles, paths, caches, and shell interpolation as hostile until proven otherwise.

### 2. Separate untrusted PR work from release-capable jobs
Do not let convenience workflows sit in the same trust pool as release workflows.
Different triggers, different permissions, different cache boundaries, different expectations.
If you cannot explain the separation cleanly, it is probably not clean.

### 3. Prune stale branches and stale workflow files
If a branch is not supposed to participate in privileged workflow execution, stop letting it exist indefinitely.
Archive it elsewhere, delete it, or at minimum audit the workflows it still carries.
Security fixes that only exist on `main` are not real fixes if privileged execution can still route around them.

### 4. Narrow permissions job-by-job
Default the `GITHUB_TOKEN` to read-only.
Only grant `id-token: write`, package publish rights, or broader repo permissions to the exact jobs that require them.
Every extra permission turns a workflow bug into a better exploit kit.

### 5. Revisit cache trust boundaries
If an untrusted job can populate state that a privileged branch later restores, that is not a performance feature.
That is an attack path with a stopwatch attached.
Review cache keys, scope, restore behavior, and whether low-trust and high-trust jobs should share caches at all.

### 6. Re-check your trusted-publisher assumptions
Ask the blunt question:

**if this workflow were influenced before the final publish step, what exactly would still save us?**

If the answer is vague, the setup is not mature yet.

## Maintainer takeaway
The right lesson from the Nx / TanStack-style workflow chain is not to panic about CI.
It is to stop pretending CI review is separate from supply-chain review.

`pull_request_target`, stale branches, shared caches, and broad permissions are not boring plumbing details.
They are part of the publishing perimeter.
And if that perimeter is weak, trusted publishing becomes a very polished way to authenticate the wrong release.
