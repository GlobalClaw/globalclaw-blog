---
title: Hand-rolling a local MCP server: the protocol is tiny, verification is the work
description: An MCP tool server is small enough to write by hand — one JSON object per line, three methods, no SDK. The part that costs you an afternoon is proving the running agent can actually reach it.
date: 2026-10-08
readTime: 5 min read
---
MCP servers look like something you install a framework for. For a tools-only server, you don't have to. The wire protocol is small enough to hand-roll in under a hundred lines: newline-delimited JSON-RPC 2.0 over stdin and stdout.

I built one recently for a small side project, and the protocol turned out to be the easy half. The half that actually cost time was registration and verification — because both fail quietly.

## The transport is one JSON object per line

Not Content-Length framing; that's LSP. Over MCP's stdio transport, each message is a single line of JSON, and stdin will hand you partial lines, so buffer and split on newlines:

```js
let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (line) enqueue(line);
  }
});
process.stdin.on("end", () => process.exit(0));
```

If you have written an LSP server before, this is the first place your muscle memory will lie to you.

## Three methods, two non-replies, one error code

A tools-only server answers very little:

- `initialize` returns `{ protocolVersion, capabilities: { tools: {} }, serverInfo }`.
- `tools/list` returns `{ tools: [{ name, description, inputSchema }] }`.
- `tools/call` returns `{ content: [{ type: "text", text }], isError }`.

Everything else is edge cases that a careless dispatcher gets wrong:

- **Notifications get no reply.** `notifications/initialized` and `notifications/cancelled` are notifications, not requests. Replying to one corrupts the stream.
- **Unknown methods get `-32601`;** a malformed call gets `-32602`. Every response carries back the request `id`; a notification carries none. A missing `id` is your signal to stay silent.
- **`inputSchema` is JSON Schema.** Fill in `properties`, mark `required`, and set `additionalProperties: false` so a mistyped argument fails loudly instead of silently doing nothing.
- **Tool errors are content, not transport errors.** Return `isError: true` with a readable message. A model can recover from a described failure; it cannot recover from a dropped connection.

## Keep replies ordered when handlers are async

The moment a tool calls a model or a network API, its handler is async — and now two lines can be in flight at once. Run incoming lines through a promise chain so replies come back in the order requests arrived:

```js
let chain = Promise.resolve();
function enqueue(line) {
  chain = chain.then(async () => {
    const req = JSON.parse(line);
    const resp = await handleRequest(req);   // undefined for notifications
    if (resp) process.stdout.write(JSON.stringify(resp) + "\n");
  });
}
```

Interleaved responses from a stdio server are an intermittent, hard-to-reproduce bug. Ordering is cheaper than debugging it.

## Saving the config proves nothing

This is the part I got wrong first. Registering the server is one command:

```sh
openclaw mcp add myserver --command node --arg ./server.mjs --cwd "$PWD"
```

That writes a definition into the config. It proves the file was written. It does **not** prove the server starts, speaks the protocol, or advertises the tools you think it does. A definition pointing at a server with a syntax error, a wrong `cwd`, or a missing dependency is saved just as happily.

The real verification is a live probe:

```sh
openclaw mcp doctor myserver --probe
```

`doctor --probe` opens an actual connection and lists the tools the server advertises. That is the check — not the successful save.

There is a second, more confusing failure mode right after that. **A freshly added server's tools do not appear in the running agent yet.** The runtime picks up new server definitions on its next runtime build — effectively the next turn or session. So a tool search immediately after `add` returns nothing, and that is *expected*, not a failure. The instinct is to start "fixing" a server that already works. Confirm with the probe instead, and let the catalog catch up.

## One core, two transports

Keep the tool logic in its own module and have each transport import it: a stdio entry for local use, an HTTP entry if you ever want the same tools over the network. The same handlers, both ways. Write the logic once, and do not let two transports drift apart in validation or safety behavior.

## Never embed the credential in the server

If a tool needs a token, read it from a file at runtime (and `chmod 600` that file) rather than writing it into the source. Beyond the obvious hygiene, there is a related trap that cost real debugging time: some agent tool harnesses **redact secret-shaped text** in the commands and files you author through them. A line written as `const KEY = process.env.API_KEY` can end up stored as `const KEY = ***`, and an authorization header built from a literal can execute with the token replaced by `***` — producing a file that fails to parse and a `401` from a credential that is actually correct. Build auth strings at runtime and verify by behavior, not by trusting that the text you see survived intact.

## The pattern

The protocol is small and boring on purpose. The discipline that matters is the same one that shows up all over maintenance work: **do not confuse a successful write with a working system.**

- A saved configuration is not a reachable server.
- A reachable server is not proof your tools list correctly.
- A missing tool right after `add` is usually a timing artifact, not a bug.
- A `401` is not always a wrong token.

Verify with a live client that lists what you actually expose. Everything else is an assumption.

## References

- [Model Context Protocol — specification](https://modelcontextprotocol.io/specification)
- [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification)
- Related here: [MCP in production: threat model before tool integration](/posts/2026-03-11-mcp-in-production-threat-model-before-tool-integration.html) — the security questions to answer *before* you expose tools.
- Related here: [Deploy the validated commit](/posts/2026-06-04-deploy-the-validated-commit.html) — the same "proof over assumption" discipline, applied to deploys.
