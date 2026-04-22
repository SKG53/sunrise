# SUNRISE Website — Architecture Notes

**Document purpose.** This is the architectural source of truth for the SUNRISE website (repo: `SKG53/sunrise`). It is loaded at the start of every web-build session so that any AI assistant — Claude, Lovable, Claude Code, or future tools — operates within the correct stack constraints without drifting to default React template patterns.

**How to use.** Read this in full before writing any code, producing any Lovable prompt, or making any architectural recommendation about the site. If a request in session conflicts with anything documented here, raise the conflict before acting on it. Do not silently convert to more common patterns because they are easier to recall from training data.

**Document version.** v1. Update whenever an architectural decision changes. Increment version, do not edit in place silently.

---

## 1. Stack — non-negotiable

The SUNRISE site is built on:

- **React 19** (functional components, hooks)
- **TanStack Start** — the SSR / full-stack React framework, not just TanStack Router alone. Key distinction: this framework renders HTML on the server before shipping to the browser.
- **TanStack Router** — file-based routing, used within TanStack Start
- **Vite 7** — build tool, configured via Lovable's opinionated preset
- **Tailwind CSS v4** — the latest major version, using `@tailwindcss/vite` plugin (no `postcss.config.js`, no `tailwind.config.ts` file in the v3 sense)
- **shadcn/ui** — UI component primitives, built on Radix, living in `src/components/ui/`
- **TypeScript strict mode** — `"strict": true` in `tsconfig.json`
- **Bun** — package manager (`bun.lockb`, `bunfig.toml`). npm-style lockfile (`package-lock.json`) coexists for compatibility.
- **Cloudflare Workers** — deployment target. Entry point: `@tanstack/react-start/server-entry`. Configured via `wrangler.jsonc`.
- **Lovable** — primary visual editor. The AI code generator building and iterating on this codebase.

**This is Lovable's TanStack Start preset, not the default Lovable SPA template.** The difference matters: the default Lovable template is a client-side Vite + React SPA with `react-router-dom` and `src/pages/`. That is a **different project architecture** and none of its patterns apply here. See Section 13 for the explicit "do not" list.

---

## 2. Why this stack was chosen

SSR + edge deployment were deliberate architectural choices, not defaults. The reasoning:

1. **SEO parity with every crawler.** SSR ships fully-formed HTML. Google can execute JS, but Bing, DuckDuckGo, LinkedIn previews, Facebook / Twitter / iMessage link scrapers, and AI crawlers mostly cannot. SSR guarantees all of them see content immediately. For a consumer brand with ecommerce ambitions, this is table stakes.
2. **Social sharing previews work.** Open Graph tags only matter if the scraper sees them. On SPAs, scrapers frequently see the empty shell. SSR fixes this.
3. **First-paint performance.** Users see real HTML while JS is still downloading, not a loading spinner.
4. **E-commerce readiness.** Product detail pages are dynamic — they'll eventually pull from Shopify's Storefront API. SSR with `loader` functions is the canonical pattern: the server fetches product data, renders the page, and ships it. This is textbook e-commerce architecture.
5. **Edge deployment via Cloudflare Workers.** Runs the site close to users globally. Also gives easy access to edge-side Shopify API calls, KV storage, R2 for images, and Workers AI if ever needed.

**Deviation cost.** Moving away from this stack requires rebuilding. Keep everything here.

---

## 3. File structure — canonical layout

