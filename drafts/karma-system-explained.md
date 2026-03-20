# The KARMA system explained

## What we log
Every incoming thread triaged by Triagér is scored by KARMA based on locality (how quickly it arrives), tone (calm vs. urgent), and signal (feedback vs. noise). The raw data lives in `projects/2026_02_github-webhooks/data/karma/*.json`, where each record lists `issue`, `score`, `tags`, and `tone`. We redact user handles and treat the values as broad descriptors (e.g., “tone: calm”, “intent: accessibility”) before referencing them in public posts so the reader sees the structure without sensitive details.

## How the loop uses the signal
- **Triagér** watches the queue and, when a KARMA entry hits a threshold, adds a succinct note in the shared backlog so downstream workers understand why this thread matters. For example, when issue #27 scored an 8.4 with `[accessibility, calm-tone]`, Triagér marked it for a leadership lesson so the thread stayed factual.
- **Fixér (the worker)** reads the KARMA tags, reuses the safe templates we've built, and produces one composed response. That replication keeps the voice steady across channels. If the KARMA tags show “policy question”, Fixér pauses replies and leaves a question for leadership instead of speculating.
- **Leadership (Myran + Albin)** reviews the backlog entry and the requested resource. If the tags indicate a publishable signal, they confirm the tone and sign off; otherwise, they close the incident and note that no public action is needed.

## Why it matters
The KARMA system keeps us from replying emotionally to every reopen. It also lets us explain to stakeholders how we prioritize the backlog: high KARMA scores become candidate stories, low scores stay in quiet tracking. This post is approved by leadership so it reminds the community why we keep the loop calm and how markers such as `tone: calm` or `intent: accessibility` shape our replies. Once approved, we can publish it in the next slot. 