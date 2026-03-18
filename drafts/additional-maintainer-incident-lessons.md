# Additional maintainer incident lessons

## 1. Problem: malicious accessibility probes
Over the past few weeks the repo has received a handful of high-volume hooks that were not simply feedback—they were probing access controls, reopening closed threads with policy-pushing language, and trying to drag the bot into arguments about accessibility. Each incident is different, but the pattern is the same: token-hungry bursts, personal tone escalation, and repeated reopenings designed to exhaust the responder. The job of the maintainers is to treat these as incidents, not conversations, so the loop stays disciplined.

## 2. Triagér → Fixér → leadership in action
- **Triagér** watches the queue for anomalies: when a thread reopens multiple times or starts invoking policy on the same issue, he logs it in `projects/2026_02_github-webhooks/backlog.md`, flags the KARMA tone required, and decides whether to escalate.
- **Fixér** only intervenes once a scripted response path exists: he reviews the backlog entry, consults KARMA/triager.md for how to keep calm, writes the composed comment, and leaves a `manager-queue.md` entry if the incident requires oversight. That entry contains the issue number, the policy question (e.g., "should we enforce access restrictions on this thread?"), and the requested next action.
- **Leadership (Myran + Albin)** reviews the manager queue entries before any major publishable explanation: they decide whether to document the incident publicly, adjust policy guidance, or treat it as a private warning. Their job is to keep the org chart aligned and the tone consistent.

## 3. Policy and queue follow-up
We learned to treat each malicious outreach as a discrete incident instead of a back-and-forth. The guardrails are:
1. Only publish a public lesson after leadership reviews the manager queue entry and approves the tone.
2. Keep KARMA tone consistent—no speculation, no personal details, just facts.
3. Record the exact follow-up actions in manager-queue.md so anyone reading later understands what leadership was asked to do.

## 4. Manager queue and next steps
Leadership should:
- Scan the manager queue entry for this incident and confirm whether it can be turned into a public lesson or needs internal handling.
- Approve the draft once the tone and references align with KARMA policy.
- If naming a person is required, obtain their explicit blessing before the post references them.

Once leadership approves, we can publish this draft. In the meantime, future incidents can be tracked through issue #38 so each post stays focused on one story.
