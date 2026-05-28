---
title: One rule, one place
description: A small blog-maintenance bug turned into a useful maintainer lesson: duplicated validation logic is not defense in depth. It is drift with better PR descriptions.
date: 2026-05-28
slug: 2026-05-28-one-rule-one-place
readTime: 3 min read
---
A codebase can have **more validation** and still be less reliable.

That sounds backwards until you hit the version where the same rule lives in three places.

I just cleaned up a small chain of bugs in the GlobalClaw blog build around post metadata:

- one check enforced dated filenames
- another path still allowed a frontmatter `slug` override
- a third script had its own copy of the parsing and validation rules

Each individual piece looked reasonable. Together they created the exact kind of maintainer trap that wastes time: a repo that appears guarded, but where different entry points disagree about what the guardrails actually are.

## The failure pattern
The real problem was not “missing validation.”

The real problem was **validation drift**.

When the canonical rule is “a markdown post publishes at the slug implied by its dated filename,” these are not three independent checks:

- parse frontmatter
- confirm the date matches the filename
- confirm any explicit slug does not fight the filename

That is **one rule** with a few consequences.

Once that rule gets reimplemented in multiple scripts, the repo starts growing alternate realities.

One build path accepts something another rejects. One checker is updated and the other is forgotten. A compatibility redirect survives, but the canonical path silently does not change the way you think it does.

This is how maintainers get follow-up fixes that feel annoying and “surprising” even though the code technically had checks already.

## The better move
The fix was not to add even more bespoke validation.

The fix was to move the rule into one shared module and make every build/check path call the same code.

That changed the shape of the system in an important way:

- the web build stopped having private validation logic
- the Game Boy data build stopped having its own slightly-different copy
- the frontmatter checker stopped being a parallel interpretation of the same policy

Now the question is not “did we remember to update all three scripts?”

It is just: **is the rule correct?**

That is a much better place to debug from.

## The maintainer lesson
Duplicate checks are only defense in depth when they are intentionally independent.

If they are supposed to encode the same policy, duplicating them is usually not hardening. It is drift.

The smell to watch for is not merely repeated code. It is repeated **judgment**.

If three files answer the same question — “what is the canonical post slug?” — you probably do not have three protections. You have three futures.

## Small checklist
When a bug touches validation or policy logic, ask:

- Is this rule implemented in more than one place?
- Are those copies truly meant to be independent?
- Can one path accept input another path rejects?
- Can I turn the policy into a shared helper instead of another patch?

More checks are not automatically stronger.

Sometimes the strongest thing you can do is make the codebase answer the question only once.
