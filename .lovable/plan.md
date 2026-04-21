

# SUNRISE Contact Page — Full Implementation Plan

## Goal
Pixel-faithful React transcription of `SUNRISE_Contact_Page_v2.html`. Custom CSS (no shadcn substitutions, no Tailwind utility approximations). Plain HTML elements styled by global CSS classes carried over verbatim from the spec.

## Transcription Discipline (governs everything below)
Verbatim means verbatim. Every CSS declaration in the spec is ported, including ones I might judge "redundant." No dropping, no merging, no reordering within a rule, no rounding values, no swapping shorthand for longhand or vice versa.

## File Structure

```text
src/
  routes/
    contact.tsx                    # Page route — composes sections
  components/
    sunrise/
      Wordmark.tsx
      PotencyLockup.tsx
      SiteHeader.tsx
      SiteFooter.tsx
      TierCard.tsx
  styles/
    sunrise.css                    # All custom CSS from spec, verbatim
  routes/__root.tsx                # Add Montserrat <link> + import sunrise.css
```

No shadcn used. Class names match the spec exactly (`.site-header`, `.contact-hero`, `.tier-card-5`, etc.).

## CSS Strategy

- `src/styles/sunrise.css` contains the entire `<style>` block from the spec, copied verbatim — `:root` tokens, base resets, `.site-header`, `.contact-hero`, `.tiers-section`, `.contact-grid`, form fields, radio group, footer, `@keyframes fadeRise`, all four media queries (1100/980/860/540).
- Imported in `__root.tsx` (additive — `styles.css` stays; SUNRISE selectors are class-scoped so `:root` tokens don't collide).
- Montserrat 300–900 loaded via Google Fonts `<link>` in `__root.tsx` `head().links`, exactly as the spec.

### Wrapper scoping (sticky-footer + `main { flex: 1 }` preserved verbatim)

The spec's `body` rules combine `min-height: 100vh` + `display: flex` + `flex-direction: column` with `main { flex: 1 }` and `footer { margin-top: auto }` to pin the footer to the viewport bottom. To avoid leaking `body`-level rules to other routes while keeping the layout intact:

- `.sunrise-page` (the wrapper element) receives **every declaration from the spec's `body` rule, verbatim**, including:
  - `min-height: 100vh`
  - `display: flex`
  - `flex-direction: column`
  - `font-family: 'Montserrat', sans-serif`
  - `background: var(--cream)` (or `background-color`, whichever the spec uses — copied as written)
  - `color: var(--near-black)`
  - `-webkit-font-smoothing: antialiased`
  - `-moz-osx-font-smoothing: grayscale`
  - any other declaration present on `body` in the spec, in the original order
- `.sunrise-page *` receives the universal reset only: `margin: 0; padding: 0; box-sizing: border-box;`
- `<main>` keeps the spec's `flex: 1` declaration **verbatim** — not dropped, even though `margin-top: auto` on the footer would suffice on its own. Transcription, not optimization.
- `<footer class="site-footer">` keeps spec-defined `margin-top: auto`.

The CSS selectors `body { … }` and `main { … }` from the spec are rewritten as `.sunrise-page { … }` and `.sunrise-page main { … }` (or `.sunrise-page > main`, matching the spec's specificity intent) so the rules apply only inside the wrapper. Declarations inside each rule are unchanged.

## Component Specs

### `<Wordmark size={number} mode="gradient" | "cream" />`
Direct port of `renderWordmark(base, mode)`. Inline styles preserved exactly: gradient stops `#4F308D → #822665 → #94264B → #BF252D → #CC382C → #DC531F → #E76B37`; `tm_size = base * 0.375`; `spacing = base * 0.125`; `tm_gap = base * -0.104`; `tm_shift = base * 0.095`; weights 500 / 700; cream-mode uses `#FEFBE0`.

### `<PotencyLockup tier={5|10|30|60} size={number} color?={string} />`
Direct port of `renderLockup(dose, defaultColor, base, color)`. Default colors per tier: 5→`#DC7F27`, 10→`#CC1F39`, 30→`#0A6034`, 60→`#2E1E3D`. Math locked: `mg = base * 0.27`, `thc = base * 0.66`, dose letter-spacing `base * -0.105`, `mg` letter-spacing `mg * -0.15`, `thc` letter-spacing `thc * -0.13`, margin offsets `base * 0.15` / `0.11` / `-0.013` / `-0.075`. Weights 900/900/800.

### `<SiteHeader />`
`<header class="site-header">` with `<div class="wordmark-slot"><Wordmark size={28} mode="gradient" /></div>`, `<nav><ul class="site-nav">…</ul></nav>` (Home, Products, About, Near You, Contact — Contact gets `.active`), and `<div class="nav-right">` with `<button class="nav-cta">COAs</button>` and `<button class="nav-cta solid">Shop</button>`.

### `<SiteFooter />`
Dark footer with tagline "Refresh the Way the World Drinks", divider, row containing `<Wordmark size={32} mode="cream" />` + company line ("Brand in a Box, LLC / Tulsa, Oklahoma · USA") and footer links list, then **the full legal disclaimer paragraph and © 2026 SUNRISE line copied verbatim, word-for-word, from the spec** — entire Hemp-derived Delta-9 THC / 21+ / FDA / Farm Bill statement preserved exactly, no paraphrasing, no punctuation/capitalization changes, no quote-style swaps.

### `<TierCard tier={5|10|30|60} eyebrow name desc />`
`<div class="tier-card tier-card-{tier}">` with inner block (eyebrow / `<PotencyLockup tier={tier} size={64} color="#FEFBE0" />` / name / desc) and `.tier-card-arrow` row (`Explore` + `→`). Four cards:
- Tier 01 / 5 / "A Subtle Lift" / "Light · bright · casual"
- Tier 02 / 10 / "The Perfect Buzz" / "Smooth · balanced · social"
- Tier 03 / 30 / "A Deeper Dive" / "Bold · vibrant · spirited"
- Tier 04 / 60 / "Elevated Experience" / "Potent · rich · immersive"

### `contact.tsx` (route)
Wraps everything in `<div class="sunrise-page">`. Renders: `<SiteHeader />`, `<main>` containing `.contact-hero`, `.tiers-section` (heading + 4 `<TierCard />`), `.contact-grid` (form column + direct contact column), then `<SiteFooter />`. Form: controlled state for name/email/inquiry/message; `onSubmit={(e) => e.preventDefault()}`. Radio group: plain `<input type="radio">` + `<label>`. Direct contact column: mailto, tel, address, social row (Instagram / TikTok / LinkedIn) — text-only.

## Animation
Spec's `@keyframes fadeRise` with delays 100ms / 200ms / 300ms is part of the verbatim CSS port. Fires once on mount via CSS.

## Routing
- New route file `src/routes/contact.tsx` → `/contact`.
- Index page left alone.
- `__root.tsx` updated only to inject Montserrat font link and import `sunrise.css`.

## What I will NOT do
- No shadcn components.
- No Tailwind utility approximations for spec values.
- No icon libraries.
- No dark-mode toggle, no skeleton, no scroll-triggered re-animation.
- No second font, no Montserrat fallback substitution.
- No alteration to wordmark gradient stops, lockup multipliers, or any letter-spacing/margin formula.
- No paraphrasing or summarizing of the footer legal disclaimer.
- No dropping of "redundant" CSS declarations (`main { flex: 1 }`, font-smoothing, etc.).
- No form submission wiring beyond `preventDefault`.

## Verification Checklist
- View `/contact` at desktop, then resize through 1100 / 980 / 860 / 540 breakpoints — confirm tier grid collapses 4→2→1, header stacks, contact grid stacks.
- Confirm footer pins to viewport bottom on short content.
- Confirm `main { flex: 1 }` and both font-smoothing declarations are present in compiled CSS.
- Confirm hero, tiers section, and contact grid each fade-rise once on mount with staggered 100/200/300ms delay.
- Confirm wordmark renders with gradient in header, cream in footer.
- Confirm potency lockups in tier cards render in cream on each tier color background.
- Confirm footer legal disclaimer text matches the spec character-for-character.
- Confirm form radio "General" is checked by default; submit does nothing.

