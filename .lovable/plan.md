

# SUNRISE Site Rebuild — Execute 12 Operations

Plan approved previously. Switching to default mode to execute the following operations exactly as specified:

## Operations

1. Rename `src/styles/sunrise.css` → `src/styles/sunrise-shell.css` and overwrite with attached `sunrise-shell.css` (verbatim).
2. Create `src/components/SiteHeader.tsx` from attached file (verbatim).
3. Create `src/components/SiteFooter.tsx` from attached file (verbatim, inline SVGs preserved).
4. Create `src/lib/sunrise-components.ts` from attached file (verbatim).
5. Update `src/routes/__root.tsx`:
   - Swap `../styles/sunrise.css?url` → `../styles/sunrise-shell.css?url`
   - Remove the three Montserrat-related `<link>` entries (preconnect googleapis, preconnect gstatic, Montserrat stylesheet)
   - Preserve `../styles.css?url` import, `RootShell`, `NotFoundComponent`, head meta, `Scripts`, `RootComponent`
6. Create `src/routes/products.tsx` from attached `products.tsx`, wrapped with `createFileRoute('/products')({ component: ProductsPage })`.
7. Create `src/routes/about.tsx` from attached `about.tsx`, wrapped with `createFileRoute('/about')({ component: AboutPage })`.
8. Create `src/routes/near-you.tsx` from attached `near-you.tsx`, wrapped with `createFileRoute('/near-you')({ component: NearYouPage })`.
9. Overwrite `src/routes/contact.tsx` with attached `contact.tsx` (placeholder), wrapped with `createFileRoute('/contact')({ component: ContactPage })`.
10. Create `src/routes/home.css` from attached file (verbatim).
11. Overwrite `src/routes/index.tsx` with attached `home.tsx`, wrapped with `createFileRoute('/')({ component: HomePage })`. Preserve `import "./home.css"`, all `useRef`/`useEffect`/`innerHTML` logic verbatim.
12. Delete stale files:
    - `src/components/sunrise/Wordmark.tsx`
    - `src/components/sunrise/PotencyLockup.tsx`
    - `src/components/sunrise/SiteHeader.tsx`
    - `src/components/sunrise/SiteFooter.tsx`
    - `src/components/sunrise/TierCard.tsx`
    - `src/components/sunrise/` (now-empty directory)

`routeTree.gen.ts` regenerates automatically — not hand-edited.

## Preserved (untouched)

- `src/styles.css` (Tailwind/shadcn baseline)
- `src/router.tsx`
- All `src/components/ui/**` shadcn primitives
- `SUNRISE_Home_v7.html` (reference-only, not committed)

