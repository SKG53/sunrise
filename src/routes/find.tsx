// =============================================================================
// SUNRISE — find.tsx
// Path: src/routes/find.tsx
// Session: SBev.BC.WebsiteDesign.Find.1 · Find route — full build
//
// Renamed from "Near You." CTAs throughout the site keep "Find Near You →"
// as the invitation phrasing; this page's nav label is "Find."
//
// Five sections: Hero, Search, Results (Map + List), Don't See Us, Retailer
// Gateway (dark band). No PtP band — the page is itself the B2C path to
// purchase, and the Retailer Gateway serves as the B2B closing band.
// =============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./find.css";

export const Route = createFileRoute("/find")({
  component: FindPage,
  head: () => ({
    meta: [
      { title: "Find · SUNRISE" },
      {
        name: "description",
        content:
          "Retailers stocking SUNRISE near you. Search by zip, city, or state to see what's available nearby.",
      },
    ],
  }),
});

// ── RETAILER DATA ────────────────────────────────────────────────────────
// Stub dataset for v1. Replace with live retailer API or CMS-backed list
// when backend is selected. Structure kept simple so migration is a swap.
type Category = "Dispensary" | "Liquor" | "Convenience" | "Bar / Restaurant";

type Retailer = {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  category: Category;
  distanceLabel?: string;
};

const RETAILERS: Retailer[] = [
  { name: "Mother Road Liquor", address: "2032 Utica Square", city: "Tulsa", state: "OK", zip: "74114", category: "Liquor", distanceLabel: "— miles" },
  { name: "Brookside Bottle Shop", address: "3810 S Peoria Ave", city: "Tulsa", state: "OK", zip: "74105", category: "Liquor", distanceLabel: "— miles" },
  { name: "Cherry Street Market", address: "1502 E 15th St", city: "Tulsa", state: "OK", zip: "74120", category: "Convenience", distanceLabel: "— miles" },
  { name: "The Hunt Club", address: "224 N Main St", city: "Tulsa", state: "OK", zip: "74103", category: "Bar / Restaurant", distanceLabel: "— miles" },
  { name: "Route 66 Package Store", address: "6110 E Admiral Pl", city: "Tulsa", state: "OK", zip: "74115", category: "Liquor", distanceLabel: "— miles" },
  { name: "Heartland Dispensary", address: "4535 E 51st St", city: "Tulsa", state: "OK", zip: "74135", category: "Dispensary", distanceLabel: "— miles" },
  { name: "Midtown Spirits", address: "2323 E 21st St", city: "Oklahoma City", state: "OK", zip: "73129", category: "Liquor" },
  { name: "Plaza District Market", address: "1801 N Classen Blvd", city: "Oklahoma City", state: "OK", zip: "73106", category: "Convenience" },
];

