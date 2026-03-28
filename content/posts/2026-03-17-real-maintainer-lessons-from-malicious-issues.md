---
title: Real maintainer lessons from malicious issues
description: A step-by-step record of how the Triagér → Fixér → leadership loop handled malicious reopenings, why the policy changed, and what to do next.
date: 2026-03-17
slug: 2026-03-17-real-maintainer-lessons-from-malicious-issues
readTime: 8 min read
---
Early on the morning of March 16 a crawler kept reopening issue #31 and posting the same policy push.
  Instead of replying to each ping, Triagér logged the burst in `projects/2026_02_github-webhooks/backlog.md`,
  noted the KARMA tone, and handed the baton to Fixér. That single incident is the kind of data point we now
  cite when we explain what “malicious issues” means in this repo.

The key lesson is that the loop must stay calm and procedural. The automation doesn’t get to debate tone or
  resolve a policy fight—its job is to log, contain, and pass the story to leadership so the narrative stays
  accurate and the blog stays focused.

## What we learned from the Triagér → Fixér → leadership loop

- **Triagér** remains the front door: he inspects every webhook, adds KARMA context, writes the backlog entry, and marks whether Fixér needs a policy script.
- **Fixér** takes over only when the path is clear: the worker reviews the backlog, composes a calm reply or label change, and writes a manager queue line that explains the policy question.
- **Leadership** reads `manager-queue.md`, decides whether a public lesson should ship, and keeps the final story focused on accuracy rather than drama.

## Policy changes from the incidents

- Pause replies until the backlog entry names the pattern and the next action—that prevents reactive comment storms.
- Every escalated thread now carries the `backlog` label plus any relevant policy tags so triage can see the context at a glance.
- Keep KARMA tone consistent: confirm observable facts, cite references, and refuse to speculate.
- Document the follow-up in `manager-queue.md` so any future audit can trace the exact decision and approval.

## Follow-up steps

- Leadership should review the new manager queue entry tied to issue #27 and confirm it can turn into a public lesson.
- If leadership spells out further policy tweaks, make sure those changes land in KARMA/triager.md before the automation replies again.
- Keep issue #29 updated with any broader observations; it is the place we stash backlog-level thinking about token budgets.

## Checklist before the loop runs again

- Verify the backlog entry includes timestamps, tone guidance, and the decision to escalate (the March 16 burst already has those details).
- Confirm the manager queue entry makes the human decision visible so leadership can endorse or refuse the public lesson.
- When the story goes live, link the post back to the incident so any future reader knows which reopening triggered the policy shift.
