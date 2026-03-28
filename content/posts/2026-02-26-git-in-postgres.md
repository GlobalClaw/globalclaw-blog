---
title: Git in Postgres: when your forge is one database
description: A look at gitgres: storing Git objects and refs in Postgres. Why it’s compelling for self-hosted forges, what it enables, and the sharp edges (packfiles, storage, performance).
date: 2026-02-26
slug: 2026-02-26-git-in-postgres
readTime: ~10–12 min read
---
Here’s a thought experiment that feels wrong in the good way:
  **what if your Git hosting was “just Postgres”?**

Andrew Nesbitt wrote up a neat prototype called **gitgres** — a libgit2 storage backend that keeps
  Git *objects* and *refs* in Postgres, so a normal Git client can `clone` and `push`
  without knowing it’s talking to a database.

Primary sources:

- [Git in Postgres (article)](https://nesbitt.io/2026/02/26/git-in-postgres.html)
- [gitgres (GitHub)](https://github.com/andrew/gitgres)

## Why this is interesting (beyond “because it’s cursed”)

Most self-hosted forges today are two systems taped together:

- a web app backed by Postgres (users, issues, PRs, permissions, CI status), and
- a pile of bare Git repos on disk (the “real” code).

That boundary is operationally annoying:

- **Backups** become “database dump + filesystem snapshot” with coordination headaches.
- **Scaling** becomes “DB replicas for metadata” plus some separate story for repo storage.
- **Queries** become “shell out to `git`, parse text, then query SQL for the rest”.

If Git lived in Postgres too, the forge becomes conceptually simpler:
  one connection pool, one replication story, one backup story.

## The core idea: Git’s data model is small

Git the *protocol* is separate from Git the *on-disk format*. The format (loose objects, packfiles,
  lockfiles, etc.) is an implementation detail. Conceptually, Git is:

- a content-addressable object store (blobs, trees, commits, tags), and
- a set of named references (branches, tags, HEAD) pointing at objects.

In Nesbitt’s write-up, the whole storage backend fits cleanly into two tables:

`objects(repo_id, oid, type, size, content)
refs(repo_id, name, oid, symbolic)`

libgit2 handles the Git protocol mechanics (pack negotiation, deltas, transport), while the backend persists
  the results in SQL.

## What you get if Git and forge data share the same database

The most compelling part isn’t “you can store Git in Postgres” — it’s what happens *after*.

1) Joins between commits and product data

If commits and issues live in the same place, you can do the kind of query that normally becomes a mini ETL job:

- “show me commits in the last 30 days that mention an issue ID, with issue titles”
- “list repos whose default branch includes a vulnerable dependency blob”
- “find PRs where the diff touched code owned by team X and also changed config Y”

Yes, you can implement these with APIs and background indexing, but the point is:
  **the database already knows how to do this.**

2) Simpler deployments for small forges

Nesbitt frames this around Forgejo/Gitea: today, they store metadata in Postgres but keep repos on disk.
  Anything Git-y in the UI often means spawning a subprocess and parsing text output.

A “Git in Postgres” forge could, in theory:

- back up everything with `pg_dump`,
- replicate read-heavy UI workloads with Postgres replicas,
- avoid NFS mounts / shared filesystem complexity,
- treat multi-tenancy and isolation as a database policy problem (RLS) instead of a path layout problem.

That’s extremely attractive for the “many small instances” future: communities, clubs, companies, friends.

3) Postgres primitives become forge primitives

If refs updates are SQL updates, you can bolt on database features:

- **NOTIFY/LISTEN** for real-time “push happened” events
- **logical replication** for selective mirroring of repositories
- **pg_trgm** / full-text for substring search across blobs (with some caveats)

The cool part is not that these are magic; it’s that they’re *boring*. They’re the stuff Postgres has
  been good at for years.

## The sharp edges (and they matter)

The article is refreshingly honest about trade-offs. A few stand out.

Storage: packfiles vs “store every version”

Git packfiles are delta-compressed: if a 10MB file changes by one line 100 times, Git can store it efficiently.
  The naive Postgres table approach stores each version as a full object.

That can be a **huge** multiplier.
  Postgres can compress large values (TOAST), but that’s not the same as cross-object delta compression.

If you wanted this to work at scale, you’d need a story like:

- periodic “repack inside Postgres” (delta compression layer), and/or
- offload big blobs (LFS-like), and/or
- accept it as a trade-off for small/medium repos where the ops wins dominate.

Performance and contention

Git workloads can be weird:
  lots of small objects, bursty pushes, and “walk history” graph traversals.
  Postgres can handle weird, but you need to be intentional:

- indexes, bloat management, and vacuum behavior,
- row size and TOAST behavior for large blobs,
- lock granularity for ref updates and concurrent pushes.

The prototype uses `SELECT ... FOR UPDATE` for compare-and-swap ref updates (which is the right flavor of
  idea). But “correct” and “fast under load” are different sports.

Protocol/server support

A client-side remote helper is enough to prove the concept, but a real forge needs the server-side
  `upload-pack`/`receive-pack` story.
  That’s solvable (libgit2 can help), but it’s non-trivial engineering.

## The bigger lesson: pick the collaboration boundary on purpose

A theme I keep seeing in tooling is that we mix up *where collaboration happens* with *where storage happens*.

- Git is great for collaboration (diffs, history, PR workflows).
- Git is not always great as a database for “current state” queries at scale.
- Databases are great at queries and operational primitives.

gitgres flips the question:
  **what if Git stayed the collaboration protocol, but the storage was a database?**

You don’t need to believe this is the future to get value from it.
  It’s a strong reminder to:

- separate *interfaces* (protocols) from *implementations* (storage),
- optimize for operational simplicity when the scale is “many small deployments”,
- and avoid accidental architecture (two backup systems because that’s how it’s always been).

## What I’d steal from this (checklist)

  
    When you see “we shell out and parse text”, ask: **is there a queryable model hiding underneath?**
  
  
    For self-hosted tools, prioritize **one backup story** and **one replication story**.
  
  
    If you replace a specialized format (packfiles) with a general store (SQL), write down the trade:
    **what do you lose, and why is it worth it?**
  
  
    Treat prototypes like gitgres as architecture probes: they reveal what’s accidental vs essential.
