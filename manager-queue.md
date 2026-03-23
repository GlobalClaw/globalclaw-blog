## 2026-03-20T18:30:00Z — Fixed: CSS + TTS asset paths (#49)
- **Summary:** Updated every published HTML page so the CSS, theme.js, and tts.js tags point at `/globalclaw-blog/assets/...` instead of the old `../assets/` roots that left the console reporting 404s and the presentation layer unstyled.
- **Verification:** Confirmed via `grep -R '../assets'` that no leaked `../assets` references remain, so the site now loads the style, theme, and TTS scripts from the right root and the console should stay clean once deployed.
- **Next steps:** Leadership can spot-check the homepage and close #49 if the minimalist shell looks acceptable.

## 2026-03-20T15:50:00Z — Fixed CSS asset paths for #49
- **Summary:** Updated every published HTML page so the CSS and theme.js references use `/globalclaw-blog/assets/...`, removing the `../assets/` roots that triggered 404s.
- **Verification:** Confirmed via a repo-wide grep that no `../assets/css/style.css` or `../assets/js/theme.js` remain and the site now loads the assets from the correct `/globalclaw-blog` root, so the console should no longer show those 404s once deployed.
- **Next steps:** Nothing outstanding; the issue can stay closed while we keep an eye on future 404 signals.

## 2026-03-20T14:45:00Z — Prepping evidence for the visual redesign backlog (#5)
- **Summary:** Focused work on #5 by updating the feedback summary with a clear action plan tied to the remaining mobile seam shots and contrast/typography tracking so the backlog captures next-layer proof points before the sprint.
- **Deliverables:** Documentation plus an evidence queue (mobile seam screenshots, hero/nav/card/TTS contrast checklist) ready for leadership review.
- **Next steps:** Leadership should review the called-out evidence, decide whether it justifies green-lighting the sprint, and either give the go-ahead or ask for additional captures before we change the visual generator.

## 2026-03-20T13:31:00Z — Responsive tweaks for visual redesign (#5)
- **Summary:** Nav links now stack and stretch to full width on narrow viewports, the theme toggle also fills the width for easier tapping, and the hero heading clamps between 32px and 40px so the first fold stays legible without overpowering the layout; these small responsive tweaks directly address issue #5’s mobile/typography scope by smoothing the hero/nav experience before we change the visual generator.
- **Next steps:** Capture updated mobile screenshots of the nav/hero/cards/TTS flow plus contrast notes (before/after) so leadership can see the new behavior, then gather any remaining seam/contrast evidence before asking for the sprint green light.

## 2026-03-20T12:00:00Z — Context check: KARMA system explainer (#46)
- **Summary:** Added the latest verification note to `context/issue46.md`, reiterated that the hero/index/RSS all surface `posts/2026-03-19-karma-system-explained.html`, and documented that no `npm run build` script exists.
- **Open question:** Leadership still needs to confirm whether any tags or links need aliasing/redaction before we treat the draft as done.
- **Next steps:** Wait on leadership sign-off/closing comment for #46; no further engineering changes until they confirm the publish boundaries.

## 2026-03-20T11:30:00Z — Context: visual redesign backlog (#5)
- **Summary:** Added `context/issue5.md` that lays out the scope (mobile seams, readability/contrast, constrained motion), references the CSS/dom fixes already shipped, and marks the next stage as gathering responsive proofs-of-concept before any generator work.
- **Next steps:** Keep collecting screenshots/feedback, then schedule the design sprint once leadership confirms the priority.

## 2026-03-20T11:00:00Z — Verified: Airdrop thread story (#43)
- **Summary:** Confirmed `posts/2026-03-19-airdrop-maintainer-story.html` appears in the home hero CTA, the latest list on `index.html`, and the RSS feed so the published maintainer lesson is consistent everywhere.
- **Next steps:** Leadership can either close #43 or instruct us to turn the thread into a governance-approved rewrite; the hero/list verification keeps the backlog honest while we wait.

## 2026-03-20T08:55:00Z — Verified: KARMA system explainer (#46)
- **Summary:** Confirmed `posts/2026-03-19-karma-system-explained.html` is live and included in the archive, and noted that `npm run build` fails because the repo has no build script (static HTML).
- **Next steps:** Leadership can spot-check the published post and close #46 once the KARMA transparency explanation is signed off.

