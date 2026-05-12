---
title: LLM prompt caching has a schema tax
description: Prompt caching only pays off if your prefix stays stable. Treat tool schemas and early prompt structure like an ABI, or your cache hit rate quietly evaporates.
date: 2026-05-12
slug: 2026-05-12-llm-prompt-caching-schema-tax
readTime: 6 min read
---
Prompt caching sounds magical until you watch a perfectly good cache miss because somebody added a timestamp, reordered tool definitions, or changed a JSON schema description near the top of the request.

That is the real lesson: **prompt caching is not just a model feature. It is an interface-discipline problem.**

Anthropic’s prompt caching docs are explicit that the cached prefix includes `tools`, `system`, and `messages` up to the cache breakpoint. Google’s Gemini caching docs make the same practical point from the other side: put large common content at the beginning, keep the prefix similar, and inspect `usage_metadata` to see whether you are actually getting cache hits.

If you build LLM systems with tool calling, the biggest hidden cache killer is often not the user message. It is your own application glue.

## The mistake teams make

Teams hear “cache the repeated prefix” and think about long documents, few-shot examples, or big system prompts.

All true. But in real agent systems, a surprising amount of prefix churn comes from:

- tool definitions generated dynamically per request
- unstable field ordering in schemas or JSON serialization
- timestamps, request ids, or trace metadata injected too early
- rotating examples or status text placed above the actual user input
- "tiny" edits to descriptions that sit inside every tool schema

Individually these changes look harmless. Together they turn cacheable traffic into slightly-different snowflakes.

## Treat your prompt prefix like an ABI

A useful mental model: the early part of your prompt is an **ABI for inference cost and latency**.

If the top of the request changes all the time, you are not really offering the provider a reusable prefix. You are asking them to recompute the expensive part over and over.

That means the boring engineering habits matter:

1. **Keep stable things first**
   Put tool schemas, core instructions, and long-lived reference context at the top.

2. **Push volatile things down**
   Timestamps, per-request metadata, ephemeral notices, and the current user turn belong as late as possible.

3. **Stop regenerating equivalent schemas**
   If your tool contract is logically the same, serialize it the same way every time.

4. **Avoid decorative prompt churn**
   Rewording tool descriptions and system prose on every deploy may feel harmless. Your cache bill disagrees.

## Tool schemas are often the real tax

In agentic apps, tool definitions can be large. Sometimes they are larger than the current user message.

That makes them prime cache material — and prime cache sabotage.

A few common footguns:

- sorting tools differently between requests
- embedding environment-specific status into tool descriptions
- expanding schemas with verbose generated examples that change often
- including optional tools opportunistically instead of presenting a stable set for a route

If your tool list changes every turn, the provider may have to re-prefill a large chunk of tokens every turn too.

This is why I think teams should treat tool definitions less like incidental config and more like versioned API surface.

## What to do in practice

### 1) Canonicalize tool definitions

Pick one stable serialization path.

- consistent field ordering
- consistent tool ordering
- no random ids or generated prose inside definitions
- no per-request environment text unless truly necessary

If you must change tool schemas, do it intentionally and understand that you are invalidating the cached prefix.

### 2) Split static instructions from live state

Do not mix durable policy with rapidly changing runtime context.

Bad shape:

- tools
- current timestamp
- dynamic routing hints
- system instructions
- user message

Better shape:

- tools
- stable system instructions
- durable shared context
- live runtime state
- current user message

The second shape gives the cache a fighting chance.

### 3) Measure actual hits, not vibes

Google explicitly documents cache-hit visibility in `usage_metadata`. Anthropic exposes cache usage too. Use that.

If your team says “we enabled prompt caching” but nobody is watching hit rates, write tokens, or latency deltas, then you have not really enabled anything meaningful. You have enabled hope.

### 4) Be careful with framework convenience

A lot of agent frameworks helpfully assemble prompts for you. Helpful is not the same as cache-friendly.

Inspect the final wire payload. That is what the cache sees.

If the framework reorders tools, injects changing headers, or rewrites system content per turn, your beautiful architecture diagram will still miss cache.

## The practical rule

**Static first. Dynamic last. Stable always.**

That rule is not elegant, but it is profitable.

Prompt caching is one of the few LLM optimizations that can improve both latency and cost without changing model quality. The catch is that it rewards discipline more than cleverness.

So yes, use prompt caching. But do not stop at the checkbox.

Treat the prefix like production infrastructure. Because once your prompts are big enough, it is.

## Small checklist

- ☐ Stable tool ordering across requests
- ☐ Stable JSON/schema serialization
- ☐ No timestamps or request ids near the top of the prompt
- ☐ Durable instructions separated from live runtime state
- ☐ Cache-hit metrics visible in normal observability dashboards
- ☐ Prompt changes reviewed for cache impact, not just behavior impact

## Sources

- [Anthropic docs: Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Google AI docs: Context caching](https://ai.google.dev/gemini-api/docs/caching)
- [Google AI API reference: cachedContents](https://ai.google.dev/api/caching)
