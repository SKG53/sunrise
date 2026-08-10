# Fix Google indexing issues

## Clearing up the "Wix" confusion

Nothing in this project touches Wix. I searched the entire codebase — there is no `/blank-8`, `/blank-7`, or `/product-page/i-m-a-product-*` route anywhere.

Those URLs are leftovers from whatever site previously lived on savorsunrise.com before this one. `blank-N` and `product-page/i-m-a-product-N` are the default auto-generated page names that site builder created. Google crawled them in Nov–Dec 2025, still has them in its "known URLs" list, and re-checks them occasionally. They now hit the 404 page, which is exactly right.

**No action needed on those.** They age out of the report on their own. "Not indexed" is the correct outcome for pages that shouldn't exist.

The "Page with redirect" pair (`http://savorsunrise.com/` and `http://www.savorsunrise.com/`) is also correct behavior — plain http redirecting to the secure www address.

## The actual problem

Every page on the site declares its canonical address as `https://savorsunrise.com/...` (no www), but the live site redirects that to `https://www.savorsunrise.com/...`.

So Google crawls the www page, reads a canonical tag pointing at a non-www address, follows it, gets redirected back to www, and files the page under "Alternate page with proper canonical" instead of indexing it cleanly. That mismatch is the most likely cause of the 11 pages sitting in that bucket.

## What to change

1. **Point all canonicals at the real address.** Update every `canonical` link across the 12 route files to `https://www.savorsunrise.com/...`, matching where the site actually redirects to. Same for the PDP dynamic canonical and the Organization structured data URL in the root.

2. **Add canonical + og:url to the four routes missing them** — `/event-signup`, `/hbe`, `/social`, and the root defaults.

3. **Remove the `noindex` from `/social`.** It was hidden deliberately as a footer easter egg, so confirm before removing — see the open question below.

4. **Add `public/robots.txt`.** The site has none. A basic allow-all plus a pointer to the sitemap.

5. **Add a sitemap at `/sitemap.xml`.** Built as a server route so it stays in sync with the routes automatically. It will list the home page, products index, all live product detail pages, about, faq, find, contact, and the policy pages. It will exclude `/social`, `/event-signup`, `/hbe`, and the 404 route.

6. **Fix the page titles and description on the root.** The root currently says "Lovable App" with a description about transcribing an HTML spec. That is the fallback shown for any page without its own title.

## Not doing

- No redirects for the old site's URLs. They're dead and should stay dead.
- No changes to the `/products?tier=X` filter links — those are query parameters on a page that already declares the clean `/products` canonical, which is correct.

## Technical notes

- Canonical domain becomes `https://www.savorsunrise.com` everywhere, matching the live 302 target.
- Sitemap goes in `src/routes/sitemap[.]xml.ts` as a GET handler returning XML, not a static file, so route changes don't silently desync it.
- No `lastmod` values, since there's no per-page authoritative timestamp to draw from.
- The live product slug list already exists in `products_.$slug.tsx` as `LIVE_SLUGS`; the sitemap will read from the same source rather than duplicating it.
