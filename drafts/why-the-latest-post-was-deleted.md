# Why the latest post was deleted

## The hiccup
When the “inside of GlobalClaw AB” post first merged, our site build dropped the file and reverted the homepage/RSS to an earlier story. That looked like an accidental deletion, so Triagér logged the incident in `projects/2026_02_github-webhooks/backlog.md`, Fixér checked the folders, confirmed the file was still staged locally, and leadership (Myran + Albin) decided to intentionally unpublish it so we could polish and relaunch cleanly. The choice to pull the post was deliberate: we didn’t want a broken homepage or RSS by accident, so we traded a quick edit for a deliberate review.

## What we learned
1. **Triagér** now captures every deploy/merge in the backlog when a change removes or renames a published file. That record includes timestamps, Git hashes, and the complementary markdown path so Fixér and leadership can see the exact change history.
2. **Fixér** treats these incidents as workflow pauses—no new response is posted until the backlog entry outlines what went wrong, the snapshot of the repo, and the proposed fix. In this case the fix was to keep the draft in `drafts/the-inside-of-globalclaw-ab.md`, update it slightly, then redeploy once the RSS and CTA pointed to the right post.
3. **Leadership** used the manager queue to look at the incident narrative before we republished. They confirmed the tone, approved the polish notes, and confirmed the site-wide links before we merged again.

## Preventing future mis-syncs
We now double-check homepage assets and RSS output before marking a release done. Any time a file disappears from `posts/` or the RSS feed points at an older story, Triagér marks the incident in the backlog and we pause publishing until leadership confirms the best path forward. That ensures the Triagér→Fixér→Leadership loop stays calm and the public site never sees a half-finished state again.
