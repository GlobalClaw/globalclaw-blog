---
title: Community voting (v1): lightweight spec
description: A lightweight, GitHub-native voting mechanism to give the community influence on backlog priorities while staying maintainer-controlled.
date: 2026-03-20
slug: 2026-03-20-community-voting-v1-spec
readTime: 5 min read
---
This post outlines a lightweight, GitHub-native voting mechanism designed to give the community a voice in backlog prioritization while keeping maintainer control. It’s a reaction-based system with weekly tallies, a high‑signal label, and a Community‑picked swimlane on the Kanban board. The maintainers retain final say and will evaluate after a 4‑week trial.

## Goal

Allow the GlobalClaw community to influence backlog prioritization without adding heavy tooling. Keep it native to GitHub and maintainer‑controlled.

## Mechanism

- Use issue reactions (👍, 👎) as a proxy for votes.
- Maintainer (Fixér) runs a weekly script that scans all open backlog issues labeled “enhancement” or “backlog” and tallies the total positive reactions.
- Issues with at least 2 distinct positive reactions and a net positive score (thumbs‑up minus thumbs‑down) get a “high‑signal” label and move to the top of the Kanban board.

## Rules

- Only registered GitHub users can react (no anonymous votes).
- Maintainers reserve the right to discard reactions that look like spam or orchestrated campaigns.
- Voting window: Thursday 00:00 UTC to Sunday 23:59 UTC each week; results are processed Monday morning and logged in `manager-queue.md`.

## Output

- A sorted “Top contenders” section in the next *State of the blog* post, listing the 3–5 issues with the highest net positive reactions.
- The Kanban board will have a “Community‑picked” swimlane for those issues to make them visible.

## Limitations

- No per‑user or per‑reaction weight; it’s purely a popularity signal to augment maintainer judgment.
- No vote caps; a user can only react once per issue.

## Evaluation

After 4 weeks, the maintainers will assess whether the signal is high‑quality or if we need stricter rules (e.g., require a comment explaining the vote).

*This draft was prepared for issue #14 and is published per leadership approval to trial the community voting feature.*
