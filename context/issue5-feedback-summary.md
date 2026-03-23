# Issue #5: Visual redesign backlog feedback summary

## Why this matters
Issue #5 is our umbrella for the future visual redesign: it covers the mobile seam glitches, typographic/contrast refresh, and reduced-motion/readability guardrails noted across the February sprint. With the CSS fixes shipped, the next step is to gather the remaining mobile/contrast feedback so we can show leadership a consolidated picture before any larger design sprint is scheduled.

## Action plan
- Collect the remaining mobile seam screenshots cited in the backlog so we can show before/after evidence of the hero/nav/card/TTS stack on real devices.
- Track a contrast/typography checklist for the hero, nav, cards, and TTS player so the leadership sprint intake shows which components still need fine-tuning.
- Keep this documentation live so the backlog stays ready for the leadership sprint decision once they have the evidence queue in hand.


## Mobile / rendering feedback collected so far
- The February CSS sweep already addressed the “card clipping” and mobile background seam artifacts that were reported in the tracker (see the note in `context/issue5.md` and the commits `Avoid mobile background seam artifacts` / `Fix mobile background seam; add random Turing laureate post`).
- We still need to collect and catalog the remaining mobile/seam screenshots from the contexts mentioned in the backlog so they can be reviewed as part of the design sprint intake. As noted in `context/issue5.md`, those images will prove whether the current layout needs additional responsive tweaks before we change the visual generator.
- In practice, the remaining seam feedback is the primary blocker for leadership to green-light the sprint, so I’ll keep gathering fresh device-specific proof points and flag any regressions or novel artifacts that arrive in the next few days.

## Contrast / typography / readability feedback
- The high-contrast theme tracked in issue #8 is shipped and tuned (see the KARMA log entry: `implemented larger typography in high-contrast mode and requested re-test`, plus the follow-up that closed #8). Text size, line height, and background balance were all updated, and the theme toggle now targets WCAG-friendly contrast levels without altering the default aesthetic.
- Additional accessibility ideas spawned from the #8 conversation were split into their own follow-ups: issue #13 for text-to-speech playback (sticky/larger “Listen” control, no autoplay) and issue #15 for the optional dyslexia-friendly font. Keeping these separate keeps #5/ #8 focused on contrast while still surfacing the broader accessibility wishlist.
- We’ve also noted user feedback that the Theme toggle should stay prominent and the contrast helpers should be responsive (e.g., suggestions to expose extra-large text and confirm the toggle is keyboard/screen reader friendly). Those will be part of the next typography/contrast proof-of-concept package.

### Automated contrast audit
- Added `scripts/contrast-check.js` so we can recompute WCAG ratios for the hero text, meta text, TTS player, and the `a11y-ry` theme whenever the palette or typography changes. Run `node scripts/contrast-check.js` from the repo root to see the latest report (standard theme hero text is 16.01:1, muted text 9.02:1, TTS player text 12.99:1 after blending the translucent card background with the body color, and the high-contrast theme clocks in at 6.02:1 body text plus 9.38:1 muted text on yellow). The script also labels each ratio with its AA/AAA pass/fail status, so we can keep the component contrast checklist honest.
- Because the tool already factors in the translucent TTS-card overlay and spits out reminders when anything drops below 4.5:1 for normal text, it becomes a stable data point for the leadership sprint intake—drop new color tokens into the script to verify they still meet the threshold before shipping.

## Component check
- **Nav & theme toggle** – the nav links now stack on narrow viewports and the theme toggle stretches full width so the controls are easier to tap; capture before/after mobile screenshots so leadership can see the new stacking and confirm the contrast treatment still looks intentional.
- **Hero** – the heading now clamps between 32px and 40px so it scales gracefully alongside the rest of the text; log any mobile/contrast screenshots showing how the headline, background, and CTA buttons reorganize before we move into a broader redesign.
- **Cards** – the existing card treatment already leans on flexible padding/shadow, but keep collecting device-specific proof points of how they render once the nav and hero settle down so we can flag any remaining clipping or contrast issues.
- **TTS player** – the sticky player stays compact on desktop and already switches to a full-width band on small screens; keep wiring up contrast mobile captures so we can prove it doesn’t overlap or obscure the new nav/hero stack.

## Outstanding notes to keep tracking
1. **Remaining mobile seam screenshots** – collect from QA devices (especially the gradient-heavy hero cards and nav background) so we can show “before/after” pairs once leadership approves the sprint.
2. **Component contrast checklist** – list which cards, navs, hero text, and post bodies still need refreshed typography/contrast ratios beyond the high-contrast mode.
3. **Responsive navigation/typography proofs** – capture quick mocks or CSS notes that show how we’d handle navigation wrapping and text scaling before generator work begins.
4. **Dyslexic font request (issue #15)** – keep an eye on any additional suggestions there; it remains optional but could be bundled into the contrast proof pack depending on leadership feedback.
5. **Mobile / reduced motion constraints** – document if we hear about other motion/animation issues so we can include them in the sprint charter.

## Next steps while we wait
- Continue collecting new mobile/contrast feedback and drop it into this summary so the backlog stays up to date.
- Once leadership confirms the next sprint window, we can use the collected evidence to define the scope (screenshots + component checklist + responsive typography notes) before touching any visual-generator work.
- Let me know if you want me to start drafting the sprint intake description now; otherwise I’ll keep this summary live and update it whenever fresh feedback arrives.
