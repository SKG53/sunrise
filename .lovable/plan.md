

# SUNRISE Site — Find + Contact + Product Detail (Combined Build)

Combined execution plan for Part 1 (Find) + Part 2 (Contact + Product Detail). 14 file operations total across three independent prompts. All files pre-verified locally; full Vite production build passes clean with zero TypeScript errors.

## Operations — 14 total

### Part 1 · Find (8 operations)

1. **CREATE** `src/routes/find.tsx` — verbatim from attached `find.tsx`.
2. **CREATE** `src/routes/find.css` — verbatim from attached `find.css`.
3. **DELETE** `src/routes/near-you.tsx` — entirely removed; replaced by `/find`.
4. **OVERWRITE** `src/components/SiteHeader.tsx` — verbatim from attached `SiteHeader-2.tsx` (nav swap: Near You → Find).
5. **OVERWRITE** `src/components/SiteFooter.tsx` — verbatim from attached `SiteFooter-2.tsx` (footer link swap).
6. **OVERWRITE** `src/routes/index.tsx` — verbatim from attached `index.tsx` (any `/near-you` references → `/find`).
7. **OVERWRITE** `src/routes/products.tsx` — verbatim from attached `products-4.tsx` (link updates).
8. **OVERWRITE** `src/routes/about.tsx` — verbatim from attached `about-3.tsx` (link updates).

### Part 2a · Contact v1 (2 operations)

9. **OVERWRITE** `src/routes/contact.tsx` — verbatim from attached `contact-2.tsx`. Replaces placeholder with full v1: Hero · Form · Direct Channels. Form is controlled React state with success state; submit is a no-op stub with TODO marker for backend wiring (do NOT wire backend). Reason dropdown pre-fills from `?topic=` URL param (`wholesale`, `retailer-request`, `press`, `general`, `support`).
10. **CREATE** `src/routes/contact.css` — verbatim from attached `contact.css`. Scoped `.c-*` styles, no `@font-face`.

### Part 2b · Product Detail Template (2 operations)

11. **CREATE** `src/routes/products.$slug.tsx` — verbatim from attached `products.$slug.tsx`. Single TanStack dynamic route (~573 lines) renders all 24 SKUs from one `PRODUCTS` array at the top of the file. URL pattern: `/products/{tier}mg-{flavor-slug}[-{cannabinoid}]`. Throws `notFound()` on unmatched slug. Sections: Breadcrumb · Hero · Stat Strip · Ingredients · Others in Tier · Cannabinoid Story (variants only) · FAQ · PtP. Uses `activeNav="products"`.
12. **CREATE** `src/routes/products.$slug.css` — verbatim from attached `products.$slug.css`. Scoped `.pd-*` styles, no `@font-face`. Per-SKU color injected inline.

### Auto-regenerated (not hand-edited)

- `src/routeTree.gen.ts` — TanStack Router Vite plugin regenerates on save; new routes (`/find`, `/products/$slug`) added, `/near-you` removed automatically.

## Locked / Untouched

- `src/styles/sunrise-shell.css`
- `src/styles.css`
- `src/lib/sunrise-components.ts`
- `src/lib/utils.ts`
- `src/router.tsx`
- `src/routes/__root.tsx`
- `src/components/ui/**`
- `src/routes/products.css` (Products index list — NOT linked to detail pages in this drop; follow-up)

## Execution order

Operations are file-independent and can execute in any order, but logical sequencing:
1. Part 1 ops 1–8 first (route swap touches header/footer used by Contact + Product Detail).
2. Part 2a ops 9–10 (Contact).
3. Part 2b ops 11–12 (Product Detail).
4. `routeTree.gen.ts` regenerates automatically.

## Post-build verification (per prompt checklists)

- `/find` renders; `/near-you` 404s (or routes to root not-found).
- Header + footer nav links point to `/find`.
- `/contact` renders Hero + Form + Direct Channels. `/contact?topic=wholesale` pre-selects "Wholesale / Retail Partnership" reason. Form submit shows success state without network call.
- `/products/5mg-blackberry`, `/products/10mg-blackberry-lemonade-cbn`, `/products/30mg-cherry-limeade`, `/products/60mg-strawberry-kiwi-thcv` all render. Invalid slug (e.g. `/products/bogus`) triggers `notFound()`. Products nav stays highlighted.

