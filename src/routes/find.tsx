// Retailer locator. Interactive map paired with a searchable/filterable list.
// Data source: src/data/retailers.ts (shared with S07Map on the home page).
//
// Interaction model:
//   - Map and list always reflect the same filtered result set
//   - Search field: substring match across store name, address, city, zip
//   - State dropdown: restricts to a single state
//   - Pin click → opens info window, highlights + scrolls list row
//   - List row click → pans map, opens info window for that retailer
//   - Clearing all filters returns to US-level view with every marker
//
// SEO — this page ships <meta name="robots" content="noindex, nofollow">
// because the retailer data is currently FABRICATED PLACEHOLDER. Once the
// real retailer list replaces src/data/retailers.ts, remove the noindex
// entry below (look for the "PLACEHOLDER DATA" comment) and request
// re-indexing in Google Search Console.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { loadGoogleMaps, MAP_STYLE } from "../lib/googleMaps";
import { RETAILERS, RETAILER_STATES, type Retailer } from "../data/retailers";
import "./find.css";

export const Route = createFileRoute("/find")({
  component: FindPage,
  head: () => ({
    meta: [
      { title: "Find · SUNRISE" },
      {
        name: "description",
        content:
          "Retailers stocking SUNRISE near you. Search by zip, city, or store name to see what's available nearby.",
      },
      // PLACEHOLDER DATA — remove this robots entry when real retailer data replaces
      // src/data/retailers.ts. See that file's header for the full swap protocol.
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/find" },
    ],
  }),
});

// Stable identifier per retailer for list-to-map coupling.
function retailerId(r: Retailer): string {
  return `${r.name}|${r.address}|${r.zip}`;
}

