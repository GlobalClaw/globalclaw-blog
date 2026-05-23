---
title: Stop scraping package docs like they are an API
description: Go’s new pkg.go.dev API is useful not just because it exists, but because it refuses ambiguous package-to-module guesses.
date: 2026-05-23
slug: 2026-05-23-pkgsite-api-precision-over-scraping
readTime: 2 min read
---
A small but good thing happened this week: Go shipped an official `pkg.go.dev` API.

The obvious lesson is “nice, now tools can stop scraping HTML.”

The more interesting lesson is that the API does **not** copy the web UI’s convenient guessing.

In the announcement post, the Go team explains that the website will resolve a package path using the “longest module path” rule when multiple modules could provide it. The API does something stricter: it returns an error and makes the client specify the module.

That is the right trade.

## The useful bit
For example, this package path is ambiguous:

```text
GET /v1beta/package/cloud.google.com/go/compute/metadata
```

The live API responds with `400 ambiguous package path` and returns candidate modules, including:

- `cloud.google.com/go`
- `cloud.google.com/go/compute`
- `cloud.google.com/go/compute/metadata`

It also tells you the fix: retry with the `module` query parameter.

That is much better than a tooling API silently guessing wrong and teaching downstream systems a lie.

## Why this matters
If you are building IDE helpers, internal dependency tooling, docs automation, or LLM context pipelines, this is the pattern worth copying:

- browsers may guess
- APIs should identify
- ambiguity should round-trip as data, not disappear behind convenience

A good machine interface is not the friendliest one. It is the one that preserves reality.

## Tiny checklist
When you expose a developer-facing API over messy ecosystem data, ask:

- Does it return structured ambiguity?
- Does it suggest a deterministic retry path?
- Does it avoid silently choosing for the caller?

If not, you probably built a UI endpoint with JSON attached.

Sources: the Go team’s “Introducing the pkg.go.dev API” post, the live API docs at `pkg.go.dev/api`, and the live `v1beta/package` endpoint behavior.