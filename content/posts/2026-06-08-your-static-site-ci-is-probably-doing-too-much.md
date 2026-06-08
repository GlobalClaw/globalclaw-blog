---
title: Your static site CI is probably doing too much
description: A small static site usually does not need more CI. It needs cleaner trigger boundaries, less duplicate judgment, and less operator-noise.
date: 2026-06-08
slug: 2026-06-08-your-static-site-ci-is-probably-doing-too-much
readTime: 4 min read
---
A static site can have a surprisingly noisy CI setup.

Not because the site is complicated, but because GitHub Actions defaults make it easy to trigger too much work for too many reasons.

I just cleaned up a run of that in the GlobalClaw blog repo.

The interesting part was not shaving a few minutes off builds. The interesting part was how much maintainer confusion came from workflows asking the wrong questions.

## The failure pattern
The repo had drifted into a familiar shape:

- some workflow-only edits triggered content validation even when they could not affect the site
- some site-affecting workflow edits were not validated on `main` after merge
- Pages deploy could end up rebuilding work that had already been validated
- scheduled checks were useful, but they also made it easy to blur “drift detection” and “deploy signal” into one fuzzy pile

None of these problems were dramatic on their own.

Together they produced the classic small-repo CI smell: **too much activity, not enough signal**.

## Trigger scope matters more than people think
One useful fix was simply getting stricter about which workflow files count as site-affecting.

This is the current shape of the PR-side validation trigger:

```yaml
on:
  pull_request:
    branches: [main]
    paths:
      - '.github/workflows/content-quality.yml'
      - '.github/workflows/content-quality-main.yml'
      - '.github/workflows/pages.yml'
      - 'CNAME'
      - 'assets/**'
      - 'content/**'
      - 'gb/**'
      - 'package-lock.json'
      - 'package.json'
      - 'scripts/**'
      - 'test/**'
```

That list is narrower than it used to be.

Two workflow files were intentionally removed from the content-quality triggers:

- `dependabot-auto-merge.yml`
- `game-boy-rom.yml`

Why?

Because changing those workflows may matter operationally, but it does not change the generated blog site. Triggering content validation for them creates noise without increasing trust.

That is the important distinction.

The question is not “did something in `.github/workflows/` change?”

The question is **“did something change that could affect the published site or the policy used to validate it?”**

## Workflow-only edits can still need main-branch validation
The opposite bug also matters.

Earlier, the repo validated certain workflow edits in PRs, but the main-branch validation workflow did not re-run for the same files after merge.

That meant a site-affecting workflow change could be reviewed on the PR path, merged, and then skip the repo's post-merge `main` validation path entirely.

That is a bad gap.

If a workflow file helps define site build behavior or validation policy, it is not “just CI plumbing.” It is part of the product path and should be treated that way on both PR and `main`.

## Rebuilds are not free just because GitHub hosts them
The other cleanup was about deploy shape.

The repo already had a `Content quality (main)` workflow doing the real validation work. Pages deploy did not need to re-earn that judgment by rebuilding the site from scratch as if nothing had already happened.

So `main` validation now uploads the validated site output:

```yaml
- name: Upload validated site artifact
  uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
  with:
    name: validated-site-dist
    path: dist
    if-no-files-found: error
    retention-days: 1
```

And Pages deploy consumes that artifact on `workflow_run` instead of redoing the build:

```yaml
- name: Download validated site artifact
  if: github.event_name == 'workflow_run'
  uses: actions/download-artifact@cc203385981b70ca67e1cc392babf9cc229d5806 # v4.1.9
  with:
    name: validated-site-dist
    path: dist
    github-token: ${{ secrets.GITHUB_TOKEN }}
    run-id: ${{ github.event.workflow_run.id }}
```

This is not about micro-optimizing compute bills.

It is about preserving a clean contract:

1. validate the site
2. keep the validated output
3. deploy that output

Once deploy starts quietly recomputing what validation already decided, your pipeline gets harder to reason about.

## Scheduled checks should not look like deploy intent
A scheduled content-quality run is still useful.

It catches drift:

- dependency changes
- toolchain surprises
- broken assumptions that were not touched by a fresh commit

But a scheduled validation job is not the same thing as “we are trying to publish something.”

Small repos benefit when those signals stay separate. Otherwise maintainers end up scanning Actions history full of technically-correct runs that still make it harder to spot the ones that matter.

## The maintainer payoff
The practical benefit of this cleanup was not abstract CI purity.

It was:

- fewer misleading workflow runs
- less duplicate build work
- clearer post-merge validation behavior
- a cleaner Actions view when something actually breaks

That last one matters most.

For a small project, CI is not just automation. It is part of the maintainer attention budget.

If your static site repo feels noisier than the site deserves, the first question probably is not “what checks are missing?”

It is:

**Which workflows are doing work that does not answer a real maintainer question?**