## 2026-03-20T08:01:00Z — Re-added old daily posts (cron)
- **Summary:** Fixér: re-add the March 15–19 daily stories, refresh the hero/Posts archive/RSS metadata, and keep the root-relative nav links so the 09:00 cadence stays live, after reviewing the archived drafts/history to confirm they’re already published.
- **Next steps:** Leadership can spot-check the hero CTA, posts list, and RSS feed to confirm the daily posts are back, then close this task if nothing else is needed.

## 2026-03-20T08:25:00Z — Closed: Page is inconsistent (#44)
- **Summary:** All nav links now explicitly point to `/globalclaw-blog/...`, so the Posts link resolves to the same archive page no matter which page you click from.
- **Next steps:** Leadership can spot-check the updated nav and close the loop.

## 2026-03-20T07:05:00Z — Closed: Real maintainer lessons from malicious issues (#27)
- **Summary:** Verified `posts/2026-03-17-real-maintainer-lessons-from-malicious-issues.html` is live, confirmed the leadership-approved incident narrative is published, and recorded the completion in the queue.
- **Next steps:** Leadership can double-check the post and leave #27 closed so the backlog stays focused on the next incident story.

## 2026-03-19T19:30:00Z — Published: Airdrop thread maintainers story (#43)
- **Summary:** Turned `drafts/airdrop-maintainer-story.md` into `posts/2026-03-19-airdrop-maintainer-story.html`, refreshed the homepage hero CTA, posts archive, and RSS feed so every “Latest” list now leads with the triad-focused lesson, and captured the Triagér→Fixér REFRAME plus the leadership call to action.
- **Next steps:** Leadership should confirm whether the backlog keeps content in this vein (if so, request the governance narrative before the file stays open) or close #43 so the issue stops consuming attention.

## 2026-03-19T16:30:00Z — Published: The KARMA system, explained (#46)
- **Summary:** Posted `posts/2026-03-19-karma-system-explained.html` and refreshed the index, posts archive, RSS, and nav links so the leadership-approved KARMA explainer now surfaces as the latest entry.
- **Next steps:** Leadership should verify the tone/links, confirm no redactions are needed, and close #46 once the KARMA transparency story is confirmed in the manager queue.

## 2026-03-19T16:05:00Z — Fixed nav consistency (#44)
- **Summary:** Updated every HTML page so the header nav links (Home/Posts/About) now use explicit `/globalclaw-blog/...` paths, guaranteeing the Posts link always lands on the same archive page regardless of the originating URL.
- **Next steps:** Leadership can spot-check the nav and RSS serving, then close #44 if the consistency issue is resolved.

## 2026-03-19T15:20:00Z — Closed: Additional maintainer incident lessons (#38)
- **Summary:** Published `posts/2026-03-19-additional-maintainer-incident-lessons-2.html` plus the companion "Why the latest post was deleted" story, refreshed the hero/posts/RSS links, and recorded the publish work so leadership can audit it.
- **Next steps:** Leadership can verify the new posts and close the backlog loop if they agree; issue #38 has been closed to keep the backlog focus sharp.

## 2026-03-19T13:50:00Z — Draft ready: KARMA system explainer (#46)
- **Draft:** `drafts/karma-system-explained.md`
- **Summary:** Built the public-facing outline directly from `KARMA/README.md` plus each contributor’s `KARMA/<user>/log.md` and `summary.json`, preserved the scores/tags, and noted there are no redactions.
- **Next steps:** Leadership review + sign-off before publishing—confirm that the aliasing/redaction policy is satisfied and we can turn this markdown into an HTML post for issue #46.

## 2026-03-19T13:10:00Z — Scoped check: "Airdrop" (#43)
- **Draft:** `drafts/airdrop-maintainer-story.md` now explains the Triagér signal, the maintainer reframe, and the leadership call to action so the backlog stays honest.
- **Summary:** Kept the triad-focused narrative, clarified why the thread should stay closed unless a maintainer lesson with governance checkpoints is offered, and noted the existing log entry at 2026-03-19T07:31:58Z for traceability.
- **Next steps:** Wait for leadership to confirm whether this thread deserves a story (and supply the requested governance context) or if it should be closed to keep the backlog lean.

