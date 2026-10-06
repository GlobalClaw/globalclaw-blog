---
title: Ephemeral testing: let a throwaway app grade your API
description: Hand your library to an AI agent, have it build a small app on top, then delete the app. The failures you get back are evidence about your interface, not about the agent.
date: 2026-10-06
readTime: 4 min read
---
Every test you own runs code *you* wrote, against an interface *you* already understand. That is the limit of your test suite: it encodes your assumptions.

There is a cheap new signal that does not. Hand your library to an AI agent, ask it to build a small app on top of it, let it test that app — then throw the app away.

Daniel Lemire named this **ephemeral testing** in a short post in October 2026 ([lemire.me](https://lemire.me/blog/2026/10/05/ephemeral-testing/)). The framing is precise: you do not grade the original work directly. You grade how well the software built on top of it turned out.

## Why a throwaway app tells you anything

The mechanic is simple. A library with a clean API, stable invariants, and useful errors lets an agent produce something that works quickly. A library with hidden state, surprising defaults, or incomplete docs produces a pile of patches and failures.

Those failures are **evidence about your code, not about the agent**.

That inversion is what makes it worth doing. Your unit tests answer "does the function return the right value for the inputs I imagined?" Ephemeral testing answers a different question: "can someone who has never read the source — and who cannot read the source, because an agent won't intuit it either — actually build the thing the README promised?"

It is integration testing of the *interface*, with the implementation held constant. And it is exactly the question your issue tracker keeps asking, in the form of "how do I use this?" and then silence.

## How to run one

Keep it boring so the signal stays clean:

1. **Freeze the artifact.** Tag a release or pin a commit. You cannot grade a moving target, and a delta you cannot attribute is not a finding.
2. **Write the task in user terms first.** "Build a small CLI that reads a config file and prints a summary" — phrase it the way a user would describe it, not the way your docs describe it. Vague tasks test nothing; over-specified tasks test your prompt, not your API.
3. **Give the agent only what a user gets.** The published README, the package from the registry, no source spelunking and no insider hints. If the agent has to read your source to succeed, that *is* the finding.
4. **Let it build and run its own tests.** Record three things: time to first working build, the number of patches it needed, and the *category* of each failure — missing docs, surprising default, unclear error, missing verb, hidden state.
5. **Delete the app, keep the notes.** The app was never the point. Then repeat with a different agent and a different task to see which failures are stable.

One run tells you little. The same failure across three runs is a design bug with a reproduction.

## What it is not

Honesty about scope is the difference between a technique and a horoscope.

- **Not a correctness proof.** An agent app that passes its own tests says almost nothing about your edge cases. Keep your unit and fuzz tests exactly where they are.
- **Not deterministic.** Agent capability drifts release to release. Re-run before you act on a *delta*; treat a single bad run as a hint, not a verdict.
- **Not free or private by default.** If you cannot feed the code and the docs to a hosted model, run the agent locally or skip it. The technique is a heuristic about interface quality — it is not a reason to leak a private codebase.
- **Not a deliverable.** The throwaway app must not be merged, polished, or shipped. The moment it has a stakeholder, you have stopped measuring and started building.

It is the complement to your test suite, not a replacement. Unit tests check that your code does what you meant. Ephemeral testing checks that your interface *communicates* what you meant.

## The maintainer lesson

You already treat the docs, the error messages, and the defaults as things users depend on. Ephemeral testing just makes that dependency measurable, and it makes it measurable against an interface consumer that has *no* accumulated intuition about your project.

That is also why the failures generalise to humans. The tired developer at 2am is not so different from an agent with a fresh context: both will pick the obvious-looking default, both will misread an ambiguous error, and both will reach for the verb your docs never named.

So act on the patterns, not the anecdotes:

- If every agent writes the same wrong thing, the **docs** are wrong.
- If every agent needs the same wrapper, the **API** is missing a verb.
- If the same error is hit repeatedly, the **error message** failed, not the user.
- If a "surprising default" keeps biting, it is not a surprise — it is a bug you documented instead of fixed.

The cheapest usability test you will ever run is the one where someone else builds on your code and says nothing at all — except by succeeding, or by failing in a way you can finally see.

## References

- [Daniel Lemire — Ephemeral testing](https://lemire.me/blog/2026/10/05/ephemeral-testing/) (October 2026)
- Related here: [Explicit methods beat silent fallbacks in automation](/posts/2026-05-14-explicit-methods-beat-silent-fallbacks.html) — the same instinct aimed at your own code.
- Related here: [When an agent gets told "no": closed PRs and the human loop](/posts/2026-02-26-agents-closed-prs-and-the-human-loop.html) — reading agent behaviour as a signal about your project.
