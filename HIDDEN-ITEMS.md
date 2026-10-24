# Hidden items checklist (as of 25 Oct 2026)

Nothing unfinished is visible on evergreencitycommunity.com or the demo link.
Each item below is switched off, not deleted. When ECC sends the content, bring
it back with the steps in the last column (details in `UPDATING.md`).

| # | Hidden item | Where it would appear | What's needed from ECC | To bring it back |
|---|---|---|---|---|
| 1 | **Stories of transformation** | Home, after "Real people. Real Sundays." | 3 stories: text, first name, photo, and permission to share | Add them in `lib/stories.ts` (photos in `public/images/stories/`). The section appears with the first real story. |
| 2 | **Life groups photos** | About, Life at ECC strip | Photos of life groups | Add the photo to the `LIFE` list in `app/about/page.tsx`, caption "Life groups". |
| 3 | **Women's fellowship photos** | About, Life at ECC strip | Photos of the women's fellowship | Same list, caption "Women's fellowship". |
| 4 | **One more Spotify episode** | Messages "Start here" and Home strip | Which episode to feature | Add it in `lib/listen.ts` (a new pick). |
| 5 | **Vision video ("Hear it from us")** | About, above the beliefs | The new vision video (YouTube link) | In `lib/site.ts` set `VISION_VIDEO.id` to the new video's id and `ready: true`. |
| 6 | **Next Steps page (`/next`) and its QR code** | Opened by the QR on Sunday's slide/cards | The Google Form link, the list of next steps, and the person who follows up | Put the form link in `NEXT_STEPS.formUrl` in `lib/site.ts`. Until then `/next` shows "page not found". The QR, slide and A6 card are in `print/next-steps/`. |
| 7 | **Play: Fishers of Men games** (5 games, scoreboard, "Powered by The NET") | Home section, footer link, `/fishers` pages | A launch decision | Set `PLAY_ENABLED` to true in `lib/flags.ts` (or env `NEXT_PUBLIC_PLAY_ENABLED=1`). Until then `/fishers` shows "page not found". |

## Already filled in (not hidden)
- WhatsApp number (+91 96647 19827), faith statement PDF, welcome narration (real recording),
  two recent videos on Messages, Men's fellowship / Youth / Independence Day photos.

## Still to swap, but the current version is real and stays visible
- A new photo of Presty and Sheba together (Home + About): replace `public/images/pastors.jpg`.
- More updated church photos on Home: add to `PHOTOS` in `app/page.tsx`.

## One switch for previews
`NEXT_PUBLIC_SHOW_PLACEHOLDERS=1` (private preview only) shows labelled stand-ins for items 1-4 and 6
so you can see where each will go. It is off everywhere by default.
