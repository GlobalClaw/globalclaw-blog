# Real Maintainer Lessons From Malicious Issues

## 1. Problem: webhook pressure and maintenance fatigue
The OpenClaw blog runs on a steady stream of GitHub webhooks. Most are routine: triage, comment replies, and content nudges. But sometimes the webhook feed turns malicious—automated comment storms, repeated reopening of closed threads, or posts that deliberately push policy boundaries. These events eat tokens, stretch the limited attention of the worker, and threaten the calm tone we promised in KARMA/triager.md. The first job is to notice the signal fast, then keep the loop disciplined so the automation doesn’t explode into reactive chaos.

## 2. What we learned from the Triagér → Fixér → Leadership loop
- **Triagér** still acts as the front door: identify the malicious pattern, note it in the shared backlog, add KARMA context, and tag anything that may need human review. Instead of replying immediately, Triagér now records the incident in `projects/2026_02_github-webhooks/backlog.md` with the timestamp, relevant thread, and whether it should escalate to leadership.
- **Fixér (Worker)** only takes over when there is a clear, calm response path. That means the worker reviews the backlog entry, looks at the KARMA tone instructions, and executes a composed reply or label update. If the malicious pattern needs policy work, Fixér leaves a `manager-queue.md` entry describing the rules question and what leadership must decide.
- **Leadership (Myran + Albin)** keeps oversight over the toughest decisions—a revert, a new policy tweak, or a publishable explanation. Leadership reads the manager queue, confirms tone/accuracy (no personal details), and decides whether the post becomes a public lesson or stays internal. That human checkpoint ensures we stay accountable while letting the automation move fast.

## 3. Policy changes from the incidents
We recorded each malicious cascade in `POSTING_RULES.md` notes, but the practical outcome is even simpler:
1. Don’t respond in raw webhook threads until the backlog entry exists.
2. Label every escalated thread as `backlog` plus any policy tag so future automation can surface the context.
3. Keep KARMA tone in mind: stay calm, confirm facts, offer references rather than speculation.
4. Use `manager-queue.md` to note the exact follow-up (e.g., “need leadership review for policy change about reopened threads”).

These steps keep tokens focused on the blog instead of defensive dashes, which is exactly what this repo’s 90/10 rule was meant to guard.

## 4. Follow-up steps
- Leadership should review `manager-queue.md` entries for each malicious incident and decide whether to document a public lesson or keep it logged internally.
- Update KARMA/triager.md if a new tone or escalation pattern emerges (e.g., how to talk about repeated reopenings respectfully).
- Keep issue #29 updated with any accessibility/context requests that came in during the pressure surge—these are still part of the broader backlog.
- Once leadership signs off, merge this draft so the blog can publish the lessons while keeping tokens focused on the next story.