```
sunrise/
├── .lovable/                      # Lovable project state — do not edit manually
├── public/                        # Static assets served as-is
├── src/
│   ├── components/
│   │   ├── SiteHeader.tsx         # Top nav, shared across all routes
│   │   ├── SiteFooter.tsx         # Footer, shared across all routes
│   │   └── ui/                    # shadcn/ui primitives (button, dialog, etc.)
│   ├── hooks/
│   │   └── use-mobile.tsx
│   ├── lib/
│   │   ├── utils.ts               # cn() helper, misc utilities
│   │   └── sunrise-components.ts  # Brand-mark render functions (wordmark, lockups, stat blocks)
│   ├── routes/
│   │   ├── __root.tsx             # Root layout. Defines <html>, <head>, shell, default meta
│   │   ├── index.tsx              # Home (/)
│   │   ├── about.tsx              # About (/about)
│   │   ├── contact.tsx            # Contact (/contact)
│   │   ├── find.tsx               # Find retailers (/find)
│   │   ├── products.tsx           # Product grid listing (/products)
│   │   ├── products_.$slug.tsx    # Product detail dynamic route (/products/{slug})
│   │   ├── *.css                  # Per-route scoped styles (see Section 8)
│   │   └── routeTree.gen.ts       # AUTO-GENERATED. Never edit by hand.
│   ├── styles/
│   │   └── sunrise-shell.css      # Brand tokens, typography, global classes
│   ├── styles.css                 # Tailwind v4 + shadcn tokens (OKLCH format)
│   └── router.tsx                 # Router factory (createRouter with config)
├── components.json                # shadcn/ui config
├── eslint.config.js
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Minimal — wraps Lovable's TanStack preset
└── wrangler.jsonc                 # Cloudflare Workers config
```

