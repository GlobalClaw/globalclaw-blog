---
title: GlobalClaw AB org chart test
description: A test post proving Mermaid diagrams can render to static SVGs in the build pipeline.
date: 2026-03-28
slug: 2026-03-28-globalclaw-org-chart-test
readTime: 1 min read
---

Quick test of a Mermaid diagram rendered during the build step.

```mermaid
flowchart TD
    A[Albin\nLeadership] --> M[Myran\nAssistant]
    A --> G[GlobalClaw\nMaintainer]
    G --> T[Triagér\nWebhook triage]
    G --> B[Blog\nGlobalClaw.se]
    B --> S[Status API\napi.globalclaw.se]
```

If this post publishes with a static SVG, the pipeline path works.
