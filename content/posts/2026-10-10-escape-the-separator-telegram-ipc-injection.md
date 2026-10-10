---
title: Escape the separator: a one-click account takeover built from two ordinary bugs
description: A recent Telegram Desktop CVE pairs an unescaped delimiter with a privileged command that never checked its caller. Both lessons are boring, reusable, and worth a few minutes.
date: 2026-10-10
readTime: 4 min read
---
Most account-takeover stories sound exotic. This one doesn't. A [research writeup published this month](https://beaksec.github.io/posts/telegram-desktop-one-click-account-takeover/) (CVE-2026-107181, fixed in Telegram Desktop 7.2.9) turns a clicked link into a full account takeover using two ordinary bugs: a separator that wasn't escaped, and a privileged action that never asked who was calling. Neither is clever. Both are the kind of thing that appears in ordinary application code, which is why they are worth a few minutes.

## Bug one: the separator was also data

Telegram Desktop registers the `tg:` URI scheme. When you click a `tg://` link, the OS may launch a second copy of the app even if one is already running. The new process notices the running instance (it can connect to a local socket), hands the link over as text, and exits.

Text, not an object — so the URL has to be serialized. Telegram's single-instance format is one record per command, each closed by a semicolon:

```
OPEN:tg://x?a=1;
```

The running instance reads the bytes and splits them at every `;`, treating each piece as an instruction in its own right. The bug: the serialized URL was built with `QUrl::FullyEncoded`, which does not escape `;`, and a URL is allowed to carry a semicolon in its query. So a crafted link arrives as more than one record:

```
OPEN:tg://x?a=1;CMD:quit;      <- the client thinks this is one URL
```

becomes, on the receiving side:

```
OPEN:tg://x?a=1
CMD:quit
```

Data became structure. That is the whole injection, and the CVE files it under CWE-143, *Improper Neutralization of Record Delimiters* — the same family as the CSV-injection and log-injection bugs most maintainers have already met.

## Bug two: reachable was mistaken for authorized

An injection is only as dangerous as what it can reach. The socket accepted four commands, and the fourth, `OPEN:`, took *any* URL with no filter on the scheme. That reached `interpret:`, an internal URI scheme used by Telegram's own release tooling: an operator wrote a small text file naming a channel, a file, and a caption, and `interpret:` read that file, read the file it pointed at, and posted it to the chat.

The handler performed **no authorization check**. That was defensible while the only caller was the release script on an operator's own machine — someone with local access could read those files anyway. But the same function was now reachable from a link a stranger could drop into a group chat. The action did not gain privilege; it gained *reach*.

## From a clicked link to the account

The chain is ordinary work, not cleverness:

- Telegram's default privacy settings let anyone add you to a group.
- Default settings auto-download group files up to 8 MiB to a predictable path, and `interpret:` accepts relative paths, so the attacker never needs to know your username.
- Three instruction files become three stacked `OPEN:interpret:` commands inside one clicked link.
- The files worth stealing are the ones that *are* the login. Telegram Desktop stores its MTProto authorization encrypted under a data key (DEK), and the DEK is wrapped by a key derived from an optional local passcode. With no passcode set — the default — that derivation runs over an empty passphrase and a salt stored in the clear beside the encrypted DEK. Read the right `tdata` files and you can rebuild the account on a fresh install.

One click, arbitrary local file read, account takeover. No memory corruption, no broken crypto — just a delimiter that wasn't escaped and a function that didn't ask who was calling.

## What the fix actually did

The [fix commit](https://github.com/telegramdesktop/tdesktop/commit/db3405699f8fc3ae28a58d2348b7d13a43c0590a) does the obvious thing first, then a little more:

- It escapes the record separator before writing and decodes after splitting: `;`, `%`, and control or non-ASCII bytes become a percent-hex encoding, so a semicolon in the data can no longer become a boundary.
- It removes `interpret:` and its send-path helper entirely — the privileged path stops existing rather than gaining a permission check.
- It adds two containment rules: `CMD:` and `CTRL:` records are ignored on a connection that also carries an `OPEN:`, and local file paths are dropped once a non-local URL has appeared on that connection.

That last pair is the interesting part. Escaping fixes *this* bug; the containment rules stop one injected record from quietly buying the next privilege.

## The reusable lessons

- **A serialization boundary is where structure becomes text.** Whatever character separates your records stops being special the moment it appears inside a value; you have to escape it, encode it, or use a length-prefixed format. If your format has a delimiter and your data can contain that delimiter, you are carrying a CWE-143 bug. The test is cheap: feed your encoder values that contain the delimiter. If you have hand-rolled a small stdio protocol lately, the same rule governs newline-delimited JSON — see [hand-rolling a local MCP server](/posts/2026-10-08-hand-rolling-a-local-mcp-server.html).
- **Reachability is not authorization.** "Only our build script calls this" is not an access control; it is an assumption about the call graph. When you add a new path to an old privileged function, you inherit both the privilege and the reach. Gate on caller identity, or delete the path.
- **Privilege should not compose through a shared channel.** One `OPEN:` record should not unlock `CMD:`/`CTRL:`, and a remote URL should not re-enable local file paths. Treat every message on a shared channel as untrusted input to the next decision, not as a trusted continuation of the last.

One quieter lesson for maintainers: the fix shipped without an advisory. The 7.2.9 changelog mentions only a rendering fix, and the commit is titled "Remove legacy interpret path helper." For a high-severity, remotely triggered file read, "upgrade and you're fine" only works if people know to upgrade. If you ship a security fix, say so.

## References

- [BeakSec: Telegram Desktop — one-click account takeover via IPC injection](https://beaksec.github.io/posts/telegram-desktop-one-click-account-takeover/)
- [CVE-2026-107181](https://www.cve.org/CVERecord?id=CVE-2026-107181) — CWE-143, Improper Neutralization of Record Delimiters
- [Fix commit db3405699f — "Remove legacy interpret path helper"](https://github.com/telegramdesktop/tdesktop/commit/db3405699f8fc3ae28a58d2348b7d13a43c0590a)
