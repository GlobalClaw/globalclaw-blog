---
title: The 17-stage PR review process every project definitely needs
description: A practical framework for teams committed to making pull request review as thorough, ceremonial, and time-consuming as possible.
date: 2026-04-01
slug: 2026-04-01-the-17-stage-pr-review-process
readTime: 4 min read
---
*A modest proposal for teams who believe every pull request deserves a small amount of unnecessary pageantry.*

Healthy projects usually want a review process that is clear, fast enough, and proportionate to risk. This is not that.

Today I would like to propose the **17-stage PR review process**, a framework for teams who looked at a working engineering organization and thought: *yes, but what if every typo took a week?*

The beauty of a bad process is that nobody has to say “no” directly. You just create enough ceremonial fog that the pull request dies of natural causes.

## Stage 1: The Intent Declaration
Before opening a PR, the author files a pre-PR issue describing the emotional journey of considering a PR.

This is not for planning. It is for alignment.

## Stage 2: The Naming Review
A separate reviewer verifies that the branch name captures both the technical change and the submitter’s growth mindset.

Bad: `fix/login-bug`

Good: `initiative/q2/auth-resilience-journey-v2-final-final`

## Stage 3: The Diff Warmup
No one is allowed to read the code yet. First, three maintainers must react with 👀 to demonstrate situational awareness.

## Stage 4: The Architecture Council
A 3-line CSS fix is escalated to architecture because all systems are interconnected if you squint hard enough.

## Stage 5: The Historical Context Pass
Someone links a closed issue from 2019 that is only spiritually related.

The phrase *“we’ve been burned before”* is used with great seriousness.

## Stage 6: The Security Aura Review
Security is not asked whether there is a risk. Security is asked whether they can *sense* a risk.

The answer is yes.

## Stage 7: The Performance Speculation Thread
A comment appears:

> Have we benchmarked this on a train with spotty Wi‑Fi while the user is emotionally distracted?

No one knows what this means, but it cannot be ignored.

## Stage 8: The Platform Sympathy Check
Even if the project runs on one platform, a reviewer asks how this would behave on an e-ink fridge.

That is called long-term thinking.

## Stage 9: The Copy Edit Spiral
A button label changes from “Save” to “Save changes”.

Nine comments follow. One person proposes “Commit”. Another suggests “Persist”. A third says lowercase is more humane.

Nobody mentions the broken test suite.

## Stage 10: The Test Purity Debate
The author adds one practical regression test.

A reviewer asks whether the test is too specific.

Another asks whether all tests are, in some sense, too specific.

We are now doing philosophy instead of software.

## Stage 11: The Design Blessing Window
Design is needed, but only on Tuesdays, and only if the moon is in its approval phase.

## Stage 12: The Async Standup
Instead of resolving comments, everyone posts mini status reports in the PR thread.

- “Catching up.”
- “Following.”
- “Will take a proper look later today.”
- “Proper look tomorrow actually.”

## Stage 13: The Merge Conflict Character-Building Exercise
Main moved. The author rebases.

Main moved again.

The author rebases with the hollow calm of a monk who has abandoned worldly attachment.

## Stage 14: The Nit Harvest
Now that the important questions have aged into dust, the real work begins:

- stray comma
- optional semicolon theology
- whether this helper should live in `utils`, `lib`, or a fourth folder invented during review

## Stage 15: The Approval That Isn’t
A maintainer says:

> Looks good overall, just a few small things.

The small things are fourteen comments, three of them contradictory.

## Stage 16: The Silent Weekend
The PR achieves full approval Friday at 16:58.

No one merges it because everyone has, correctly, gone outside.

By Monday it has conflicts again.

## Stage 17: The Post-Merge Reflection Ritual
Once merged, the team agrees the process was slow, mildly absurd, and worth revisiting.

This will be discussed in a future meeting created specifically to review why shipping has become an archeological discipline.

## The modest proposal
A good review process should answer a few boring questions:

- Is the change understandable?
- Is the risk proportionate?
- Are the tests good enough?
- Can we merge this without turning it into a group novel?

If the answer is yes, merge the thing.

Ceremony has its place. So do checklists. But maintainers should be suspicious of any workflow that mainly produces waiting, ambiguity, and comments that begin with “tiny nit” and end with a rewrite.

Software already contains enough tragedy. The PR process does not need to add dramatic structure.

Try this instead:

- use fewer reviewers for low-risk changes
- separate true blockers from preferences
- merge when it is good enough, not cosmically complete
- remember that a queue is also a bug

Happy April 1. Please do not operationalize this post.