---
title: Agent Safehouse: deny-first sandboxing for coding agents on macOS
description: Agent Safehouse wraps coding agents in a deny-first macOS sandbox. Why this matters, where it helps, and how to adopt the pattern without killing developer velocity.
date: 2026-03-09
slug: 2026-03-09-agent-safehouse-deny-first-sandboxing-for-coding-agents
readTime: ~7 min read
---
If you run coding agents with `--yolo`-style permissions, you are one bad tool call away from a very bad afternoon.
  Agent Safehouse is interesting because it flips the default: **deny first, then grant only what the agent needs**.

Primary sources: [Agent Safehouse site](https://agent-safehouse.dev/) and
  [GitHub repository](https://github.com/eugene1g/agent-safehouse).
  It also got strong attention on HN: [discussion thread](https://news.ycombinator.com/item?id=47301085).

## Why this pattern matters

Most local agents inherit your user permissions. That means your SSH keys, other repos, personal documents,
  and random dotfiles are all one accidental command away from being touched.

Safehouse wraps agent execution in macOS sandbox policies so the agent can work in the current project,
  while sensitive areas stay blocked at the kernel level.

## What’s actually practical here

- **Single script install:** low friction to test.
- **Deny-first model:** better default than “full home directory plus vibes.”
- **Composable access:** add read-only/read-write exceptions intentionally.
- **Agent wrappers:** make sandboxed usage the default shell behavior.

I like this because it respects real developer flow: you can keep velocity and still lower blast radius.
  Security that kills productivity gets bypassed. Security that feels natural gets adopted.

## Important caveat (and why it’s still worth using)

The project explicitly describes itself as a *hardening layer*, not a perfect boundary.
  That honesty is good engineering.

Least privilege won’t eliminate risk, but it does change failure mode from
  “agent touched everything I own” to “agent failed inside a smaller box.”

## How I’d adopt this at work

  Start with one non-critical repo and run your normal agent tasks in a deny-first sandbox.
  Log every permission miss for a week; only grant what is repeatedly needed.
  Separate common team defaults from machine-local exceptions.
  Add a documented “unsandboxed escape hatch” for rare edge cases (with social friction).
  Treat sandbox policy review like dependency review: routine, explicit, versioned.

## Small checklist for this week

- Inventory what your coding agent can currently read/write.
- Block access to keys, personal files, and unrelated repos by default.
- Wrap your most-used agent command so sandboxing is the default path.
- Document when bypassing sandboxing is acceptable (and who approves it).

We don’t need perfect safety to get meaningful risk reduction. We need better defaults.
  Deny-first local agent execution is one of the better defaults I’ve seen this month.

## Links

- [Agent Safehouse website](https://agent-safehouse.dev/)
- [Agent Safehouse repository](https://github.com/eugene1g/agent-safehouse)
- [Hacker News discussion](https://news.ycombinator.com/item?id=47301085)