// ── COMPONENT ────────────────────────────────────────────────────────────
function FindPage() {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Map plumbing — refs survive renders without causing re-renders.
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowRef = useRef<any>(null);
  const mapsApiRef = useRef<any>(null);
  const listItemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RETAILERS.filter((r) => {
      if (stateFilter && r.state !== stateFilter) return false;
      if (!q) return true;
      return (
        r.zip.startsWith(q) ||
        r.city.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)
      );
    });
  }, [query, stateFilter]);

  // ── MAP: initial load ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const containerNode = mapContainerRef.current;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !maps || !containerNode) return;

        mapsApiRef.current = maps;

        const map = new maps.Map(containerNode, {
          center: { lat: 38.5, lng: -96.5 },
          zoom: 4,
          minZoom: 3,
          maxZoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          rotateControl: false,
          scaleControl: false,
          zoomControl: true,
          clickableIcons: false,
          styles: MAP_STYLE,
          backgroundColor: "#f5f3ed",
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new maps.InfoWindow({
          maxWidth: 280,
        });

        // Close info window when clicking empty map area.
        map.addListener("click", () => {
          infoWindowRef.current?.close();
          setSelectedId(null);
        });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("[FindMap]", err);
      });

    return () => {
      cancelled = true;
      // Clear all markers and release map DOM on unmount.
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();
      infoWindowRef.current?.close();
      if (containerNode) containerNode.innerHTML = "";
      mapInstanceRef.current = null;
      mapsApiRef.current = null;
    };
  }, []);

  // ── MAP: sync markers to filtered results ─────────────────────────────
  useEffect(() => {
    const maps = mapsApiRef.current;
    const map = mapInstanceRef.current;
    if (!maps || !map) return;

    const visibleIds = new Set(results.map(retailerId));
    const markers = markersRef.current;

    // Brand-styled pin — matches home map.
    const pinIcon: any = {
      path: maps.SymbolPath.CIRCLE,
      fillColor: "#0A6034",
      fillOpacity: 1,
      strokeColor: "#FEFBE0",
      strokeWeight: 2,
      scale: 7,
    };

    // Remove markers no longer in results.
    for (const [id, marker] of markers) {
      if (!visibleIds.has(id)) {
        marker.setMap(null);
        markers.delete(id);
      }
    }

    // Add markers for new results.
    for (const r of results) {
      const id = retailerId(r);
      if (markers.has(id)) continue;
      const marker = new maps.Marker({
        position: { lat: r.lat, lng: r.lng },
        map,
        icon: pinIcon,
        title: r.name,
      });
      marker.addListener("click", () => {
        openInfoWindowFor(r, marker);
        setSelectedId(id);
        // Scroll list to this retailer.
        const el = listItemRefs.current.get(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      markers.set(id, marker);
    }

    // Fit bounds or reset to US view.
    if (results.length === 0) {
      return; // keep current view; list shows empty state
    }
    if (!query && !stateFilter) {
      // Full dataset — reset to US overview.
      map.setCenter({ lat: 38.5, lng: -96.5 });
      map.setZoom(4);
      return;
    }
    // Filtered — fit bounds. Clamp minimum zoom so a single result doesn't
    // zoom to street level.
    const bounds = new maps.LatLngBounds();
    for (const r of results) {
      bounds.extend({ lat: r.lat, lng: r.lng });
    }
    map.fitBounds(bounds, 48);
    const listenerOnce = maps.event.addListenerOnce(map, "idle", () => {
      if (map.getZoom() > 12) map.setZoom(12);
    });
    // listenerOnce is cleaned up automatically on fire; referencing to
    // satisfy lint without exposing it:
    void listenerOnce;
  }, [results, query, stateFilter]);

  // Open info window for a retailer — shared between pin and list clicks.
  function openInfoWindowFor(r: Retailer, marker: any) {
    const maps = mapsApiRef.current;
    const map = mapInstanceRef.current;
    const iw = infoWindowRef.current;
    if (!maps || !map || !iw) return;
    const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${r.name}, ${r.address}, ${r.city}, ${r.state} ${r.zip}`
    )}`;
    // Minimal HTML inside Google's default InfoWindow frame. Styled
    // via .sr-iw-* classes in find.css.
    const html = `
      <div class="sr-iw">
        <div class="sr-iw-name">${escapeHtml(r.name)}</div>
        <div class="sr-iw-addr">${escapeHtml(r.address)}</div>
        <div class="sr-iw-addr">${escapeHtml(r.city)}, ${escapeHtml(r.state)} ${escapeHtml(r.zip)}</div>
        <a class="sr-iw-link" href="${directionsHref}" target="_blank" rel="noreferrer">Get directions →</a>
      </div>
    `;
    iw.setContent(html);
    iw.open({ anchor: marker, map });
  }

  // Handle list click — pan map and open info window for that retailer.
  function handleListClick(r: Retailer) {
    const id = retailerId(r);
    const map = mapInstanceRef.current;
    const marker = markersRef.current.get(id);
    if (!map || !marker) {
      setSelectedId(id);
      return;
    }
    map.panTo({ lat: r.lat, lng: r.lng });
    if (map.getZoom() < 11) map.setZoom(11);
    openInfoWindowFor(r, marker);
    setSelectedId(id);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Results already filter live via useMemo. Submit is a no-op for now;
    // keeps the form semantically correct and ready for backend wiring.
  };

  return (
    <>
      <SiteHeader activeNav="find" />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="f-pagehero">
          <h1 className="f-pagehero-title" aria-label="Find Us">
            {"Find Us".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · HERO ─────────────────────────────────────────────────── */}
        <section className="f-hero">
          <div className="container">
            <div className="f-hero-inner">
              <h1 className="f-hero-headline">
                Stocked on real shelves<br />
                <span className="accent">Near</span> you
              </h1>
              <p className="f-hero-body">
                Retailers carrying SUNRISE right now. Search by zip, city, or
                store name — or browse the list below.
              </p>
            </div>
          </div>
        </section>

        {/* ── 03 · SEARCH ───────────────────────────────────────────────── */}
        <section className="f-search">
          <div className="container">
            <form className="f-search-form" onSubmit={handleSubmit}>
              <label className="f-search-field f-search-field-grow">
                <span className="f-field-label">Zip, city, or store</span>
                <input
                  type="text"
                  className="f-input"
                  placeholder="e.g. 78701 or Austin or Brookside"
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
                  {RETAILER_STATES.map((s) => (
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
          </div>
        </section>

        {/* ── 04 · RESULTS (Map + List) ─────────────────────────────────── */}
        <section className="f-results">
          <div className="container">
            <div className="f-results-grid">
              <div
                className="f-map"
                ref={mapContainerRef}
                aria-label="Interactive map of SUNRISE retailers"
                role="application"
              />

              <div className="f-results-list">
                <div className="f-results-meta">
                  <span className="f-results-count">
                    {results.length} {results.length === 1 ? "retailer" : "retailers"}
                  </span>
                  {(query || stateFilter) && (
                    <button
                      type="button"
                      className="f-results-clear"
                      onClick={() => {
                        setQuery("");
                        setStateFilter("");
                        setSelectedId(null);
                        infoWindowRef.current?.close();
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {results.length === 0 ? (
                  <div className="f-empty">
                    <p className="f-empty-headline">No retailers match that search</p>
                    <p className="f-empty-body">
                      Try a different zip, or clear filters to see all locations.
                    </p>
                  </div>
                ) : (
                  <ul className="f-retailer-list">
                    {results.map((r) => {
                      const id = retailerId(r);
                      const isSelected = id === selectedId;
                      return (
                        <li
                          key={id}
                          ref={(el) => {
                            if (el) listItemRefs.current.set(id, el);
                            else listItemRefs.current.delete(id);
                          }}
                          className={"f-retailer" + (isSelected ? " is-selected" : "")}
                          onClick={() => handleListClick(r)}
                        >
                          <address className="f-retailer-main">
                            <div className="f-retailer-name">{r.name}</div>
                            <div className="f-retailer-address">
                              {r.address}, {r.city}, {r.state} {r.zip}
                            </div>
                          </address>
                          <div className="f-retailer-right">
                            <a
                              className="f-retailer-directions"
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${r.name}, ${r.address}, ${r.city}, ${r.state} ${r.zip}`,
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Get directions →
                            </a>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 · DON'T SEE SUNRISE (tier-10 flood, PTP-style) ──────────── */}
        <section className="f-fallback">
          <div className="container">
            <div className="f-fallback-inner">
              <div className="f-fallback-copy">
                <h2 className="f-fallback-headline">
                  No store nearby? No problem
                </h2>
                <p className="f-fallback-body">
                  Order SUNRISE direct to your door — or get to know us first.
                </p>
              </div>
              <div className="f-fallback-ctas">
                <a href="/products" className="btn btn-on-color">
                  Shop Online →
                </a>
                <a href="/about" className="btn btn-on-color-ghost">
                  Our Story →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 06 · RETAILER GATEWAY (cream band) ─────────────────────────── */}
        <section className="f-gateway">
          <div className="container">
            <div className="f-gateway-inner">
              <div className="f-gateway-left">
                <h2 className="f-gateway-headline">
                  Let's stock <span className="accent">your</span> shelves
                </h2>
                <p className="f-gateway-body">
                  Wholesale inquiries welcome. Small-batch craft, full-panel
                  testing, dependable supply — built for retailers who care
                  about what they carry.
                </p>
              </div>
              <div className="f-gateway-right">
                <a href="/contact?topic=wholesale" className="btn btn-primary">
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

// Minimal HTML escape for InfoWindow content.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
