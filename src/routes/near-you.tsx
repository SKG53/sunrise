// =============================================================================
// SUNRISE — near-you.tsx
// Path: src/routes/near-you.tsx
// Scaffolded placeholder. Design coming in a future session.
// =============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

export const Route = createFileRoute("/near-you")({
  component: NearYouPage,
});

function NearYouPage() {
  return (
    <>
      <SiteHeader activeNav="near-you" />
      <main className="page-placeholder">
        <div className="container">
          <h1 className="page-placeholder-headline">Near You</h1>
          <p className="page-placeholder-body">Page design in progress. Check back soon.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
