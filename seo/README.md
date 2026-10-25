# SEO plan: Evergreen City Community Church

How search works for a church: Google decides *who* a result is about (the website),
*where it is* (Google Business Profile, address, maps), and *whether it can be trusted*
(links and mentions from other places, reviews). The website can only do the first
part. The other two are done off the website, and they decide the "church near me" results.

## What the website now does (done, live)
| Area | What was fixed or added |
|---|---|
| Crawling | `robots.txt` and `sitemap.xml` (there were none). The sitemap lists only real pages. Hidden pages are left out. |
| Titles and descriptions | Every page has its own title and description, written around the searches below, kept to search-result length. |
| Duplicates | A "canonical" address on every page, so `www.` and other variants don't compete with the real address. |
| Structured data | The church (name, address, Sunday hours, languages, founders, profiles), the website, each page's breadcrumbs, the FAQ on the visit page, and **both pastors as people** (with the spellings Presty, Presti, Ps., Pastor). |
| Pastor page | New page `/pastors` for "Pastor Presty Varghese" and "Pastor Sheba Mathew". |
| Local words | A "church near Technopark, in Kazhakootam" section on the visit page, and the address under the closing call to action on Home and About. The spelling variants Kazhakkoottam and Kazhakuttom appear once, naturally. |
| Headings | One main heading (H1) per page. The welcome screen was adding a second one on every page. |
| Welcome screen | People who arrive from a search engine skip it. A full-screen welcome in front of a search result can lower rankings on phones. Direct, WhatsApp and Instagram visitors still see it. |
| Language | `en-IN` (English, India). |
| Sharing | Complete Open Graph and Twitter cards on every page. Logo, favicon and web manifest added. |
| Speed | Already good (Lighthouse performance 95, accessibility 100). Re-checked after changes. |

## Which page answers which search
| Someone searches | The page that should rank | Why it should |
|---|---|---|
| Evergreen City Community / Evergreen City Community Church | Home | Exact name in title, description, schema and every page |
| church in Trivandrum / Thiruvananthapuram, English church Trivandrum | Home + Visit | Title and description, local section, address everywhere |
| church in Kazhakootam (also Kazhakkoottam, Kazhakuttom) | Visit (`/location`) | Title, H1 area, local section, FAQ |
| church near Technopark | Visit and Home | "near Technopark" in title/description/local section/closing line |
| Sunday service Trivandrum | Visit | Times, address, hours markup |
| Pastor Presty Varghese / Pastor Presty / Pastor Presti | `/pastors` | Dedicated page, person markup, title starts with his name |
| Pastor Sheba Mathew | `/pastors` | Same |

## What no website can do alone (this is where "near me" is won)
1. **Google Business Profile**: the single biggest lever for "church near me". See `google-business-profile.md`. Needs the church to verify it. **Start today.**
2. **Search Console + Bing**: tells Google and Bing the site exists and shows exactly what people searched. See `search-console-and-bing.md`.
3. **Links and listings from other sites**, plus reviews. See `links-and-citations.md`.
4. **Fresh, useful content**: a page per message (title, summary, verse), Christmas and Easter service pages, a few honest "what to expect" guides. Search engines reward a site that keeps living.

## Realistic expectations (no honest SEO person can promise rankings)
| Goal | Realistic timing |
|---|---|
| "Evergreen City Community" first | Days to a few weeks after Google indexes the site. Nothing else competes with that exact name (only unrelated American "Evergreen Community Church" results). |
| "Pastor Presty Varghese" first | A few weeks after `/pastors` is indexed. |
| "church in Kazhakootam" / "church near Technopark" in the top results | 1 to 3 months, mainly through the Business Profile and reviews. |
| "church in Trivandrum" in the local map results | 2 to 4 months with an active Profile and reviews. This is the most competitive, and the Profile matters more than the website here. |
| "church in Trivandrum" in the ordinary results | 6 to 12 months, driven by links and content. |

## Still needed to finish the on-site markup
- The **map coordinates** (open the church in Google Maps, right-click the pin, copy the two numbers). Add them in `lib/seo.ts` (`geo`). *(The address and PIN 695582 are done: 3rd Floor, Legacy House, Opp Ambrosia, Kazhakootam, Trivandrum, Kerala 695582, identical on the website and the Business Profile.)*
- A **church phone number**, if one should be public (`telephone` in `lib/seo.ts`).
- The Search Console and Bing verification codes (see `search-console-and-bing.md`).

## 30 / 60 / 90 days
- **Week 1:** Business Profile created and verification started. Search Console and Bing added, sitemap submitted. Apple Maps listing. Church name, address and links made identical on YouTube, Instagram, Spotify and Facebook.
- **Weeks 2 to 4:** Reviews from the congregation (honest, voluntary). 5 to 8 directory listings. Ask partner churches and The NET to link to the site. Weekly Profile post.
- **Month 2:** First message pages (one per recent message). Christmas service page. Photos added to the Profile.
- **Month 3:** Review Search Console: which searches bring people, which pages are ignored. Fix and extend. Repeat.

## How to tell it is working
Search Console (impressions and clicks for each search), the Business Profile dashboard (calls, directions, website visits), and checking these searches monthly in a private window from a phone in Trivandrum.
