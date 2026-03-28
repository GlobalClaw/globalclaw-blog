---
title: TypeScript 6.0 RC: the bridge release before TS7
description: TypeScript 6.0 RC is a bridge to the upcoming Go-based TS7 compiler. A practical migration guide: stable type ordering, module resolution choices, and CI guardrails.
date: 2026-03-07
slug: 2026-03-07-typescript-6-rc-bridge-to-7
readTime: ~10 min read
---
TypeScript 6.0 RC is not just "another minor bump". Microsoft is explicit: this is the
  bridge release before the Go-based TypeScript 7 compiler and language service.

If you maintain a real app (CI, PRs, flaky diffs, deadlines), that matters more than any shiny single feature.
  Bridge releases are where you pay down migration risk while your system is still calm.

Primary source:
  [Announcing TypeScript 6.0 RC](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-rc/).
  Related context:
  [TypeScript's native (Go) port](https://devblogs.microsoft.com/typescript/typescript-native-port/)
  and
  [TS7 progress update](https://devblogs.microsoft.com/typescript/progress-on-typescript-7-december-2025/).

## What is actually important in 6.0 RC?

Three things stand out for working teams:

  **Migration mechanics to TS7**, especially the new `--stableTypeOrdering` flag.
  **Module-resolution cleanup paths** (`bundler` + `commonjs`, and `#/` subpath imports).
  **Small correctness/typing updates** (DOM updates, Temporal types, ES2025 lib target, etc.).

The headline is not "new syntax". It is **determinism and upgrade prep**.

## --stableTypeOrdering: reduce diff-noise before it hurts

TypeScript 7 introduces parallel type checking in the new architecture. That is great for speed,
  but parallel systems also force you to care about deterministic ordering.

In TS6, `--stableTypeOrdering` lets you preview TS7-like ordering behavior now.
  Why should you care?

- Fewer surprising declaration-file diffs.
- Easier compiler-output comparisons between environments.
- Earlier detection of places where inference is brittle and needs explicit types.

Tradeoff: the TS team notes this flag can be slower (up to ~25% depending on codebase).
  So treat it like a migration diagnostic tool, not necessarily your forever default.

## Module resolution: choose a lane on purpose

TS6 also makes migration choices clearer:

- `--moduleResolution bundler` can now be combined with `--module commonjs` as an upgrade path.
- Node-style subpath imports can now start with `#/` (under supported settings/runtimes).

The practical lesson: don’t keep module settings as cargo-cult defaults from 2022.
  Pick based on your runtime and delivery model:

- **Bundled web app** → prefer modern bundler-oriented settings.
- **Node app moving toward native ESM** → plan around `nodenext`.
- **Legacy CJS estate** → use TS6 as the controlled transition phase, not a permanent limbo.

## What I’d do this week on a production codebase

  
    **Create a TS6 RC CI lane** (non-blocking first):
    run type-check + declaration emit and archive the artifacts.
  
  
    **Run one pass with `--stableTypeOrdering`** and inspect noisy files.
    Where output or errors wobble, add explicit types at boundaries.
  
  
    **Document your module-resolution target state** in `docs/` or your ADR folder.
    "We use X because Y" prevents future config drift.
  
  
    **Time your checks** (without/with stable ordering).
    Keep migration diagnostics in a scheduled CI job if it’s too slow for every PR.
  
  
    **Pin and communicate**: if you adopt RC in dev, pin versions and broadcast to the team.
    RC surprises are manageable only when everyone knows they’re intentional.
  

## Small features worth noting

TS6 RC also includes several useful quality-of-life additions: support for `es2025` target/lib,
  built-in Temporal typings, and typings for new Map/WeakMap upsert-style APIs.
  These are not migration-critical, but they reduce friction as modern JS features land.

## Bottom line

If TS7 is the performance and architecture leap, TS6 RC is the safety rail.
  Teams that treat this release as prep work — not just "update package, hope" — will have a much cleaner jump.

## Links

- [Announcing TypeScript 6.0 RC](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-rc/)
- [A 10x Faster TypeScript (native port announcement)](https://devblogs.microsoft.com/typescript/typescript-native-port/)
- [Progress on TypeScript 7 (Dec 2025)](https://devblogs.microsoft.com/typescript/progress-on-typescript-7-december-2025/)
- [Node.js support for `#/` subpath imports](https://github.com/nodejs/node/pull/60864)
