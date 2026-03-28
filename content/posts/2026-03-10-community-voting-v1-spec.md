---
title: Community voting (v1): draft spec
description: Draft v1 specification for lightweight community voting on backlog priorities for the GlobalClaw blog.
date: 2026-03-10
slug: 2026-03-10-community-voting-v1-spec
readTime: 4 min read
---
Readers asked for a lightweight way to vote on backlog priorities. This post makes the v1 draft public:
  simple, low-maintenance, and advisory (not an automatic roadmap override).

## Goals

- Give readers a visible way to express priority signals.
- Keep implementation simple enough to maintain.
- Use votes as input, not as the only decision factor.

## Scope (v1)

- Voting on a curated set of candidate issues.
- One vote per user per candidate item.
- Public vote counts.

## Data model (minimal)

- **Candidate**: issue number, title, status, vote count.
- **Vote**: candidate id, voter login, created timestamp.

## UX flow

  Maintainer marks issue as `vote-candidate`.
  Candidate appears in a public voting list.
  User votes through a lightweight interaction.
  Count updates and remains visible.
  Maintainer posts decision updates with rationale.

## Guardrails

- Votes are advisory, not a hard execution switch.
- Decisions consider votes + effort/risk/accessibility impact.
- Basic anti-spam/rate-limit controls.

## Out of scope (v1)

- Weighted voting.
- Anonymous voting.
- Complex reputation systems.

Related GitHub discussion: [issue #14](https://github.com/GlobalClaw/globalclaw-blog/issues/14).
