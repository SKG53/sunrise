# Active Potency Cleanup — 2026-05-08

This document records the visual hide of 16 non-live SKUs from the
SUNRISE website. The cleanup is fully reversible — see Section 6.

## 1 · Goal

The SUNRISE catalog ships with 24 SKUs across four potency tiers, but
only 8 SKUs are currently in active production. This cleanup
temporarily narrows the user-facing site to those 8 — the live 10mg
and 60mg lineups — so the public surface matches the active inventory.
The non-live SKUs may go live again in the future, so the cleanup is
designed to revive cleanly with a flag flip and a few uncomments.

The cleanup is purely website-side. It does NOT touch Shopify admin,
DNS, Cloudflare configuration, or any other external service.

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
`// HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — DO NOT DELETE`.

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

This document is updated as patches land. State below reflects the
patches landed on `main` as of 2026-05-08, including the layout-fix
CSS bundle.

### Home page — `src/routes/index.tsx`

- `SHOW_NON_LIVE_PRODUCTS` flag declared
- Imports `render5mgLockup` and `render30mgLockup` commented out
- Paint useEffect lines that call `render5mgLockup` / `render30mgLockup`
  commented out (4 lines). Ref declarations (`lockup5Ref`,
  `lockup30Ref`, `lockup5CardRef`, `lockup30CardRef`) preserved active
  so flag-wrapped JSX inside S06 still compiles.
- `S03_TIER_CARDS` array filtered at render — Blood Orange (5mg) and
  Peach Mango (30mg) cards hidden
- S06 (`s06-tiers`) — `t5` and `t30` cards wrapped in
  `{SHOW_NON_LIVE_PRODUCTS && (...)}`
- S07 image src swaps:
  - `10mg-blueberry-acai-thcv.webp` → `10mg-strawberry.webp`
  - `30mg-cherry-limeade.webp` → `60mg-blood-orange-cbg.webp`
  - `5mg-blood-orange.webp` → `10mg-watermelon.webp`
- Home FAQ copy at lines 40 and 48 rewritten around 10mg / 60mg as
  the two-tier ladder

### Home page CSS — `src/routes/home.css`

- `.s03-card-grid` and `.s06-grid` switched from `repeat(4, 1fr)` to
  `repeat(auto-fit, minmax(0, calc((100% - 3 * gap) / 4)))` plus
  `justify-content: center` so the 2-card variant centers instead of
  left-aligning. Formula yields exactly 1/4 width per track, so the
  4-card revival layout is visually identical to the original.

### Products PLP — `src/routes/products.tsx`

- `SHOW_NON_LIVE_PRODUCTS` flag declared, `LIVE_SLUGS` set declared
- Imports `render5mgLockup` and `render30mgLockup` commented out
- Paint useEffect: 5mg / 30mg branches in panel and switcher loops
  commented out
- Tier switcher `<button>` iteration filtered — only 10mg and 60mg
  buttons render
- Flavor grid filtered — only `LIVE_SLUGS` render (hides 10mg
  cannabinoid variants and 60mg Wild Cherry Peach)
- Deep-link guard — `/products?tier=5` and `/products?tier=30` URLs
  are silently ignored when flag is off; default 10mg panel renders
- Meta description rewritten around two tiers
- 4 FAQ rewrites: q1 (potency picking), q2 (cannabinoid variants —
  dropped "every tier has six" framing), q4 (mixing tiers — example
  changed from 10+30 to 10+60). q3 preserved verbatim (per-serving
  values "5mg" and "30mg" THC are not tier names — see Section 8).

### Products PLP CSS — `src/routes/products.css`

- `.p-switcher-bar` switched from `repeat(4, 1fr)` to
  `repeat(auto-fit, minmax(0, 1fr))` so 2 buttons fill the pill 50/50.
  4-button revival fills 25% each (visually identical to original).
- Tablet (max 768px) override of `.p-switcher-bar` to `repeat(2, 1fr)`
  + border rules now gated on `:has(> .p-switch:nth-child(3))` so the
  2x2 layout only triggers when ≥3 buttons exist. With 2 buttons, the
  desktop auto-fit rule remains in effect at this breakpoint.
- `.p-flavor-grid` converted from CSS Grid (`repeat(3, 1fr)`) to
  flexbox (`flex-wrap: wrap; justify-content: center`) with capped
  `flex-basis` on `.p-flavor-card`. Centers any incomplete last row
  at any count from 1–6, at every breakpoint. Tablet (max 768px) and
  mobile (max 520px) overrides updated to set `flex-basis` instead of
  `grid-template-columns`.

### Products PD — `src/routes/products_.$slug.tsx`

- `SHOW_NON_LIVE_PRODUCTS` flag declared, `LIVE_SLUGS` set declared
- Imports `render5mgLockup` and `render30mgLockup` commented out
- `renderLockup` helper: 5mg and 30mg branches commented out
- Route guard added in loader — non-live slugs throw `notFound()`
  (404 response). The 16 non-live PD pages are unreachable.
- `othersInTier` filtered to live siblings only — related-card grid
  on the 8 live PD pages only links to other live SKUs
- FAQ q1 ("How much THC is in each can") rewritten around 10mg / 60mg.
  q3 preserved verbatim ("30mg per can" cannabinoid load is not a
  tier reference — see Section 8).

### Products PD CSS — `src/routes/products_.$slug.css`

- `.pd-related-grid` converted from CSS Grid (`repeat(5, 1fr)`) to
  flexbox with capped `flex-basis` on `.pd-related-card`. Live PDs
  show 2 (10mg) or 4 (60mg) siblings centered instead of left-aligned.
  5-sibling revival fills row exactly. Tablet (max 1024px) and mobile
  (max 768px) overrides updated to `flex-basis`.

### Footer — `src/components/SiteFooter.tsx`

- `SHOW_NON_LIVE_PRODUCTS` flag declared
- Shop column 5mg and 30mg `<li>` links wrapped in flag

### Pending — not modified by these patches

- `src/lib/shopifyProductMap.ts` — source-of-truth map still contains
  all 24 entries. Functionally hidden because the PD route guard 404s
  before the map is consulted. Can be cleaned up in a follow-up if
  belt-and-suspenders is desired.
- `src/styles/sunrise-shell.css` — CSS tokens `--tier-5` and
  `--tier-30` are preserved as-is. They're referenced by dormant CSS
  rules; safer to leave intact than to delete.

## 6 · Revival procedure

The normal post-cleanup revival path. No Git operations needed beyond
a standard patch flow.

1. In each file modified by this cleanup, change
   `SHOW_NON_LIVE_PRODUCTS = false` → `SHOW_NON_LIVE_PRODUCTS = true`.
2. Uncomment the data array blocks marked
   `// HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — DO NOT DELETE`.
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

> Note: the git tag and branch above were created before this cleanup
> was renamed; their literal names still contain the pre-rename
> phrase. They can be re-tagged / re-branched on GitHub at any time
> without affecting the underlying commit they point to (see Section 6
> for the revival procedure that uses them).

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