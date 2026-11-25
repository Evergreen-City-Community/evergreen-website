# Updating the ECC site: where each thing lives

Anything not ready yet is hidden on every site (see `HIDDEN-ITEMS.md` for the
full checklist). Sections simply don't show until real content is added.

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
| WhatsApp number | `LINKS.whatsapp` in `lib/site.ts` | Set to +91 96647 19827. Change it there and every WhatsApp button follows. |
| Bible Quiz: Road to Bethlehem (/biblequiz, a separate page that is not linked from the main site) | `lib/bible-quiz/config.ts`, `content.ts` and `content-rounds.ts` | Change the start/last dates in `config.ts` (play opens on `start`, closes after `last`; before `start` the page shows a countdown); edit puzzles in `content.ts` (word, person) and `content-rounds.ts` (5 quick questions a day). Each player gets their own shuffled order of the word, person and question lists, so keep at least as many entries as days (the page shows "over" if they run out). Answers and scores are kept on the server. |
| Bible Quiz leaderboard (setup) | Vercel → Project → Settings → Environment Variables | Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or connect Upstash from the Vercel Marketplace, which adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`) and `BQ_ADMIN_PASSWORD`, for Production and Preview. Never put these in the repo. Organisers open `/biblequiz/admin` and enter the password to see the top players and their contact details. Production and Preview use separate data (`bq:prod:` and `bq:test:`). |
| Play / Fishers of Men games | `PLAY_ENABLED` in `lib/flags.ts` (env `NEXT_PUBLIC_PLAY_ENABLED=1`) | Off: hidden and kept out of search. On: Home section, footer link and The NET credit return. |

The QR code, slide and print card for /next are in `print/next-steps/`. They point at
https://evergreencitycommunity.com/next, so that address must stay the same.
