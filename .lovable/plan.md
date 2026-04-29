## Goal

Switch the `/social` rotating-can animation from a single sprite-sheet WebP to 10 discrete WebP frames cycled by stacked `<img>` elements with staggered opacity keyframes.

## Heads-up: missing image attachments

You said you're attaching the 10 can images, but only the patch file came through in this message. I only see:

- `user-uploads://SBev.BC.WebsiteDesign.AllPages.26.v3.text-only.patch`

I need all 10 of these before the page will render correctly:

```
lemonade-360-1.webp
lemonade-360-2.webp
lemonade-360-3.webp
lemonade-360-4.webp
lemonade-360-5.webp
lemonade-360-6.webp
lemonade-360-7.webp
lemonade-360-8.webp
lemonade-360-9.webp
lemonade-360-10.webp
```

Please re-attach the 10 WebPs in your next message ("hold to push" may have only sent the patch). Once they're attached I'll execute the plan below in one pass.

## What the patch does

**`src/routes/social.css`**
- Updates the section header comment to describe 10 individual frames (960×1920, q85) instead of the 6000×1200 sprite.
- Removes `overflow: hidden` from `.social-rotator` (no longer needed — frames are absolute and clipped by aspect-ratio).
- Replaces `.social-rotator-strip` (translateX sprite track) with `.social-rotator-frame` — absolute-positioned, `inset: 0`, `object-fit: cover`, starts at `opacity: 0`, runs `social-can-rotate 6s linear infinite`.
- Rewrites `@keyframes social-can-rotate` from a translateX sweep to a hard opacity step: `0%`/`10%` opacity 1, `10.001%`→`100%` opacity 0. Combined with a per-frame `animation-delay` of `(i × 0.6s)`, exactly one frame is visible per 0.6s slot — pure stop-motion, no cross-fade.
- Updates `prefers-reduced-motion` block: targets `.social-rotator-frame`, hides all of them, then re-shows `:first-child` (frame 1, front-facing).

**`src/routes/social.tsx`**
- Replaces the inline comment block with one describing the stacked-frame approach.
- Replaces the single `<div className="social-rotator-strip"><img src="lemonade-360.webp" /></div>` with `[1..10].map(n => <img className="social-rotator-frame" src={`/images/cans/lemonade-360-${n}.webp`} style={{ animationDelay: `${(n-1) * 0.6}s` }} />)`.

## Files to write

1. `src/routes/social.css` — apply hunks (touch only the lines in the patch; preserve everything else, formatting and all).
2. `src/routes/social.tsx` — apply JSX hunk (the single `s04-center` block).
3. `public/images/cans/lemonade-360-1.webp` … `lemonade-360-10.webp` — copy verbatim from your uploads. No resize, no recompress, no rename. The existing `lemonade-360.webp` (the old sprite) stays in place untouched — patch doesn't reference it and removing it isn't in scope.

## Scope fence (per your standing rules)

- No edits outside the two files in the patch + the 10 new image assets.
- No reformatting of untouched lines in `social.css`, no import reordering in `social.tsx`.
- No touching `vite.config.ts`, `wrangler.jsonc`, `package.json`, `tsconfig.json`, `routeTree.gen.ts`, `src/router.tsx`.
- WebPs copied byte-for-byte — no transcoding.

## Verification after apply

- Visit `/social`, confirm the can rotates smoothly through 10 stop-motion steps over 6s.
- Toggle OS "Reduce Motion" → can freezes on frame 1 (front-facing).
- DevTools Network tab: 10 separate `lemonade-360-N.webp` requests, each ~100–190 KB, no `lemonade-360.webp` (sprite) request.

Re-attach the 10 WebPs and I'll execute.