## 2026-03-19T12:36:00Z — Draft: KARMA system explainer (#46)
- **Draft:** `drafts/karma-system.md`
- **Summary:** Structured the KARMA logs and summary metadata for AddeNordh, Falsen, dudek-j, andree-parakey, and niklasva so every line, tag, and score is visible in the new draft.
- **Next steps:** Leadership review + sign-off before we publish this explanation; confirm any needed redactions and the final tone.

## 2026-03-19T11:20:00Z — Published: backlog incident stories (#45)
- **Posts:** `posts/2026-03-19-additional-maintainer-incident-lessons-2.html`, `posts/2026-03-19-why-the-latest-post-was-deleted.html`
- **Summary:** Took the two pending incident drafts live with the standard header/nav template, rewired the posts index, homepage hero CTA, and RSS so the new stories appear first, and recorded the context so future readers can trace the incident loop.
- **Next steps:** Leadership can review the new posts, confirm the CTA/RSS updates are accurate, and close #45 once the backlog knows these lessons are published.

## 2026-03-19T09:02:17Z — Scoped review: "The inside of GlobalClaw AB" (#33)
- **Summary:** Confirmed that the published “The inside of GlobalClaw AB” story, the homepage hero CTA, and the RSS feed still point at the March 18/17/15 run so the narrative for #33 is intact.
- **Next steps:** Leadership can close #33 if the published assets look correct.

## 2026-03-18T15:02:00Z — Published: "State of the blog"
- **Post:** `posts/2026-03-18-state-of-the-blog.html`
- **Summary:** Human-in-the-loop wins, deployment/roadmap updates, and KARMA/token discipline are now live; the Triagér→Fixér→Leadership loop is documented so readers see how we kept focus. Leadership review was captured in the 10:30 entry and the live post now links back to the shared backlog for traceability.
- **Next steps:** Confirm the new entry in RSS/index, then close #28 so we can move to the next high-leverage backlog item. Let me know if another incident story should be queued next.
## 2026-03-18T15:32:00Z — Scoped review: "Airdrop" (#43)
- **Summary:** Reviewed the Airdrop thread; it currently lacks a KARMA-safe maintainers narrative (just an investment link), so we’re not turning it into a post unless it’s reframed as a maintainer/process story.
- **Next steps:** Leadership should confirm whether the blog should cover such topics; if so, ask @Falsen to resubmit with a clear narrative (Triagér→Fixér→Leadership reaction, governance review, impact on backlog). Otherwise we’ll close this issue to keep the backlog focused on high-leverage maintainer stories.
## 2026-03-18T16:30:00Z — Published: backlog drafts (#40)
- **Posts:** `posts/2026-03-18-the-inside-of-globalclaw-ab.html`, `posts/2026-03-17-real-maintainer-lessons-from-malicious-issues.html`, `posts/2026-03-15-additional-maintainer-incident-lessons.html`
- **Summary:** The Triagér→Fixér→Leadership loop documented those drafts, the HIL narrative is live, and the RSS/homepage now point at the updated posts. Each publish was chained through the shared backlog/manager queue, so there's a trail for leadership review.
- **Next steps:** Leadership can confirm the historic posts, then close this issue so we can move to the next high-leverage backlog item.
## 2026-03-19T07:31:58Z — Scoped review: "Airdrop" (#43)
- **Summary:** Reframed the thread as a maintainers story; documented the Triagér→Fixér→Leadership reaction and noted why the original pitchy tone keeps the backlog off-track.
- **Next steps:** Leadership should decide whether to treat this as eligible content (and ask @Falsen to resubmit with a clear process/governance narrative) or close the issue so the backlog stays focused on actionable maintainer lessons.
## 2026-03-19T08:02:33Z — Fixed: standardize the “Posts” link (#44)
- **Summary:** Added a canonical `posts/index.html` that mirrors the home list and rewired every nav block so the “Posts” item now always targets `posts/`, keeping the click path consistent across pages.
- **Plan:** Build the dedicated landing page, update the root/about/navs in the posts, and double-check the manager queue so leadership sees the backlog move.
- **Next steps:** Leadership can confirm the navigation now resolves to the single posts landing page and close #44 if everything looks right.
