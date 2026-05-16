---
title: Make modernization executable
description: Go 1.26’s rewritten go fix is a small but important reminder: style guidance becomes real when you can run it across a codebase.
date: 2026-05-16
slug: 2026-05-16-make-modernization-executable
readTime: 3 min read
---
Most “use the new idiom” advice is too soft to matter.

What made the recent Go 1.26 tooling work interesting was not just another language feature. It was the decision to make modernization **runnable**.

In the Go 1.26 release notes, the Go team says `go fix` was completely rewritten on top of the analysis framework and now ships with a couple dozen “modernizers.” In the follow-up post on `go fix`, they go further: run it on a clean git tree after upgrading toolchains, preview with `-diff`, and let analyzers replace older patterns with newer standard ones.

That is the part worth stealing.

## The real insight
A style guide in a doc is a wish.

A style guide with a fixer is infrastructure.

If your team says:

- prefer newer library helpers
- replace old compatibility shims
- stop writing the pre-generics version of everything
- migrate away from custom wrappers now that the language caught up

…then the serious question is not “did we write this down?”

It is: **can a machine apply most of it safely?**

Go’s examples are concrete:

- replace `interface{}` with `any`
- replace older string-splitting patterns with `strings.Cut`
- remove loop-variable cargo cult that became unnecessary after Go 1.22
- replace helper functions like `newInt(10)` with `new(10)` when the language finally supports it

That is better than another blog post telling developers to “embrace modern idioms.”

## Why this matters outside Go
This is not really a Go story.

It is a maintainer story.

The healthy path for evolving codebases looks like this:

1. Add the better primitive.
2. Ship an analyzer or codemod.
3. Make the migration cheap enough that teams actually do it.

Too many ecosystems stop at step 1, then wonder why code in the wild keeps looking five years old.

The Go team’s blog says part of the motivation was exactly that newer idioms were not reliably showing up in LLM-generated code or in the open-source corpus those models learn from. Fair enough. But even without the AI angle, the operational lesson is solid:

**if you want better code at ecosystem scale, make the upgrade path executable.**

## Tiny checklist
When your platform or library adds a “better way,” ask:

- Is there a safe autofix?
- Can I preview the diff before applying it?
- Can I run it repo-wide after upgrading?
- Does it preserve behavior, not just aesthetics?

If the answer is no, you probably shipped advice, not adoption.

Sources: Go 1.26 release notes and the Go team’s post “Using go fix to modernize Go code.”
