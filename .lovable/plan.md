## Goal

Flesh out `/event-signup` with brand-styled headings and a full product grid, while keeping the existing form + success message intact.

## Changes

**File:** `src/routes/event-signup.tsx`

### 1. Top heading (above form, always visible)

Add a heading block above the existing form card:
- Line 1: `LEARN MORE ABOUT` — bold black, large display text
- Line 2: `SUNRISE` wordmark (gradient, via `renderWordmark(base * 4, "gradient")`), bigger than line 1, on its own line
- Painted via a ref + `useEffect` using the same `getBasePx()` + `document.fonts.ready` pattern as home/products

### 2. Products section (always visible, below the form/success card)

New section with:
- Heading: `VIEW ALL OUR PRODUCTS BELOW` (same bold black display style as line 1 of the top heading)
- Three rows, one per tier (10MG, 30MG, 60MG), each laid out as: **left column = potency lockup**, **right column = 6 product cards in a responsive grid**

Lockups (left column, painted via refs):
- 10MG → `render10mgLockup`
- 30MG → `render30mgLockup`
- 60MG → `render60mgLockup`

Cards (right column) reuse the existing home `.s03-card` visual pattern: flooded can frame with the flavor color, can image at `/images/cans/{slug}.webp`, name + descriptor below, cream tier lockup top-left, rotated cannabinoid strip on the right edge when applicable. Card data sourced from the `TIERS` constant defined in `src/routes/products.tsx` — the 6 flavors per tier with name, descriptor, flavorColor, and optional cannabinoid. Slug derived with the same `toSlug` helper pattern.

### 3. Buyable vs COMING SOON state

Per-card classification:
- **Buyable (clickable Link to `/products/$slug`, shows "Shop" CTA):**
  - 10MG: Strawberry, Watermelon, Lemonade
  - 60MG: Passionfruit Mango, Wild Cherry Peach, Blueberry Lemonade, Blood Orange +CBG, Blackberry +CBN, Strawberry Kiwi +THCV (all 6)
- **Coming Soon (NOT clickable, no button, COMING SOON outlined badge overlay):**
  - 10MG cannabinoid variants: Tangerine +CBG, Blackberry Lemonade +CBN, Blueberry Acai +THCV
  - All 30MG (all 6 flavors)

Coming Soon cards:
- Same full-color can frame / lockup / flavor flood — no dimming
- Rendered as a `<div>` (not a `<Link>`), non-clickable
- A centered outlined pill badge over the can: `COMING SOON` (cream border + cream text on the flooded background)
- No "Shop" / buy button rendered at all

Buyable cards wrap the can + meta in a `<Link to="/products/$slug">` — matching the home page pattern. No new add-to-cart logic.

### 4. Styles

**File:** `src/routes/contact.css` (already imported by the page) — append a small `.es-*` namespace:
- `.es-top-heading` / `.es-top-heading-line1` / `.es-top-heading-wordmark` — bold black display text, wordmark slot scales fluidly
- `.es-products-heading` — same display style, mirrors line 1
- `.es-tier-row` — CSS grid, `grid-template-columns: minmax(auto, 14rem) 1fr`, gap, stacks to single column on mobile
- `.es-tier-lockup` — left column lockup slot
- `.es-card-grid` — responsive grid for the 6 cards (3-up desktop, 2-up tablet, 1-up mobile)
- `.es-card` / `.es-card-can` / `.es-card-tier` / `.es-card-cannabinoid` / `.es-card-meta` — mirrors `.s03-card-*` from home.css; rules copied locally so this page doesn't depend on home.css
- `.es-coming-soon-badge` — absolute-centered outlined pill (cream 1.5px border, cream text, transparent fill, uppercase, letter-spaced)

### 5. Painting brand marks

One consolidated `useEffect` that:
- Reads `getBasePx()`
- Paints the top wordmark, the 3 tier lockups (left column), and each card's tier lockup + cannabinoid strip
- Re-runs on resize and after `document.fonts.ready`

## Out of scope

- No changes to form fields, submit logic, success message copy, or the backend HubSpot push.
- No new routes, no cart logic, no Shopify calls (cards link to existing `/products/$slug` PDPs).
- No changes to home or products pages.