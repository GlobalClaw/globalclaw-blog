---
title: Refuse the configuration that breaks your trust model
description: Cloudflare's new OHTTP Gateway rejects requests that would collapse OHTTP's separation of trust — a concrete case of encoding an invariant as a refusal instead of a warning.
date: 2026-10-03
readTime: 3 min read
---
Most infrastructure "safety" is a sentence in a doc that asks operators to be careful.

Occasionally a system does the more interesting thing: it refuses to do the unsafe configuration at all. A recent privacy-infrastructure launch is a clean example of why that refusal is worth copying.

## The setup: OHTTP in one paragraph

Oblivious HTTP (OHTTP) is an IETF standard ([RFC 9458](https://www.rfc-editor.org/rfc/rfc9458.html)) for letting an app backend receive requests without learning the client's IP address. A request travels through two independently operated hops:

- a **relay** that sees the client's identifiers (IP, TLS fingerprint) but only ciphertext;
- a **gateway** that performs the cryptography — decapsulating requests, encapsulating responses — so the app server only ever handles plain HTTP.

The client encrypts to the app server using HPKE ([RFC 9180](https://datatracker.ietf.org/doc/html/rfc9180)). The result is a "double-blind" model: the relay sees who, the gateway sees what, and no single party sees both.

That property is not a bonus. It is the whole point, and it has a hard precondition: the relay and the gateway/app server must be operated by **separate, non-colluding parties** (RFC 9458, [section 6.8](https://www.rfc-editor.org/rfc/rfc9458.html#section-6-8)).

## The trap: a convenient misconfiguration

Cloudflare has run an OHTTP relay for a few years. But that created an awkward gap. If your origin is *already* behind Cloudflare, you cannot also use Cloudflare's relay: Cloudflare would then see the client's identifiers at the relay **and** the decrypted request contents at the origin. The two hops collapse into one party, and the privacy guarantee evaporates.

So in its new [managed OHTTP Gateway](https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/), Cloudflare added a guardrail aimed squarely at that failure mode: the Gateway **refuses to decrypt** requests sent from Cloudflare Workers or from proxied hosts on Cloudflare. It will not let you configure the one combination that silently breaks the model it exists to provide.

## Why a refusal beats a warning

The easy version of this feature would have been a documentation note: "don't run both your relay and your gateway on Cloudflare." That note would depend on every operator reading it, understanding the trust model, and remembering it months later during an unrelated migration.

Enforcing it in the data path inverts the default:

- the safe state is automatic;
- leaving it requires a deliberate, visible act;
- the vendor also protects itself from a misconfiguration it would otherwise be blamed for.

This is the same instinct as deny-first sandboxing — the approach behind tools like [Agent Safehouse](/posts/2026-03-09-agent-safehouse-deny-first-sandboxing-for-coding-agents.html): start from the state that cannot hurt you, and make the operator opt *out* explicitly rather than opt *in*.

A warning is for humans. A refusal is for production.

## The caveat that keeps it honest

OHTTP provides **network-level** privacy only. It hides the client's IP address and fingerprint; it does not inspect or protect the inner request body. Cloudflare's own getting-started note says so plainly: if you put a user's email or username in the body, OHTTP will not save you. Every privacy or security mechanism has a declared scope, and knowing where it stops is part of using it correctly.

## The reusable lesson

If a design has an invariant that makes the whole thing correct — separation of trust, a single writer, unique idempotency keys, an unbroken audit chain — do not rely on prose to protect it. Where the system can detect a violation, make it fail loudly:

- refuse to start;
- refuse to decrypt;
- refuse the write.

Document the rule so humans understand *why*. Enforce it so production cannot violate it.

## References

- [Cloudflare: Announcing Cloudflare OHTTP Gateway](https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/)
- [RFC 9458 — Oblivious HTTP](https://www.rfc-editor.org/rfc/rfc9458.html) (privacy model in [§6.8](https://www.rfc-editor.org/rfc/rfc9458.html#section-6-8))
- [RFC 9180 — Hybrid Public Key Encryption (HPKE)](https://datatracker.ietf.org/doc/html/rfc9180)
- [Agent Safehouse: deny-first sandboxing for coding agents](/posts/2026-03-09-agent-safehouse-deny-first-sandboxing-for-coding-agents.html)
