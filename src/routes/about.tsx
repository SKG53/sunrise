// =============================================================================
// SUNRISE — about.tsx
// Path: src/routes/about.tsx
// Scaffolded placeholder. Design coming in a future session.
// =============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <SiteHeader activeNav="about" />
      <main className="page-placeholder">
        <div className="container">
          <h1 className="page-placeholder-headline">About</h1>
          <p className="page-placeholder-body">Page design in progress. Check back soon.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
