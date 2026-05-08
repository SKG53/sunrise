# Payment Processor Cleanup — 2026-05-08

This document records the visual hide of 16 non-live SKUs from the
SUNRISE website for payment processor compliance review. The cleanup
is fully reversible — see Section 6.

## 1 · Goal

A payment processor is reviewing the SUNRISE site. Their review will
inspect what is live and available for purchase. Anything that is not
live but appears on the site as a product, in product imagery, in
catalog data, or in tier-naming could create compliance friction.

The goal of this cleanup is to make the website show **only the 8 SKUs
that are actually live**, with no visible references to the 16 SKUs
that aren't. This must be reversible — the non-live SKUs may go live
in the future, and the site needs to revive cleanly. The cleanup does
NOT touch Shopify admin, DNS, Cloudflare configuration, or any other
external service.

## 2 · Live SKUs (8 total — visible on the site)

**10mg tier — 3 SKUs:**
- `10mg-strawberry`
- `10mg-watermelon`
- `10mg-lemonade`

**60mg tier — 5 SKUs:**
- `60mg-blueberry-lemonade`
- `60mg-passionfruit-mango`
- `60mg-blood-orange-cbg`
- `60mg-blackberry-cbn`
- `60mg-strawberry-kiwi-thcv`

After cleanup, the site presents **two potency tiers** (10mg and 60mg)
instead of four.

## 3 · Non-live SKUs (16 total — hidden from the user-facing site)

**5mg tier — all 6 SKUs:**
- `5mg-blackberry`
- `5mg-blood-orange`
- `5mg-passionfruit-mango`
- `5mg-blueberry-lemonade-cbg`
- `5mg-black-cherry-cbn`
- `5mg-strawberry-peach-thcv`

**10mg cannabinoid variants — 3 SKUs:**
- `10mg-tangerine-cbg`
- `10mg-blackberry-lemonade-cbn`
- `10mg-blueberry-acai-thcv`

**30mg tier — all 6 SKUs:**
- `30mg-peach-mango`
- `30mg-cherry-limeade`
- `30mg-orange-lemonade`
- `30mg-kiwi-watermelon-cbg`
- `30mg-blueberry-pomegranate-cbn`
- `30mg-strawberry-watermelon-thcv`

**60mg — 1 SKU:**
- `60mg-wild-cherry-peach`

## 4 · Approach — Visual hide via flag (Approach B)

Per-file local `const SHOW_NON_LIVE_PRODUCTS = false;` flag governs
JSX-level hides. Data array entries (TIERS, PRODUCTS, shopifyProductMap,
S03_TIER_CARDS) are commented out (NOT deleted) with the marker
`// HIDDEN FOR PAYMENT PROCESSOR REVIEW 2026-05-08 — DO NOT DELETE`.

A route guard on `products_.$slug.tsx` returns 404 for any non-live
slug, so direct URL access (e.g. `/products/5mg-blackberry`) does not
land on a real product detail page.

Image src references on the home page that pointed at non-live SKUs
are swapped to live SKUs. Original `src` values are preserved as
block comments adjacent to the new src.

CSS tokens (`--tier-5`, `--tier-30`) are preserved with comments
noting they are held for revival.

Why this approach over delete: zero information loss. Every line of
code, every image file, every data entry is preserved in the repo. A
future developer reading any affected file sees exactly what is hidden
and how to revive it. Reversal is fast: find/replace
`SHOW_NON_LIVE_PRODUCTS = false` → `true` across the affected files,
and uncomment the data array blocks. See Section 6.

## 5 · Per-file change inventory

This document is updated as patches land. Initial state (Patch 0): no
code files modified yet.

### Home page — `src/routes/index.tsx`

- `SHOW_NON_LIVE_PRODUCTS` flag declared
- Imports `render5mgLockup` and `render30mgLockup` commented out
- Refs `lockup5Ref`, `lockup30Ref`, `lockup5CardRef`, `lockup30CardRef`
  declarations commented out
- Paint useEffect lines that call `render5mgLockup` / `render30mgLockup`
  commented out (4 lines)
- `S03_TIER_CARDS` array — `5mg-blood-orange` and `30mg-peach-mango`
  entries commented out
- S06 (`s06-tiers`) — `t5` and `t30` cards wrapped in
  `{SHOW_NON_LIVE_PRODUCTS && (...)}`
- S07 image src swaps:
  - `10mg-blueberry-acai-thcv.webp` → `10mg-strawberry.webp`
  - `30mg-cherry-limeade.webp` → `60mg-blood-orange-cbg.webp`
  - `5mg-blood-orange.webp` → `10mg-watermelon.webp`
- Home FAQ copy at lines 40 and 48 rewritten around 10mg / 60mg as
  the two-tier ladder

### Other pages — pending

- `src/routes/products.tsx` — pending
- `src/routes/products_.$slug.tsx` — pending (route guard pending)
- `src/components/SiteFooter.tsx` — pending
- `src/lib/shopifyProductMap.ts` — pending
- `src/styles/sunrise-shell.css` — pending (token preservation comments)

## 6 · Revival procedure

The normal end-of-review path. No Git operations needed beyond a
standard patch flow.

1. In each file modified by this cleanup, change
   `SHOW_NON_LIVE_PRODUCTS = false` → `SHOW_NON_LIVE_PRODUCTS = true`.
2. Uncomment the data array blocks marked
   `// HIDDEN FOR PAYMENT PROCESSOR REVIEW 2026-05-08 — DO NOT DELETE`.
3. Uncomment the lockup imports, ref declarations, and paint lines.
4. Optionally revert the S07 image src swaps and home FAQ copy edits
   (or leave them — they aren't strictly tied to non-live SKUs being
   hidden).
5. Remove the route guard in `products_.$slug.tsx`.

For catastrophic recovery (full rollback to pre-cleanup state), use
the backup tag — see Section 7.

## 7 · Backup references

All three references point to commit
`dba76be7a10aeb56eee776829fcac0ec769f1595` (the state of the repo
immediately before this cleanup began).

- **Tag (annotated, with Release page):**
  `v-pre-payment-processor-2026-05-08`
- **Backup branch:**
  `backup/pre-payment-processor-2026-05-08`
- **Downloadable archives:** auto-attached to the Release page
  (.zip and .tar.gz of the entire repo)

Verification commands:

```bash
git fetch origin --tags --force
git rev-list -n 1 v-pre-payment-processor-2026-05-08
# Must equal: dba76be7a10aeb56eee776829fcac0ec769f1595

git rev-list -n 1 origin/backup/pre-payment-processor-2026-05-08
# Must equal: dba76be7a10aeb56eee776829fcac0ec769f1595
```

If either has moved, flag immediately. Backups are immutable by
convention.

## 8 · Outside scope (NOT touched by this cleanup)

The cleanup is purely website-side. None of the following are
modified:

- Shopify product catalog (admin still has all 24 products)
- Domain DNS (Cloudflare)
- Cloudflare Workers configuration
- Wrangler secrets (Shopify Storefront token, etc.)
- Lovable project settings or Knowledge Base

If at some point Shopify admin is also cleaned up (products archived
or deleted), that change is separate and not tracked in this Git
history.

## 9 · Cross-references

Source review chat: `SBev.BC.WebsiteReview.AllPages.1` (handoff
document produced 2026-05-08).

Architectural reference: `/ArchitectureNotes.md` at repo root.

Date: 2026-05-08
Original commit baseline: `dba76be7a10aeb56eee776829fcac0ec769f1595`