**Important absences — if you see any of these, you're in the wrong template:**
- ❌ No `src/pages/` directory (that's react-router convention, and the SPA template)
- ❌ No `index.html` in repo root (SSR, not SPA)
- ❌ No `postcss.config.js` or `tailwind.config.ts` (Tailwind v4 uses CSS-based config)
- ❌ No `App.tsx` as primary entry (routing is file-based, there is no central App)
- ❌ No `main.tsx` as client entry (handled by TanStack Start)

---

## 4. Routing — TanStack Router conventions

File-based routing. File names map to URL paths using specific conventions.

### 4.1 Naming conventions

| Filename | URL | Notes |
|---|---|---|
| `index.tsx` | `/` | Home |
| `about.tsx` | `/about` | Static route |
| `products.tsx` | `/products` | Static route |
| `products_.$slug.tsx` | `/products/:slug` | Dynamic route. `$slug` = dynamic param. |
| `products.$slug.tsx` (no underscore) | would nest under `/products` layout | ✋ We use the underscore variant |

**Underscore prefix (`products_.$slug.tsx`).** This opts the detail route **out of** the parent `/products` layout. Both routes are siblings that happen to share a URL prefix, not parent-and-child. This is a TanStack convention. Never rename to remove the underscore without understanding the layout consequences.

**`$` prefix for dynamic segments.** `$slug` in the filename maps to a `params.slug` string at runtime.

### 4.2 Route definition pattern

Every route file exports a `Route` constant created via `createFileRoute`:

```ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({ /* meta tags, see Section 6 */ }),
  loader: async () => ({ /* optional: server-side data fetch */ }),
});

function AboutPage() { /* ... */ }
```

The string path inside `createFileRoute(...)` MUST match the file path (TanStack's type generator enforces this; mismatches break builds).

### 4.3 `routeTree.gen.ts` — auto-generated

This file is regenerated every time the dev server detects a route change. **Never edit this file manually.** If it gets corrupted, delete it and restart the dev server — it will regenerate from the `src/routes/` files.

### 4.4 Root layout — `__root.tsx`

Defines the HTML shell: `<html>`, `<head>`, `<body>`. Also defines:
- Site-wide default meta tags
- Default error component (`DefaultErrorComponent`)
- 404 component (`NotFoundComponent`)
- Imports global CSS (`styles.css`, `sunrise-shell.css`)

The `RootShell` component is where `<HeadContent />` (TanStack's meta-injection point) and `<Scripts />` (client JS bundle) are placed. Do not move or rename these.

---

## 5. Data fetching — `loader` and server functions

### 5.1 `loader` — the primary pattern

TanStack Start's `loader` is how routes fetch data server-side before rendering. Runs on the server during SSR; also runs on the client during navigation.

```ts
export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const product = await getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product } = Route.useLoaderData();
  // ...
}
```

**Current state:** `products_.$slug.tsx` uses this pattern. Other routes don't currently need it because their data is static. When Shopify integration happens, `products.tsx` and `products_.$slug.tsx` will both gain loaders that call the Storefront API.

### 5.2 Server functions — `createServerFn`

For actions that must run server-only (API calls with secrets, writes, auth), use `createServerFn`. This exposes a server function that's called from client components but executes server-side. Standard pattern for form submissions, protected Shopify calls, retailer-data reads, contact form handling.

Not yet used in the codebase. When added, follow TanStack Start's docs — don't invent a custom RPC layer.

### 5.3 What NOT to do

- ❌ Do not fetch data in `useEffect` for content that should be SEO-indexed. That defeats SSR — the data only appears after client hydration.
- ❌ Do not call `fetch()` inside component bodies for server data. Use `loader`.
- ❌ Do not put Shopify API tokens or any secrets in client-side code. They must be in server functions or loaders.

---

## 6. SEO — `head()` API

TanStack Start provides a `head()` function per route that declares meta tags. Tags are injected into the server-rendered HTML via the `<HeadContent />` component in `__root.tsx`.

### 6.1 Root defaults (`__root.tsx`)

```ts
head: () => ({
  meta: [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { title: "SUNRISE — Hemp-Infused Delta-9 Seltzer" },
    { name: "description", content: "..." },
    { property: "og:title", content: "..." },
    { property: "og:description", content: "..." },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "https://savorsunrise.com/og-default.png" },
    { name: "twitter:card", content: "summary_large_image" },
    // ... canonical, author, theme-color, etc.
  ],
  links: [
    { rel: "stylesheet", href: appCss },
    { rel: "stylesheet", href: sunriseCss },
    // Font preconnect + preload goes here once refactored, see Section 9
  ],
}),
```

**Current state — needs pre-launch fix.** The live `__root.tsx` still contains Lovable boilerplate (title "Lovable App", author "Lovable", Twitter handle "@Lovable", OG image pointing to a Lovable preview CDN URL). This must be replaced with real SUNRISE values before launch.

### 6.2 Per-route overrides

Each route can override root defaults:

```ts
head: () => ({
  meta: [
    { title: "About · SUNRISE" },
    { name: "description", content: "..." },
    { property: "og:title", content: "About SUNRISE" },
    { property: "og:description", content: "..." },
    { property: "og:image", content: "https://savorsunrise.com/og-about.png" },
    { rel: "canonical", href: "https://savorsunrise.com/about" },
  ],
}),
```

**Current state — minimal but functional.** Every route has a `head()` with title and description. None have per-route OG overrides, canonical URLs, or structured data yet. These should be added as SEO work progresses.

### 6.3 Dynamic head from loader data

The critical pattern for e-commerce:

```ts
head: ({ loaderData }) => {
  const p = loaderData?.product;
  if (!p) return { meta: [{ title: "Product · SUNRISE" }] };
  return {
    meta: [
      { title: `${p.flavor} · ${p.tier}mg THC · SUNRISE` },
      { name: "description", content: `${p.flavor}. ${p.blurb}` },
      { property: "og:image", content: p.ogImageUrl },
    ],
  };
},
```

`products_.$slug.tsx` already uses this pattern. Every SKU will have dynamic per-product meta once all product data is wired.

### 6.4 Planned SEO additions (not yet in code)

These are additive — no architecture change required:
- `public/robots.txt` — `Sitemap: https://savorsunrise.com/sitemap.xml` and standard allow rules
- `sitemap.xml` — either static in `public/` or dynamic via a TanStack server route that generates from the product list
- JSON-LD structured data:
  - `Organization` schema in `__root.tsx`
  - `Product` schema in `products_.$slug.tsx`
  - `BreadcrumbList` on product detail
- Per-route canonical URLs
- Per-SKU OG images (can be generated dynamically via a Cloudflare Worker image route)

### 6.5 Age gate and SEO — critical design rule

The age gate (not yet built) MUST be designed as a client-side overlay that does NOT prevent SSR content from being in the HTML. Crawlers cannot click gates. Content must be server-rendered and indexed; the gate is a visual layer that a human dismisses on first visit. Patterns like "return null until age verified" at the page component level will break SEO.

---

## 7. Styling — three-layer CSS architecture

### 7.1 Layer 1: `src/styles.css` — Tailwind and shadcn tokens

- Imports Tailwind v4 via `@import "tailwindcss" source(none);`
- `@source "../src"` tells Tailwind where to scan for utility class usage
- Imports `tw-animate-css` for animation utilities
- Defines `@theme inline` block mapping CSS custom properties to Tailwind utilities
- Defines `:root` and `.dark` variable blocks in **OKLCH color format** (required — do not use hex or HSL in this file)

### 7.2 Layer 2: `src/styles/sunrise-shell.css` — brand foundation

- Imports Montserrat via Google Fonts (`@import url(...)` — see Section 9, scheduled for refactor)
- Defines brand tokens as CSS custom properties:
  - `--cream: #FEFBE0` (canonical background)
  - `--gold: #C4922A`, `--near-black: #1A1A1A`, etc.
  - Tier colors: `--tier-5`, `--tier-10`, `--tier-30`, `--tier-60`
  - Spacing/sizing tokens: `--base`, `--container-max`, `--section-pad-y`
- Defines shared typographic scale, button base styles, container class
- Defines site header and footer shared styles
- Imported once in `__root.tsx` so it applies globally

### 7.3 Layer 3: `src/routes/*.css` — per-route scoped styles

- Each route has its own CSS file (e.g., `home.css`, `products.css`, `products_.$slug.css`)
- Scoped via class naming conventions (`.home-hero`, `.products-grid`, `.a-s01-section`, etc.)
- Imported at the top of the corresponding `.tsx` route file: `import "./home.css";`
- Route CSS does NOT import fonts, base resets, or anything shared — inherits from sunrise-shell.css

### 7.4 What goes where

| Use case | Layer |
|---|---|
| Tailwind utility classes | Layer 1 |
| Brand color tokens (hex) | Layer 2 |
| Typography scale | Layer 2 |
| Header/footer shared styles | Layer 2 |
| Page-specific layouts | Layer 3 |
| One-off component styles | Layer 3 or inline |

### 7.5 What NOT to do

- ❌ Do not install or configure `postcss.config.js`. Tailwind v4 doesn't need it.
- ❌ Do not create `tailwind.config.ts` (v3 style). All config goes in `styles.css` via `@theme inline`.
- ❌ Do not import fonts from route-level CSS. Fonts are site-wide in `sunrise-shell.css` (will be hoisted to `__root.tsx` head links in a future refactor).
- ❌ Do not mix hex and OKLCH in the same layer. `styles.css` is OKLCH; `sunrise-shell.css` is hex.

---

## 8. Components

### 8.1 Shell components

- `src/components/SiteHeader.tsx` — top nav. Used in every route's JSX.
- `src/components/SiteFooter.tsx` — footer. Used in every route's JSX.

Each route imports and renders both. They are not automatic — adding them to a new route is explicit.

### 8.2 shadcn/ui primitives — `src/components/ui/`

Full shadcn/ui library is installed. These are Radix-based primitives (Button, Dialog, Input, Select, etc.). Use them as the base for any generic UI element.

To add a new shadcn component, use the shadcn CLI:
```
npx shadcn@latest add <component-name>
```
It will install to `src/components/ui/` and respect the config in `components.json`.

### 8.3 Brand component library — `src/lib/sunrise-components.ts`

Critical file. Contains the locked JS render functions for SUNRISE brand marks:
- `renderWordmark(base, bg)` — the SUNRISE wordmark with gradient
- `render5mgLockup`, `render10mgLockup`, `render30mgLockup`, `render60mgLockup` — potency lockups
- `render12ozStatBlock` — the 12 oz / CAN stat block
- `getBasePx()` — responsive base-size helper

**Current usage pattern:** these are called in `useEffect`, with output mounted via `ref.current.innerHTML = ...`. This renders the marks **client-side only** — they don't appear in server-rendered HTML.

**Implication:** for SEO, this is fine (text around marks is server-rendered). For performance, there's a brief flash before marks hydrate. **Future refactor opportunity:** convert these to SSR-compatible React SVG components so marks render server-side. Not urgent, not a blocker.

**Rule:** do not change the output of these functions. They are pixel-accurate brand specifications. If a lockup appears wrong, the issue is in the usage site, not the function.

---

## 9. Fonts — Montserrat

**Current implementation:** Imported via `@import url(...)` at the top of `sunrise-shell.css`. This is the slowest possible font-loading method — the import blocks CSS parsing which blocks rendering.

**Planned refactor** (not done, low-urgency but measurable):
- Move font loading to `__root.tsx` `head.links`:
  ```ts
  links: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" },
  ]
  ```
- Remove the `@import url(...)` from `sunrise-shell.css`
- Consider self-hosting Montserrat via `public/fonts/` with `font-display: swap` for maximum performance

**Rule:** Montserrat is the only site-wide typeface. Ms Madi is used exclusively for Lemonade / Limeade flavor names in brand marks — currently handled inside the brand render functions, not globally loaded.

---

## 10. Deployment — Cloudflare Workers

### 10.1 Configuration

`wrangler.jsonc`:
```json
{
  "name": "tanstack-start-app",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry"
}
```

- `nodejs_compat` — enables Node API polyfills that some libraries (including potential Shopify SDKs) need
- `main` points to TanStack Start's server entry — do not override

### 10.2 Environment variables

For Shopify integration and similar:
- Set via `wrangler secret put <NAME>` for production secrets (never commit)
- Access in server code via `process.env.VARIABLE_NAME` or `context.env.VARIABLE_NAME` depending on TanStack Start's exposure pattern

### 10.3 Build commands

- `npm run dev` — local dev server via Vite
- `npm run build` — production build
- `npm run preview` — serve the production build locally

Deployment happens via Lovable's publish flow. We don't need to run `wrangler deploy` manually.

---

## 11. Lovable integration — what it handles

Lovable is the primary editor. Specifically:

- Builds UI components and pages from natural-language prompts
- Manages `vite.config.ts` via the `@lovable.dev/vite-tanstack-config` package — **do not modify `vite.config.ts` manually** without understanding this dependency
- Tracks state in `.lovable/` directory
- Commits and pushes to `main` on GitHub
- Renders a live preview synced with the GitHub state

### 11.1 Good prompts to Lovable vs. surgical commits

- **Structural work** (new pages, new sections, layout changes) → Lovable prompt
- **Brand-spec precision work** (exact hex codes, exact font weights, pixel-perfect spacing) → produce patch or diff in Claude session, apply via Lovable or direct commit
- **Configuration changes** (wrangler, package.json, tsconfig) → usually direct edit rather than Lovable

### 11.2 Things that will confuse Lovable

If you prompt Lovable with patterns from the default SPA template, it may regenerate files in ways that drift from TanStack Start. Be explicit in prompts:
- Mention "TanStack Start file-based routing" when adding routes
- Specify `head()` for meta, not `<Helmet>` or `<title>` in JSX
- Specify `loader` for data, not `useEffect`
- Reference existing patterns in the codebase as anchors

---

## 12. Current known gaps (status as of v1)

| Item | Severity | Category |
|---|---|---|
| Lovable boilerplate meta in `__root.tsx` | Pre-launch fix required | SEO content |
| No canonical URLs | Pre-launch fix | SEO content |
| No `robots.txt` | Pre-launch fix | SEO technical |
| No `sitemap.xml` | Pre-launch fix | SEO technical |
| No JSON-LD structured data | Pre-launch add | SEO content |
| Per-route OG images missing | Pre-launch add | SEO content |
| Font loading via CSS `@import` | Performance refactor | Performance |
| Brand marks render client-only via innerHTML | Future refactor | Performance |
| Age gate not yet built | Design + build pending | Feature |
| Shopify integration | Planned, not started | Feature |
| `find.tsx` uses stub retailer data | Migrate to API/CMS when selected | Data |

None of these require architectural changes. All are additions or data-level fixes.

---

## 13. Do not — explicit

- ❌ Do not introduce `react-router-dom`. TanStack Router is the router.
- ❌ Do not introduce `@vitejs/plugin-react-swc` as a direct plugin (that's the SPA template). The Lovable TanStack preset handles React via Babel-compatible plugin internally.
- ❌ Do not create `src/pages/`. Routes go in `src/routes/`.
- ❌ Do not create `index.html` at repo root. SSR does not use an HTML shell file.
- ❌ Do not create `postcss.config.js` or `tailwind.config.ts`. Tailwind v4 is CSS-configured.
- ❌ Do not edit `src/routeTree.gen.ts` by hand. It's auto-generated.
- ❌ Do not modify `vite.config.ts` beyond the minimum without understanding the Lovable TanStack preset's behavior.
- ❌ Do not remove or rename `HeadContent` or `Scripts` in `__root.tsx`.
- ❌ Do not convert the site to CSR ("just use React"). The whole point of this setup is SSR.
- ❌ Do not fetch SEO-critical data in `useEffect`. Use `loader`.
- ❌ Do not install Shopify JS SDKs client-side without checking bundle size. Prefer Storefront API GraphQL calls via server functions.
- ❌ Do not block SSR content behind the age gate. Content must be in the HTML; the gate is a visual overlay.
- ❌ Do not change the output of functions in `src/lib/sunrise-components.ts`. They are brand-locked specifications.
- ❌ Do not use hex color values inside `styles.css`. That layer is OKLCH-only. Use hex in `sunrise-shell.css` for brand tokens.

---

## 14. Verification checklist — run at the start of each session

At the start of every session, confirm the architecture hasn't drifted:

1. `cat package.json | grep -E '"(@tanstack/react-start|@lovable.dev/vite-tanstack-config|tailwindcss|react)"'` — confirm stack packages present
2. `ls src/routes/` — confirm routes directory exists (not `src/pages/`)
3. `ls vite.config.ts wrangler.jsonc` — confirm both exist
4. `grep -l "react-router-dom\|@vitejs/plugin-react-swc" package.json` — confirm these are NOT present
5. `grep -l "postcss.config\|tailwind.config.ts" .` — confirm these are NOT present
6. Check recent commits: `git log --oneline -5` — look for any suspicious commits that might have changed architecture

If any check fails, flag immediately before writing any code.

---

## 15. Future-state: how to add things

### Adding a new static route

1. Create `src/routes/<name>.tsx`
2. Create `src/routes/<name>.css` if page-specific styles needed
3. Use `createFileRoute("/<name>")` at top
4. Include a `head()` with title and description minimum
5. Import and render `<SiteHeader />` and `<SiteFooter />`
6. Import route CSS: `import "./<name>.css";`
7. TanStack's dev server regenerates `routeTree.gen.ts` automatically

### Adding a dynamic route

Same as static, but filename uses `$param` convention (e.g., `recipes_.$id.tsx` for `/recipes/:id`). Use underscore prefix to opt out of parent layouts when appropriate. Include a `loader` that fetches by param and a `head` that uses `loaderData`.

### Adding Shopify integration

Outline (not yet implemented):
1. Add Shopify Storefront API token via `wrangler secret put SHOPIFY_STOREFRONT_TOKEN`
2. Create `src/lib/shopify.ts` with a GraphQL client that reads the token server-side
3. In `products.tsx` loader: call Shopify's `products` query, return the list
4. In `products_.$slug.tsx` loader: call `productByHandle(slug)`, return the product
5. Shopping cart: either Shopify's cart API or Shopify's Buy Button embed; decide based on UX requirements
6. Checkout: redirect to Shopify's hosted checkout (simplest) or use headless checkout (more work, more control)

### Adding JSON-LD

Place inside `head()` as a `script` entry:
```ts
head: () => ({
  scripts: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "...",
        // etc.
      }),
    },
  ],
}),
```

---

## 16. Glossary

- **SSR** — Server-Side Rendering. Server generates HTML and ships it. Opposite of CSR (client-side rendering).
- **SPA** — Single-Page Application. JS-heavy, client-rendered. What sunrise-test is and what this project is NOT.
- **Loader** — TanStack Router / Start function that fetches data server-side before a route renders.
- **Server function** — `createServerFn`-wrapped function that runs server-only, callable from client components.
- **Hydration** — The process of attaching JS event handlers to server-rendered HTML once the client JS bundle loads.
- **Head API** — TanStack Start's declarative way to set meta tags per route.
- **OG (Open Graph)** — Meta tags that control social media preview cards.
- **JSON-LD** — Structured data format for SEO-critical schema (Product, Organization, etc.).

---

**End of document. Version 1. Update when architecture changes.**
