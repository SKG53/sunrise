// =============================================================================
// SUNRISE — products.tsx
// Path: src/routes/products.tsx
// Scaffolded placeholder. Design coming in a future session.
// =============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <>
      <SiteHeader activeNav="products" />
      <main className="page-placeholder">
        <div className="container">
          <h1 className="page-placeholder-headline">Products</h1>
          <p className="page-placeholder-body">Page design in progress. Check back soon.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
