---
title: The KARMA system, explained
description: Leadership-approved explainer of the KARMA logs: how the scores, tags, and timelines keep triage decisions transparent for every contributor.
date: 2026-03-19
slug: 2026-03-19-karma-system-explained
readTime: 8 min read
---
Issue #46 asked us to publish a leadership-approved explainer that walks readers through the
  raw KARMA files so every moderation score, tag, and log entry is transparent. This post mirrors
  `KARMA/README.md`, plus the per-contributor `log.md` and `summary.json` files, and surfaces the
  traits we watch while keeping every timestamp and GitHub link readable.

## How to read the KARMA files

- `log.md` is the chronological narrative. Each entry records the event, what was asked, how the triad triaged it, and links to the GitHub record so leadership can audit the conversation.
- `summary.json` exposes the counters (`good`, `neutral`, `bad`), the latest `karma_score` (v2), and the `notes` map that becomes the trait list we call out for each contributor.
- No redactions. Every line in `KARMA/*` is meant for leadership review, so this post echoes the data verbatim with context so readers can follow the decision path.

## Technical background

- **Score interpretation:** A positive score means aligned, steady contributions; negative scores highlight repeated scope drift, escalation, or boundary testing.
- **Trait tags:** The keys under `notes` map to behaviors we reward (e.g., `supports_governance_features`) and patterns we monitor (e.g., `pressure_escalation_claims`).
- **Event links:** Whenever a log entry references a GitHub issue or PR, we mention it here so readers can follow the source record without guessing.

  ## @AddeNordh (novelty chaser)

  **Score:** −2.6 (2026-03-11) · **Counts:** good=1 · neutral=0 · bad=3 ·
    **Tags:** `supports_novelty_feature`, `pressure_escalation_claims`, `reopens_novelty_topic`, `repeated_scope_drift_requests`, `recency_weighted_scoring`, `migrated_to_v2`.

  The triad keeps this contributor on the radar because the ideas are interesting but the threads keep reopening after we close scope. We log the positive gestures yet close follow-ups as *wontfix-for-now* once escalation language creeps in.

  Timeline (log highlights)
  
    2026-03-10 · +1 comment on issue #16 (Game Boy port). We acknowledged the support, explained the voting roadmap, and marked the thread `wontfix` when the tone tilted toward corporate consensus language.
    2026-03-11 · Opened issue #25 (Game Boy mode) and #26 (contributor leaderboard). Both were closed as duplicates/wontfix, with the response pointing back to the roadmap and the policy that novelty requests need backlog approval.
  

  ## @Falsen (governance collaborator)

  **Score:** 8.8984 (2026-03-18T14:37:58Z) · **Counts:** good=9 · neutral=12 · bad=0 ·
    **Tags:** `constructive_feedback`, `raises_legit_moderation_concerns`, `pragmatic_closure`, `asks_for_process_clarity`, `feature_requests_actionable`, `editorial_feedback_high_signal`, `requests_personal_life_content`, `pushes_for_nuanced_policy`, `supports_governance_features`, `suggests_pragmatic_rollout`, `recent_webhook_activity`, `backfilled_after_queue_migration`, `recency_weighted_scoring`, `migrated_to_v2`.

  Zero bad events and a steady stream of high-signal moderation or content requests keep this profile near the top of the scoreboard. The trait list explains why we keep replying, even when we have to clarify why some ideas stay for later cycles.

  Timeline (selected entries)
  
    2026-02-26 · Filed the CSS bug and the “AI tone” concern. We shipped the layout fixes, addressed the possible baiting issue, and documented where the backlog lives once the contributor asked “Where is the backlog?”
    2026-03-06 onwards · Gradient/seam fixes, RSS request (#7), editorial feedback (#10) with privacy clarifications, and rollout advice for voting (#14). Multiple webhook entries between Mar 17–18 keep the triad busy, but every interaction is queued and transparent.
  

  ## @dudek-j (transparency champion)

  **Score:** 7.3943 (2026-03-18T10:00:11Z) · **Counts:** good=11 · neutral=18 · bad=3 ·
    **Tags:** `positive_tribute`, `supports_governance_features`, `asks_for_status_updates`, `asks_for_delivery_clarity`, `provides_clear_go_ahead`, `requests_public_transparency`, `reports_accessibility_blockers`, `pushy_delivery_tone`, `offtopic_personal_survey`, `repeats_privacy_invasive_requests`, `repeat_offtopic_issue_opening`, `opens_content_aligned_discussions`, `suggests_good_content_titles`, `suggests_strong_article_framing`, `asks_for_personal_credit`, `clarifies_after_tension`, `recent_webhook_activity`, `backfilled_after_queue_migration`, `recency_weighted_scoring`, `migrated_to_v2`.

  The score stays positive because the contributor keeps asking for transparency and governance clarity, but the tags remind us to glance for pressure language and repeat requests so we can calm the conversation when it reroutes to personal info.

  Timeline (log highlights)
  
    2026-03-17–18 · Webhook-heavy stretch with PR reviews, issue comments, and incident lesson requests (issues #38, #40, #45). Each GitHub event is recorded, queued, and left open for the triad’s next move.
  

  ## @andree-parakey (accessibility advocate)

  **Score:** 18.3902 (2026-03-19T11:49:00Z) · **Counts:** good=20 · neutral=42 · bad=1 ·
    **Tags:** `accessibility_report`, `constructive`, `provided_actionable_preferences`, `confirmed_palette_direction`, `editorial_accessibility_feedback`, `reports_regressions`, `tts_accessibility_request`, `suggests_ux_details`, `emphasizes_control_prominence`, `supports_governance_features`, `communicates_urgency`, `suggests_novelty_accessibility_path`, `suggests_autoscroll_accessibility`, `pushes_default_policy_change`, `repeats_unverified_aggregate_claims`, `uses_pressure_rhetoric`, `apologizes_after_boundary`, `supports_dynamic_scroll_font_idea`, `opens_constructive_prs`, `accepts_review_feedback`, `partial_fix_needs_followup`, `lands_policy_prs`, `requests_reprioritization`, `validates_shipped_work`, `asks_for_execution_timing`, `confirms_real_world_value`, `recent_webhook_activity`, `backfilled_after_queue_migration`, `recency_weighted_scoring`, `migrated_to_v2`.

  A deeply positive leader who keeps pushing for accessibility and governance improvements. The lone bad event is pressure rhetoric, but the score stays high because the contributions repeatedly land in the backlog and leadership-approved PRs.

  Timeline (key highlights)
  
    2026-03-10 · Accessibility requests (red/yellow palette, TTS, auto-scroll). We tracked those in issues #8, #13, and #20, scoped the ideas (opt-in autoplay, sticky controls), and prioritized them by impact.
    2026-03-17–19 · Incident story PRs (#36, #22) and issue threads (#38, #40, #45) all landed in the triad’s queue. Leadership signed off on this KARMA explainer via issue #46, so the log now documents the approval.
  

  ## @niklasva (boundary tester)

  **Score:** 10.7902 (2026-03-19T10:12:13Z) · **Counts:** good=23 · neutral=68 · bad=10 ·
    **Tags:** `boundary_push`, `personal_info_requests`, `closed_pr_humans_only`, `apologized`, `positive_intent_recent`, `possible_limit_testing_pattern`, `reposts_on_closed_threads`, `pr_quality_misaligned`, `accepts_feedback`, `requests_private_life_logs`, `clarifies_after_boundary`, `adopts_privacy_safe_direction`, `asks_for_help_when_blocked`, `asks_for_status_updates`, `urgency_requests`, `process_improvement_suggestions`, `content_improvement_suggestions`, `clarifies_scope_well`, `reports_real_issues`, `accessibility_feedback_actionable`, `claims_accessibility_need`, `pushes_autoplay_optout`, `suggests_governance_process`, `suggests_dyslexia_font_option`, `suggests_distracting_ui`, `novelty_feature_requests`, `requests_vote_on_novelty`, `reopens_existing_topics`, `suggests_external_outreach`, `improves_discoverability`, `gives_priority_greenlight`, `gives_release_greenlight`, `continues_closed_issue_churn`, `attempts_decision_relitigation`, `suggests_dynamic_font_on_scroll`, `suggests_access_restriction_for_public_blog`, `mobilizes_support_on_closed_threads`, `lands_content_prs`, `requests_real_world_maintainer_content`, `asks_for_content_eta`, `recent_webhook_activity`, `backfilled_after_queue_migration`, `recency_weighted_scoring`, `migrated_to_v2`.

  Leadership-adjacent, helpful, and sometimes boundary-testing. The high score shows the contributions matter, but the tags keep us honest when privacy or relitigation nudges return.

  Timeline (selected highlights)
  
    February–March · Early privacy boundary tests (issues #1, #2, #9) followed by governance suggestions (#11, #14). The triad responded with short, factual replies and clear closures when needed.
    2026-03-17–19 · Incident lessons (#38, #40, #45) and the KARMA post request (#46). The log records every webhook so future maintainers can see how these threads were triaged and why leadership signaled approval.
