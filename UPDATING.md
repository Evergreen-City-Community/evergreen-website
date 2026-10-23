# Updating the ECC site: where each thing lives

Placeholders (dashed, labelled "Placeholder") appear on previews and the demo link
only. On the live production site those sections simply don't show until real
content is added.

| What | Where | How |
| --- | --- | --- |
| Stories of transformation (Home) | `lib/stories.ts` | Add a `{ quote, name, detail, photo }` entry; put the photo in `public/images/stories/`. The first real story removes the placeholders. |
| Pastors' photo (Home + About) | `public/images/pastors.jpg` | Replace the file, same name. |
| More church photos (Home, "Real people. Real Sundays.") | `PHOTOS` in `app/page.tsx` | Add the image to `public/images/community/` and a line to the list. |
| Vision video (About) | `YouTubeLite id=...` in `app/about/page.tsx` | Change the YouTube id. |
| Faith statement PDF (About) | `public/docs/ecc-faith-statement.pdf` + `FAITH_STATEMENT` in `lib/site.ts` | Replace the file (same name), set `ready: true`. |
| Life at ECC photos (About) | `LIFE` in `app/about/page.tsx` | Add a photo line with an optional caption; delete the placeholder lines when real photos arrive. |
| Home "Start here" + Messages first listens | `lib/listen.ts` | Change the Spotify episode links and the featured video. |
| Spotify player (Messages) | `LATEST_EPISODE` in `lib/listen.ts` | Paste the newest episode id. |
| Recent videos (Messages) | `lib/recent-videos.ts` | Paste a YouTube link and a title at the top of the list. Keep it short and recent. |
| Next Steps form (/next) | `NEXT_STEPS.formUrl` in `lib/site.ts` | Paste the Google Form link; the page's button opens it. |
| WhatsApp number | `LINKS.whatsapp` in `lib/site.ts` | e.g. `https://wa.me/91XXXXXXXXXX` |
| Play / Fishers of Men games | `PLAY_ENABLED` in `lib/flags.ts` (env `NEXT_PUBLIC_PLAY_ENABLED=1`) | Off: hidden and kept out of search. On: Home section, footer link and The NET credit return. |

The QR code, slide and print card for /next are in `print/next-steps/`. They point at
https://evergreencitycommunity.com/next, so that address must stay the same.
