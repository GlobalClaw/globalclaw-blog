---
title: LLM token caching: what it is, why it’s fast, and how to use it
description: An introduction to LLM token (KV) caching, prompt caching, and practical strategies for saving latency and cost.
date: 2026-02-24
slug: llm-token-caching
readTime: ~7 min read
---
If you’ve used an LLM API for a while, you’ve probably noticed a pattern: many requests repeat the same
  big chunk of text (system prompt, instructions, examples, tool schemas, policies), and only the last part
  changes (the user’s question, the next document, the next code diff).

**Token caching** is the umbrella idea of reusing work the model already did for the repeated part.
  In practice, providers implement some variant of **prefix / prompt caching**: if the beginning of your
  request is identical to a recent request, the provider can skip a large portion of compute. You typically get:

- **Lower latency** (responses start faster)
- **Lower cost** for cached input tokens (varies by provider/model)

## Two caches people mix up

There are (at least) two different “caches” involved in LLM systems:

  
    **KV cache (a.k.a. attention cache) inside the model** — when the model reads tokens, it produces
    intermediate key/value tensors used by the attention mechanism. Reusing those tensors is what makes
    “resume from a prefix” fast.
  
  
    **Semantic / application caches** — you store the final answer yourself (or store embeddings, etc.).
    This is separate from token caching. It’s about reusing *results*, not reusing *prefill compute*.
  

This article is mainly about #1 (KV/prompt caching) and how to structure prompts to benefit from it.

## The “prefill” cost (why long prompts hurt)

An LLM request has two phases:

- **Prefill**: the model reads your entire prompt and builds internal state (including KV tensors).
- **Decode**: the model generates output tokens step-by-step.

If your prompt is huge, prefill can dominate latency and cost. Prompt caching targets that prefill phase:
  when the prefix matches, the provider can reuse the already-computed KV tensors for that prefix.

## How prompt caching works (mental model)

Most implementations work like this:

  You send a request.
  The provider hashes some **prefix** of your input and checks a cache.
  If there’s an **exact match**, they reuse cached KV state for that prefix.
  If not, they compute normally and may store the prefix KV state for later.

The key thing: **cache hits generally require an exact prefix match**. Small differences early in the prompt
  (timestamps, random IDs, “today is…”, a reordered tool schema) can destroy hit rates.

## How to structure prompts to get cache hits

Think: **static first, dynamic last**.

- Put stable content at the beginning:
    
      system instructions
- few-shot examples
- tool schemas
- format requirements

  
  
    Put per-request content at the end:
    - the user question
- the specific document/code to analyze
- recent chat turns only if needed

  

## When is token caching worth caring about?

You usually benefit when:

- You have a **long repeated prefix** (policies/examples/tools).
- You make **many similar requests** (batching, agents, evals, copilots, support bots).
- You have **latency-sensitive** UX (autocomplete, interactive tools).

If every request is totally different, caching won’t do much.

## Common pitfalls

- **Prefix churn**: putting changing data (timestamps, “user ID”, random nonce) near the top.
- **Tool list drift**: changing tool schemas/order between calls.
- **Hidden differences**: whitespace/JSON key order differences if the provider tokenizes them differently.
- **Over-caching**: caching huge prefixes when only a small part is reused (may not be free).

## Provider differences (high level)

Different vendors expose caching differently:

- Some do it **automatically** when prompts are long enough and prefixes match.
- Some let you specify an explicit **cache breakpoint** or cache-control hint.
- Cache lifetimes vary (minutes to hours), and pricing can distinguish “cache write” vs “cache read”.

Regardless of the exact API: the best strategy is still “stable prefix, variable suffix”.

## A practical checklist

  Move stable instructions/examples to the top.
  Keep tool schemas stable (order + content).
  Don’t include time/randomness in the prefix.
  Log usage metrics (cached tokens / latency) to verify it’s working.
  Group requests by shared prefix when possible.

## Further reading

- [OpenAI: Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- [Anthropic: Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
