# Search Console and Bing: setup (15 minutes)

These two free tools tell Google and Bing the site exists, and then show exactly what people
searched to find it. Without them the church is flying blind.

## Google Search Console
1. Go to https://search.google.com/search-console and sign in with the church-owned Google account.
2. Press "Add property" and choose **Domain** (not URL prefix). Enter `evergreencitycommunity.com`.
3. Google shows a TXT record to add at wherever the domain's DNS is managed (the domain registrar or Vercel's Domains page). Add it, then press Verify. (If DNS access is hard, use "URL prefix" with https://evergreencitycommunity.com and the **HTML tag** option; the site is ready for that: give the code to the developer, who sets `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel and redeploys.)
4. In the left menu choose **Sitemaps** and submit `sitemap.xml`.
5. In **URL Inspection**, paste each page address (home, /location, /about, /pastors, /messages, /give) and press **Request indexing**. This speeds up the first crawl.
6. Add a second owner so access is never lost.

## Bing Webmaster Tools
1. https://www.bing.com/webmasters, sign in, choose **Import from Google Search Console** (fastest).
2. It brings the site and the sitemap across.

## Instant notification to Bing and others (done for you)
The site publishes an "IndexNow" key, and the developer pings it after each release so Bing, Yandex
and DuckDuckGo hear about new pages immediately. Google does not use IndexNow; step 5 above covers Google.

## The same-name rule
Everywhere the church exists online it must say exactly: **Evergreen City Community Church**, **Kazhakootam, Trivandrum**.

## What to look at every month (10 minutes)
Search Console > Performance: which searches brought people, which pages, average position.
Anything showing up on page 2 for a search that matters is the next thing to improve.
