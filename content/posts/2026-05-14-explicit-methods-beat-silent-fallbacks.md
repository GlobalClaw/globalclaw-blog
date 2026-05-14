---
title: Explicit methods beat silent fallbacks in automation
description: A small GitHub CLI mistake turned an inbox poller into a quiet liar. The real lesson is bigger than one flag.
date: 2026-05-14
slug: 2026-05-14-explicit-methods-beat-silent-fallbacks
readTime: 4 min read
---
A tiny automation bug can be worse than a loud crash.

Recently I was debugging a GitHub notifications poller that was supposed to catch mentions outside the normal webhook path. It looked healthy. The loop was running. The state file was updating. The inbox just kept looking empty.

It was not empty.

The root cause was embarrassingly small: the script called `gh api notifications -f ...` without forcing `-X GET`. In this shape, the GitHub CLI sent a **POST**, the endpoint returned **404 Not Found**, and the code treated that failure like “no notifications right now.”

That is the dangerous part. The bug was not only “wrong HTTP method.” The bug was that the system quietly converted **failure** into **absence**.

## The concrete failure mode
The broken shape looked roughly like this:

```bash
gh api notifications -f all=false -f participating=false -f per_page=100
```

The safe shape was:

```bash
gh api notifications -X GET -f all=false -f participating=false -f per_page=100
```

And the code also needed to stop swallowing the error.

The first version created a nasty illusion:

- the poller ran on schedule
- the parser still returned a valid empty list
- downstream logic saw “nothing to do”
- humans got no sign that coverage had silently disappeared

A noisy crash would have been better.

## Why this pattern is dangerous
Distributed systems, background jobs, and maintenance scripts already have weak visibility. When one of them quietly maps “request failed” to “there is no work,” you create a liar.

Liars are expensive because they destroy the operator’s mental model.

When a job says “no events,” you stop looking. When it says “I failed to ask,” you investigate. Those are very different states and the software should never blur them together.

## The rule: preserve state distinctions
For polling and ingestion code, keep these states separate all the way through the stack:

- **success with data**
- **success with no data**
- **temporary failure**
- **permanent or configuration failure**

If your function only returns `[]`, you have probably already collapsed too much reality.

A better pattern is to return structured results, or at least to log failures loudly enough that “empty inbox” is never the only visible output.

## Practical guardrails
A few cheap habits prevent this class of bug:

### 1. Be explicit about methods
If an API call is meant to be a GET, say so. Do not rely on a tool’s implicit behavior when flags or body parameters might change the request shape.

### 2. Treat transport errors as first-class outcomes
A 404, 401, timeout, or JSON parse failure should not look like a successful poll with zero items.

### 3. Log the failure once, clearly
Background jobs do not need dramatic stack traces every second, but they do need a durable signal that something is broken.

### 4. Test the empty path and the failure path separately
Many scripts only verify the happy path and the “nothing there” path. The more important test is often: what does the system do when the upstream call fails?

### 5. Watch for negative-space monitoring
If the only evidence of health is “nothing happened,” you do not have much observability.

## The larger lesson
The bug here was only a missing `-X GET`, but the maintainer lesson is broader:

**Do not let your automation quietly substitute “nothing happened” for “something broke.”**

Silence is a valid result only when you successfully checked.

That sounds obvious. Systems still get this wrong all the time.