const CATEGORIES: ("All" | Category)[] = [
  "All",
  "Dispensary",
  "Liquor",
  "Convenience",
  "Bar / Restaurant",
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

// ── COMPONENT ────────────────────────────────────────────────────────────
function FindPage() {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | Category>("All");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RETAILERS.filter((r) => {
      if (stateFilter && r.state !== stateFilter) return false;
      if (activeCategory !== "All" && r.category !== activeCategory) return false;
      if (!q) return true;
      return (
        r.zip.startsWith(q) ||
        r.city.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)
      );
    });
  }, [query, stateFilter, activeCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Results already filter live via useMemo. Submit is a no-op for now;
    // keeps the form semantically correct and ready for backend wiring.
  };

  return (
    <>
      <SiteHeader activeNav="find" />

      <main>
        {/* ── 01 · HERO ─────────────────────────────────────────────────── */}
        <section className="f-hero">
          <div className="container">
            <div className="f-hero-inner">
              <h1 className="f-hero-headline">
                Stocked on real shelves.<br />
                <span className="accent">Near</span> you.
              </h1>
              <p className="f-hero-body">
                Retailers carrying SUNRISE right now. Search by zip, city, or
                state — or browse the list below.
              </p>
            </div>
          </div>
        </section>

        {/* ── 02 · SEARCH ───────────────────────────────────────────────── */}
        <section className="f-search">
          <div className="container">
            <form className="f-search-form" onSubmit={handleSubmit}>
              <label className="f-search-field f-search-field-grow">
                <span className="f-field-label">Zip or city</span>
                <input
                  type="text"
                  className="f-input"
                  placeholder="Enter zip or city"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  inputMode="search"
                  autoComplete="off"
                />
              </label>

              <label className="f-search-field f-search-field-state">
                <span className="f-field-label">State</span>
                <select
                  className="f-select"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                >
                  <option value="">All states</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" className="btn btn-primary f-search-submit">
                Search →
              </button>
            </form>

            <div className="f-filter-row">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={
                    "f-filter-pill" +
                    (activeCategory === cat ? " is-active" : "")
                  }
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 03 · RESULTS (Map + List) ─────────────────────────────────── */}
        <section className="f-results">
          <div className="container">
            <div className="f-results-grid">
              {/* Map placeholder — intentional, not broken. Upgrade to live
                  Google Maps / Mapbox when API + retailer dataset is chosen. */}
              <div className="f-map" aria-label="Map placeholder">
                <svg
                  className="f-map-pin"
                  viewBox="0 0 48 60"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M24 2C12.4 2 3 11.4 3 23c0 14.3 18.3 33 20.1 34.8.5.5 1.3.5 1.8 0C26.7 56 45 37.3 45 23 45 11.4 35.6 2 24 2Z"
                    fill="#CC1F39"
                  />
                  <circle cx="24" cy="23" r="7.5" fill="#FEFBE0" />
                </svg>
                <div className="f-map-label">Interactive map coming soon</div>
                <div className="f-map-sub">Browse the list for retailers near you</div>
              </div>

              <div className="f-results-list">
                <div className="f-results-meta">
                  <span className="f-results-count">
                    {results.length} {results.length === 1 ? "retailer" : "retailers"}
                  </span>
                  {(query || stateFilter || activeCategory !== "All") && (
                    <button
                      type="button"
                      className="f-results-clear"
                      onClick={() => {
                        setQuery("");
                        setStateFilter("");
                        setActiveCategory("All");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {results.length === 0 ? (
                  <div className="f-empty">
                    <p className="f-empty-headline">No retailers match that search.</p>
                    <p className="f-empty-body">
                      Try a different zip, or clear filters to see all locations.
                    </p>
                  </div>
                ) : (
                  <ul className="f-retailer-list">
                    {results.map((r) => (
                      <li key={`${r.name}-${r.zip}`} className="f-retailer">
                        <div className="f-retailer-main">
                          <div className="f-retailer-name">{r.name}</div>
                          <div className="f-retailer-address">
                            {r.address}, {r.city}, {r.state} {r.zip}
                          </div>
                          <div className="f-retailer-tag">{r.category}</div>
                        </div>
                        <div className="f-retailer-right">
                          {r.distanceLabel && (
                            <div className="f-retailer-distance">{r.distanceLabel}</div>
                          )}
                          <a
                            className="f-retailer-directions"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${r.name}, ${r.address}, ${r.city}, ${r.state} ${r.zip}`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Get directions →
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 · DON'T SEE SUNRISE ────────────────────────────────────── */}
        <section className="f-fallback">
          <div className="container">
            <div className="f-fallback-inner">
              <h2 className="f-fallback-headline">
                We're rolling out. <span className="accent">Region</span> by region.
              </h2>
              <p className="f-fallback-body">
                Tell us where you'd like to see SUNRISE on shelves, or order
                online while we catch up to your zip code.
              </p>
              <div className="f-fallback-ctas">
                <a
                  href="/contact?topic=retailer-request"
                  className="btn btn-secondary"
                >
                  Request a Retailer →
                </a>
                <a href="#" className="btn btn-primary">
                  Shop Online →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 · RETAILER GATEWAY (dark band) ─────────────────────────── */}
        <section className="f-gateway">
          <div className="container">
            <div className="f-gateway-inner">
              <div className="f-gateway-left">
                <h2 className="f-gateway-headline">
                  Let's stock <span className="accent-on-color">your</span> shelves.
                </h2>
                <p className="f-gateway-body">
                  Wholesale inquiries welcome. Small-batch craft, full-panel
                  testing, dependable supply — built for retailers who care
                  about what they carry.
                </p>
              </div>
              <div className="f-gateway-right">
                <a href="/contact?topic=wholesale" className="btn btn-on-color">
                  Wholesale Inquiries →
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
