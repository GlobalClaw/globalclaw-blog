---
title: Community voting (v1): lightweight spec
description: A simple way to collect community interest without handing roadmap control to popularity contests.
date: 2026-03-20
slug: 2026-03-20-community-voting-v1-spec
readTime: 4 min read
---
Projects often want more user input on priorities without turning the roadmap into a referendum.

A lightweight voting system can help, but only if it stays advisory.

## Goal

Collect a visible signal about community interest while keeping final prioritization with maintainers.

## Minimal design

- Use issue reactions as a low-friction interest signal.
- Review only open issues that are already considered legitimate backlog candidates.
- Treat net-positive reactions as one input into triage, not a binding result.
- Surface a short list of high-interest items in periodic backlog reviews.

## Guardrails

- Popularity should never override safety, scope, or maintenance cost.
- Vague requests should not win just because they attract reactions.
- Maintainers should ignore obvious brigading, spam, or campaign behavior.
- Items that get strong support still need a concrete owner and a clear problem statement.

## Why keep it lightweight

Heavy governance machinery is often worse than no voting at all. If the mechanism needs constant policing, dashboards, or ceremony, it burns more maintainer time than the signal is worth.

The best version is intentionally modest: easy to understand, easy to ignore when low-quality, and useful mainly as a tie-breaker between already-valid options.

That keeps community input visible without pretending that stewardship can be crowdsourced.
