# Route Spin-to-Win Signups into HubSpot

HubSpot is already wired into this site through the Lovable connector gateway —
the event signup form at `/hbe` creates and updates contacts with it. The spin
wheel is not using it: it posts to `/api/public/newsletter`, which only writes a
row to the Cloud database. Those emails never reach your CRM.

## My two recommendations

**Name capture: first name only.**
Email-only maximizes spins-to-submits, but it leaves you with a HubSpot list you
can't write a good email to — no "Hi Sarah," no personalization tokens, and
contact records that are hard to tell apart. First and last name is the cleanest
CRM record, but three fields stacked under a prize is where people bail. One
extra field is the trade that costs you the least and buys you the most. Last
name isn't worth much for a discount-code list you'll email promotionally.

**Storage: you're mostly right — HubSpot primary, database only as a fallback.**
Your instinct against duplication is correct for the normal path, so I won't
write every signup to both. But one thing to weigh: the HubSpot call goes over
the network and can fail (rate limit, expired key, gateway hiccup). If HubSpot
is the only destination and that call fails, you have two bad options — refuse
to show the code (visitor spun, won, and got nothing) or show it and silently
lose the lead. So: try HubSpot first, and **only if it fails**, write the row to
the existing `newsletter_subscribers` table with `source: "spin-wheel-failed"`
and still hand over the code. No duplication on the happy path, no lost leads on
the unhappy one. If you'd rather have zero database writes at all, say so and
I'll drop the fallback.

## What gets built

**New endpoint: `src/routes/api/public/spin-wheel.ts`**
Modeled directly on the existing event-signup handler — same gateway URL, same
headers, same create-then-PATCH-on-409 pattern for existing contacts.

Properties written to the HubSpot contact:

| Property | Value |
|---|---|
| `email` | submitted email |
| `firstname` | submitted first name |
| `event_signup_source` | `SUNRISE Spin to Win` |
| `message` | `Spin to Win: 10% off — code SPIN10` |

Reusing `event_signup_source` means the same custom property you already filter
on, so you can build a "Spin to Win" smart list exactly the way you built the
Hemp Beverage Expo one.

**Wheel form changes (`src/components/SpinWheel.tsx`)**
- Add a required first-name field above the email field on the reveal step.
- Point the submit at `/api/public/spin-wheel` instead of `/api/public/newsletter`.
- The prize label and code travel with the request so HubSpot records what each
  contact actually won.
- Prize and code are re-derived server-side from the submitted segment index, so
  a tampered request can't inject a fake code into your CRM.

**Validation**
Email regex plus length caps, first name required and capped at 100 characters,
segment index must be a valid integer in range — same defensive shape as the
existing public endpoints.

## Note on the placeholder codes

`SPIN10`, `SPIN15`, `SPIN20`, `SPINSHIP` are still placeholders. Once you send
the real Shopify codes I'll swap them into the prize table — the HubSpot wiring
doesn't depend on them, so this can ship first.
