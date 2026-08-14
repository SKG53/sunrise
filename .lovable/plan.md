# Spin-to-Win Discount Wheel

A branded prize wheel that appears right after the age gate. Free to spin, email required to unlock the code. No third-party plugin — Shopify wheel apps (Privy, Spin-a-Sale) only render inside Shopify-hosted themes, so they can't run on this custom storefront. This is built natively so it matches the brand and uses your real Shopify discount codes.

## Flow

```text
Age gate (YES)
   ↓
Wheel popup appears
   ↓
"SPIN" button → wheel accelerates, decelerates, lands on a segment
   ↓
Prize revealed, but code is masked
   ↓
Email field: "Enter your email to unlock your code"
   ↓
Code revealed + copy button + "Shop Now" link
```

## The wheel

- 8 segments, alternating so the same prize never sits next to itself:
  `10% · 15% · 20% · FREE SHIP · 10% · 15% · 20% · FREE SHIP`
- Brand colors pulled from existing tokens, cycled around the wheel:
  tier-5 orange `#DC7F27`, tier-10 red `#CC1F39`, tier-30 green `#0A6034`,
  tier-60 plum `#2E1E3D`, with cream `#FEFBE0` text and a gold `#C4922A` rim
  and pointer. Same Montserrat uppercase treatment as the rest of the site.
- Rendered as inline SVG (no image assets, sharp at any size), spun with a CSS
  transform and a long ease-out — about 4 seconds, 5+ full rotations before it
  settles.
- Outcome is chosen in code before the animation starts, and the rotation is
  computed to land on that segment. Weights are configurable in one constant,
  so you can make 20% rarer than 10% later without touching the animation.

## Email step

Reuses the existing public newsletter endpoint pattern, with `source: "spin-wheel"`
so wheel signups are separable from footer signups. Validation and duplicate
handling already exist there. The code only renders after a successful submit.

## Frequency

Once per session, matching the age gate — `sessionStorage`. If a visitor already
spun in this session, the popup does not reappear. Because the codes are
one-use-per-customer in Shopify, re-spinning in a new session can't be abused.

## Discount codes

You said you'll generate 4 shared codes. Send me the exact code strings and I'll
wire them into the prize table:

| Prize | Code |
|---|---|
| 10% off | (yours) |
| 15% off | (yours) |
| 20% off | (yours) |
| Free shipping | (yours) |

Recommended setup in Shopify for each: **limit to one use per customer** and
**require the customer's email at checkout**, which enforces the one-per-person
rule you described. I can also create these codes through the Shopify tools if
you'd rather I generate them — just say the word.

## Technical notes

- New `src/components/SpinWheel.tsx` and `src/components/SpinWheel.css`.
- Mounted in `src/routes/__root.tsx` immediately after `<AgeGate />`. It stays
  hidden until the age gate's `sessionStorage` flag is set, so it can never
  render on top of the compliance gate.
- Body scroll lock and focus handling mirror `AgeGate.tsx`. Unlike the age gate,
  this one is dismissable (X button, ESC, backdrop click) — it's marketing,
  not compliance.
- Prize table, weights, and colors live in one exported constant at the top of
  the component file for easy edits.
- Respects `prefers-reduced-motion`: the wheel snaps to the result instead of
  spinning.
