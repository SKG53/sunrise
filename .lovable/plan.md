

# Combine All Contact Page Files Into One Document

## Goal
Produce a single copy-pasteable document containing the full contents of every file involved in the SUNRISE Contact page, with clear file-path separators so you can split them back apart on your end.

## What will be in the combined document

A single fenced block (or plain text dump) with this structure:

```text
=== FILE: src/styles/sunrise.css ===
<full CSS contents>

=== FILE: src/routes/contact.tsx ===
<full TSX contents>

=== FILE: src/components/sunrise/Wordmark.tsx ===
<full TSX contents>

=== FILE: src/components/sunrise/PotencyLockup.tsx ===
<full TSX contents>

=== FILE: src/components/sunrise/SiteHeader.tsx ===
<full TSX contents>

=== FILE: src/components/sunrise/SiteFooter.tsx ===
<full TSX contents>

=== FILE: src/components/sunrise/TierCard.tsx ===
<full TSX contents>

=== FILE: src/routes/__root.tsx ===
<full TSX contents>

=== FILE: src/routes/index.tsx ===
<full TSX contents>
```

Each section contains the complete, untruncated source of that file. Nothing is summarized, abbreviated, or omitted.

## Format details

- One outer fenced code block so you can copy the whole thing in a single selection.
- File boundaries marked with `=== FILE: <path> ===` so they're easy to spot visually and easy to split programmatically (e.g. `awk`/`split` on that marker).
- Files are emitted in dependency order (CSS first, then leaf components, then page, then root) so a human reading top-to-bottom sees styles before markup.

## Clarification

Note: this will still be one chat message containing source for nine files — it cannot literally become one `.tsx` file because CSS, route files, and components have different roles and TanStack's router requires `src/routes/contact.tsx` to live at that exact path. But the output will be a single copy-paste blob with clear separators, which is what "one thing to copy" means in practice.

If you actually want a downloadable `.zip` of all the files instead of a copy-paste blob, say so and I'll generate that instead.

## What this plan does NOT do

- Does not modify any source files.
- Does not change behavior, styling, or routing.
- Does not collapse multiple components into a single file (would break TanStack's file-based routing and the component boundaries from the approved plan).

